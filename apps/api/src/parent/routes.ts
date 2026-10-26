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
import { isEmptyDatabase } from "../empty-database";

const parentRouter = new Hono<{ Bindings: Bindings }>();

parentRouter.use("*", authMiddleware());

const demoAcademicYearId = demoAcademicYears.find((year) => year.isActive)?.id ?? "ay_2026_2027";

/**
 * A database failure must surface. The demo year answers only while the
 * database is unseeded; a seeded database without an active year is a
 * configuration error, not a reason to invent one.
 */
async function activeYearId(db: ReturnType<typeof createDb>) {
  const rows = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(eq(academicYears.isActive, true))
    .limit(1);
  if (rows[0]) return rows[0].id;
  if (await isEmptyDatabase(db)) return demoAcademicYearId;
  throw new Error("Tahun ajaran aktif belum ditetapkan");
}

type ComponentRow = { id: string; subjectId: string; weightPercentage: number };
type AttendanceRow = { status: string };
type InvoiceRow = typeof demoInvoices[number];
type GradeRow = typeof demoStudentGrades[number];

const demoComponentsFor = (yearId: string): ComponentRow[] =>
  demoAssessmentComponents
    .filter((component) => component.academicYearId === yearId)
    .map((component) => ({
      id: component.id,
      subjectId: component.subjectId,
      weightPercentage: component.weightPercentage,
    }));

// GET /api/parent/children
parentRouter.get("/children", async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);

  try {
    const yearId = await activeYearId(db);
    const empty = await isEmptyDatabase(db);

    const links = await db
      .select({ studentId: guardianStudents.studentId })
      .from(guardianStudents)
      .where(eq(guardianStudents.guardianId, user.sub));
    let studentIds = links.map((link) => link.studentId);

    if (studentIds.length === 0 && empty) {
      // Never-seeded database: fall back to the demo guardian links.
      const demoGuardian = demoUsers.find((candidate) => candidate.username === user.username);
      if (demoGuardian) {
        studentIds = demoGuardianStudents
          .filter((link) => link.guardianId === demoGuardian.id)
          .map((link) => link.studentId);
      }
    }

    const componentRows = await db
      .select({
        id: assessmentComponents.id,
        subjectId: assessmentComponents.subjectId,
        weightPercentage: assessmentComponents.weightPercentage,
      })
      .from(assessmentComponents)
      .where(eq(assessmentComponents.academicYearId, yearId));
    const components =
      componentRows.length > 0 ? componentRows : empty ? demoComponentsFor(yearId) : [];

    const children = await Promise.all(
      studentIds.map(async (studentId) => {
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

        const studentRow =
          studentRows[0] ?? (empty ? demoUsers.find((candidate) => candidate.id === studentId) : undefined);
        const enrollment = enrollmentRows[0];
        const classroom = enrollment
          ? (
              await db
                .select()
                .from(classrooms)
                .where(eq(classrooms.id, enrollment.classroomId))
                .limit(1)
            )[0]
          : empty
            ? demoClassrooms.find(
                (candidate) =>
                  candidate.id ===
                  demoEnrollments.find((link) => link.studentId === studentId)?.classroomId
              )
            : undefined;

        const attendanceRows: AttendanceRow[] =
          attendanceData.length > 0
            ? attendanceData
            : empty
              ? demoAttendanceRecords.filter((record) => record.studentId === studentId)
              : [];
        const invoiceRows: InvoiceRow[] =
          invoiceData.length > 0
            ? invoiceData
            : empty
              ? demoInvoices.filter((invoice) => invoice.studentId === studentId)
              : [];
        const gradeRows: GradeRow[] =
          gradeData.length > 0
            ? gradeData
            : empty
              ? demoStudentGrades.filter((grade) => grade.studentId === studentId)
              : [];

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
                (
                  finalScores.reduce((total, score) => total + score, 0) / finalScores.length
                ).toFixed(2)
              )
            : 0;

        const unpaid = invoiceRows.filter(
          (invoice) => invoice.status !== "paid" && invoice.status !== "void"
        );

        return {
          id: studentId,
          name: studentRow?.fullName ?? "Siswa",
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
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat data anak", message: String(err) }, 500);
  }
});

export { parentRouter };
