import { Hono } from "hono";
import { Bindings } from "../index";
import { authMiddleware } from "../auth/middleware";
import {
  academicYears,
  assessmentComponents,
  attendanceRecords,
  classrooms,
  createDb,
  demoAcademicYears,
  demoAssessmentComponents,
  demoAttendanceRecords,
  demoClassrooms,
  demoEnrollments,
  demoGuardianStudents,
  demoInvoices,
  demoStudentGrades,
  demoUsers,
  eq,
  guardianStudents,
  invoices,
  studentEnrollments,
  studentGrades,
  users,
} from "@school-erp/db";
import { summarizeAttendance } from "../attendance/summary";
import { calculateFinalScore } from "../gradebook/score";

const parentRouter = new Hono<{ Bindings: Bindings }>();

parentRouter.use("*", authMiddleware());

async function activeYearId(db: ReturnType<typeof createDb>) {
  try {
    const rows = await db
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(eq(academicYears.isActive, true))
      .limit(1);
    if (rows[0]) return rows[0].id;
  } catch {
    // fallback below
  }
  return demoAcademicYears.find((year) => year.isActive)?.id ?? "ay_2026_2027";
}

// GET /api/parent/children
parentRouter.get("/children", async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);
  const yearId = await activeYearId(db);

  let studentIds: string[] = [];
  try {
    const links = await db
      .select({ studentId: guardianStudents.studentId })
      .from(guardianStudents)
      .where(eq(guardianStudents.guardianId, user.sub));
    studentIds = links.map((link) => link.studentId);
  } catch {
    // fallback below
  }

  if (studentIds.length === 0) {
    const demoGuardian = demoUsers.find((candidate) => candidate.username === user.username);
    if (demoGuardian) {
      studentIds = demoGuardianStudents
        .filter((link) => link.guardianId === demoGuardian.id)
        .map((link) => link.studentId);
    }
  }

  let components: Array<{ id: string; subjectId: string; weightPercentage: number }> = [];
  try {
    components = await db
      .select({
        id: assessmentComponents.id,
        subjectId: assessmentComponents.subjectId,
        weightPercentage: assessmentComponents.weightPercentage,
      })
      .from(assessmentComponents)
      .where(eq(assessmentComponents.academicYearId, yearId));
  } catch {
    components = demoAssessmentComponents
      .filter((component) => component.academicYearId === yearId)
      .map((component) => ({
        id: component.id,
        subjectId: component.subjectId,
        weightPercentage: component.weightPercentage,
      }));
  }
  if (components.length === 0) {
    components = demoAssessmentComponents
      .filter((component) => component.academicYearId === yearId)
      .map((component) => ({
        id: component.id,
        subjectId: component.subjectId,
        weightPercentage: component.weightPercentage,
      }));
  }

  const children = await Promise.all(
    studentIds.map(async (studentId) => {
      let student: { id: string; fullName: string } | undefined = demoUsers.find(
        (candidate) => candidate.id === studentId
      );
      let classroom = demoClassrooms.find(
        (candidate) =>
          candidate.id ===
          demoEnrollments.find((enrollment) => enrollment.studentId === studentId)?.classroomId
      );
      let attendanceRows: Array<{ status: string }> = demoAttendanceRecords.filter(
        (record) => record.studentId === studentId
      );
      let invoiceRows = demoInvoices.filter((invoice) => invoice.studentId === studentId);
      let gradeRows = demoStudentGrades.filter((grade) => grade.studentId === studentId);

      try {
        const [studentRows, enrollmentRows, attendanceData, invoiceData, gradeData] =
          await Promise.all([
            db.select().from(users).where(eq(users.id, studentId)).limit(1),
            db
              .select({ classroomId: studentEnrollments.classroomId })
              .from(studentEnrollments)
              .where(eq(studentEnrollments.studentId, studentId))
              .limit(1),
            db
              .select({ status: attendanceRecords.status })
              .from(attendanceRecords)
              .where(eq(attendanceRecords.studentId, studentId)),
            db.select().from(invoices).where(eq(invoices.studentId, studentId)),
            db.select().from(studentGrades).where(eq(studentGrades.studentId, studentId)),
          ]);

        if (studentRows[0]) student = studentRows[0];
        if (enrollmentRows[0]) {
          const classroomRows = await db
            .select()
            .from(classrooms)
            .where(eq(classrooms.id, enrollmentRows[0].classroomId))
            .limit(1);
          if (classroomRows[0]) classroom = classroomRows[0];
        }
        if (attendanceData.length > 0) attendanceRows = attendanceData;
        if (invoiceData.length > 0) invoiceRows = invoiceData;
        if (gradeData.length > 0) gradeRows = gradeData;
      } catch {
        // fallback data above
      }

      const subjectScores = new Map<string, Array<{ weight: number; score: number | null }>>();
      for (const component of components) {
        const grade = gradeRows.find((candidate) => candidate.componentId === component.id);
        const bucket = subjectScores.get(component.subjectId) ?? [];
        bucket.push({ weight: component.weightPercentage, score: grade?.score ?? null });
        subjectScores.set(component.subjectId, bucket);
      }

      const finalScores = Array.from(subjectScores.values())
        .map((bucket) => calculateFinalScore(bucket))
        .filter((score) => score > 0);
      const gpa =
        finalScores.length > 0
          ? Number(
              (finalScores.reduce((total, score) => total + score, 0) / finalScores.length).toFixed(2)
            )
          : 0;

      const unpaid = invoiceRows.filter(
        (invoice) => invoice.status !== "paid" && invoice.status !== "void"
      );

      return {
        id: studentId,
        name: student?.fullName ?? "Siswa",
        nisn: "-",
        classroom: classroom?.name ?? "-",
        gradeLevel: classroom?.gradeLevel ?? 0,
        attendancePercentage: `${summarizeAttendance(attendanceRows).percentage}%`,
        unpaidInvoicesCount: unpaid.length,
        totalUnpaidAmount: unpaid.reduce((total, invoice) => total + invoice.amount, 0),
        gpa,
      };
    })
  );

  return c.json({ data: children });
});

export { parentRouter };
