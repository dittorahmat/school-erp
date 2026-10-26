import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import {
  academicYears,
  and,
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
  demoStudentGrades,
  demoSubjects,
  demoUsers,
  desc,
  eq,
  guardianStudents,
  studentEnrollments,
  studentGrades,
  subjects,
  users,
} from "@school-erp/db";
import { summarizeAttendance } from "../attendance/summary";
import { calculateFinalScore, predicateFor } from "./score";
import { isEmptyDatabase } from "../empty-database";

const gradebookRouter = new Hono<{ Bindings: Bindings }>();

gradebookRouter.use("*", authMiddleware());

const saveSchema = z.object({
  subjectId: z.string().min(1),
  grades: z
    .array(
      z.object({
        studentId: z.string().min(1),
        componentId: z.string().min(1),
        score: z.number().min(0).max(100),
      })
    )
    .min(1),
});

const demoAcademicYearId = demoAcademicYears.find((year) => year.isActive)?.id ?? "ay_2026_2027";

/**
 * A database failure must surface. The demo year answers only while the
 * database is unseeded; a seeded database without an active year is a
 * configuration error, not a reason to invent one.
 */
async function getActiveYearId(db: ReturnType<typeof createDb>) {
  const rows = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(eq(academicYears.isActive, true))
    .limit(1);
  if (rows[0]) return rows[0].id;
  if (await isEmptyDatabase(db)) return demoAcademicYearId;
  throw new Error("Tahun ajaran aktif belum ditetapkan");
}

async function canReadStudent(
  db: ReturnType<typeof createDb>,
  user: { sub: string; username: string; role: string },
  studentId: string
) {
  if (user.role === "admin" || user.role === "teacher") return true;
  if (studentId === user.sub) return true;
  if (user.role !== "guardian") return false;

  const links = await db
    .select({ id: guardianStudents.id })
    .from(guardianStudents)
    .where(
      and(eq(guardianStudents.guardianId, user.sub), eq(guardianStudents.studentId, studentId))
    )
    .limit(1);
  if (links.length > 0) return true;
  if (!(await isEmptyDatabase(db))) return false;

  // Never-seeded database: fall back to the demo guardian links.
  const demoGuardian = demoUsers.find((candidate) => candidate.username === user.username);
  return Boolean(
    demoGuardian &&
      demoGuardianStudents.some(
        (link) => link.guardianId === demoGuardian.id && link.studentId === studentId
      )
  );
}

// GET /api/gradebook/scores?subjectId=&classroomId=
gradebookRouter.get("/scores", requireRoles("admin", "teacher"), async (c) => {
  const db = createDb(c.env.DB);
  const subjectId = c.req.query("subjectId") ?? "sub_mat";
  const classroomId = c.req.query("classroomId") ?? "cls_10_mipa_1";

  let subject: { name: string } | undefined;
  let classroom: { name: string; homeroomTeacherId?: string | null } | undefined;
  let componentRows: Array<{ id: string; name: string; weightPercentage: number }>;
  let studentRows: Array<{ id: string; name: string }>;
  let gradeRows: Array<{ studentId: string; componentId: string; score: number }>;
  let teacher = "Guru Pengampu";

  try {
    const yearId = await getActiveYearId(db);

    const [subjectsFound, classroomsFound, componentsFound, enrollmentsFound, gradesFound] =
      await Promise.all([
        db.select().from(subjects).where(eq(subjects.id, subjectId)).limit(1),
        db.select().from(classrooms).where(eq(classrooms.id, classroomId)).limit(1),
        db
          .select()
          .from(assessmentComponents)
          .where(
            and(
              eq(assessmentComponents.subjectId, subjectId),
              eq(assessmentComponents.academicYearId, yearId)
            )
          )
          .orderBy(assessmentComponents.name),
        db
          .select({ id: users.id, name: users.fullName })
          .from(studentEnrollments)
          .innerJoin(users, eq(studentEnrollments.studentId, users.id))
          .where(eq(studentEnrollments.classroomId, classroomId))
          .orderBy(users.fullName),
        db.select().from(studentGrades),
      ]);

    const empty = await isEmptyDatabase(db);

    subject = subjectsFound[0] ?? (empty ? demoSubjects.find((item) => item.id === subjectId) : undefined);
    classroom =
      classroomsFound[0] ?? (empty ? demoClassrooms.find((item) => item.id === classroomId) : undefined);

    const componentsSource =
      componentsFound.length > 0
        ? componentsFound
        : empty
          ? demoAssessmentComponents.filter(
              (component) =>
                component.subjectId === subjectId && component.academicYearId === yearId
            )
          : [];
    componentRows = componentsSource.map((component) => ({
      id: component.id,
      name: component.name,
      weightPercentage: component.weightPercentage,
    }));

    studentRows =
      enrollmentsFound.length > 0
        ? enrollmentsFound
        : empty
          ? demoEnrollments
              .filter((enrollment) => enrollment.classroomId === classroomId)
              .map((enrollment) => ({
                id: enrollment.studentId,
                name:
                  demoUsers.find((candidate) => candidate.id === enrollment.studentId)?.fullName ??
                  "Siswa",
              }))
          : [];

    gradeRows = (gradesFound.length > 0 ? gradesFound : empty ? demoStudentGrades : []).map(
      (grade) => ({
        studentId: grade.studentId,
        componentId: grade.componentId,
        score: grade.score,
      })
    );

    if (classroom?.homeroomTeacherId) {
      const teacherRows = await db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, classroom.homeroomTeacherId))
        .limit(1);
      if (teacherRows[0]) teacher = teacherRows[0].fullName;
    }
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat buku nilai", message: String(err) }, 500);
  }

  const componentList = componentRows.map((component) => ({
    id: component.id,
    name: component.name,
    weight: component.weightPercentage,
  }));

  const students = studentRows.map((student) => {
    const scores: Record<string, number> = {};
    for (const component of componentList) {
      const grade = gradeRows.find(
        (candidate) =>
          candidate.studentId === student.id && candidate.componentId === component.id
      );
      if (grade) scores[component.id] = grade.score;
    }
    const finalScore = calculateFinalScore(
      componentList.map((component) => ({ weight: component.weight, score: scores[component.id] }))
    );
    return {
      id: student.id,
      name: student.name,
      scores,
      finalScore,
      predicate: finalScore > 0 ? predicateFor(finalScore) : "-",
    };
  });

  return c.json({
    subjectId,
    subject: `${subject?.name ?? "Mata Pelajaran"} (${classroom?.name ?? "Kelas"})`,
    teacher,
    components: componentList,
    students,
  });
});

// POST /api/gradebook/save (Guru / Admin)
gradebookRouter.post("/save", requireRoles("admin", "teacher"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid gradebook submission" }, 400);
  }

  const db = createDb(c.env.DB);

  try {
    const yearId = await getActiveYearId(db);
    const components = await db
      .select()
      .from(assessmentComponents)
      .where(
        and(
          eq(assessmentComponents.subjectId, parsed.data.subjectId),
          eq(assessmentComponents.academicYearId, yearId)
        )
      );
    const validComponentIds = new Set(components.map((component) => component.id));

    for (const grade of parsed.data.grades) {
      if (!validComponentIds.has(grade.componentId)) {
        return c.json({ error: `Komponen nilai ${grade.componentId} tidak valid` }, 400);
      }
    }

    let saved = 0;
    for (const grade of parsed.data.grades) {
      const existing = await db
        .select({ id: studentGrades.id })
        .from(studentGrades)
        .where(
          and(
            eq(studentGrades.studentId, grade.studentId),
            eq(studentGrades.componentId, grade.componentId)
          )
        )
        .limit(1);

      if (existing[0]) {
        await db
          .update(studentGrades)
          .set({ score: grade.score })
          .where(eq(studentGrades.id, existing[0].id));
      } else {
        await db.insert(studentGrades).values({
          id: `grade_${Date.now()}_${saved}_${Math.random().toString(36).slice(2, 6)}`,
          studentId: grade.studentId,
          componentId: grade.componentId,
          score: grade.score,
          notes: null,
          createdAt: new Date(),
        });
      }
      saved += 1;
    }

    return c.json({ message: "Nilai siswa berhasil disimpan", totalSaved: saved });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menyimpan nilai", message: String(err) }, 500);
  }
});

// GET /api/gradebook/report-card?studentId=
gradebookRouter.get("/report-card", async (c) => {
  const db = createDb(c.env.DB);
  const user = c.get("user");
  const studentId = c.req.query("studentId") || user.sub;

  if (!(await canReadStudent(db, user, studentId))) {
    return c.json({ error: "Forbidden: tidak berhak melihat rapor siswa ini" }, 403);
  }

  let yearId: string;
  try {
    yearId = await getActiveYearId(db);
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat tahun ajaran", message: String(err) }, 500);
  }

  let student: { fullName: string } | undefined;
  let classroomName = "-";
  let yearLabel = "-";
  let subjectRows: Array<{ id: string; name: string }> = [];
  let componentRows: Array<{
    id: string;
    subjectId: string;
    weightPercentage: number;
  }> = [];
  let gradeRows: Array<{ componentId: string; score: number }> = [];
  let attendanceRows: Array<{ status: string }> = [];

  try {
    const empty = await isEmptyDatabase(db);
    const [studentRows, enrollmentRows, yearRows, subjectsList, componentsList, gradesList] =
      await Promise.all([
        db.select().from(users).where(eq(users.id, studentId)).limit(1),
        db
          .select({ classroomId: studentEnrollments.classroomId })
          .from(studentEnrollments)
          .where(eq(studentEnrollments.studentId, studentId))
          .limit(1),
        db.select().from(academicYears).where(eq(academicYears.id, yearId)).limit(1),
        db.select().from(subjects).orderBy(subjects.name),
        db
          .select()
          .from(assessmentComponents)
          .where(eq(assessmentComponents.academicYearId, yearId)),
        db.select().from(studentGrades).where(eq(studentGrades.studentId, studentId)),
      ]);

    const enrollment = enrollmentRows[0];
    const studentRow = studentRows[0] ?? (empty ? demoUsers.find((item) => item.id === studentId) : undefined);
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
            (item) =>
              item.id ===
              demoEnrollments.find((link) => link.studentId === studentId)?.classroomId
          )
        : undefined;
    const year = yearRows[0] ?? (empty ? demoAcademicYears.find((item) => item.id === yearId) : undefined);

    student = studentRow;
    classroomName = classroom?.name ?? "-";
    yearLabel = year
      ? `${year.name} ${year.semester === "even" ? "Genap" : "Ganjil"}`
      : "-";
    subjectRows =
      subjectsList.length > 0 ? subjectsList : empty ? demoSubjects : [];
    componentRows =
      componentsList.length > 0
        ? componentsList
        : empty
          ? demoAssessmentComponents.filter(
              (component) => component.academicYearId === yearId
            )
          : [];
    gradeRows =
      gradesList.length > 0
        ? gradesList
        : empty
          ? demoStudentGrades.filter((grade) => grade.studentId === studentId)
          : [];

    attendanceRows = await db
      .select({ status: attendanceRecords.status })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, studentId));
    if (attendanceRows.length === 0 && empty) {
      attendanceRows = demoAttendanceRecords.filter((record) => record.studentId === studentId);
    }
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat rapor", message: String(err) }, 500);
  }

  const reportSubjects = subjectRows
    .map((subject) => {
      const components = componentRows.filter((component) => component.subjectId === subject.id);
      if (components.length === 0) return null;

      const score = calculateFinalScore(
        components.map((component) => ({
          weight: component.weightPercentage,
          score: gradeRows.find((grade) => grade.componentId === component.id)?.score,
        }))
      );
      if (score === 0) return null;

      return {
        name: subject.name,
        score,
        predicate: predicateFor(score),
        notes:
          score >= 85
            ? "Sangat baik dan konsisten dalam penguasaan materi."
            : "Baik, perlu peningkatan pada latihan mandiri.",
      };
    })
    .filter((subject): subject is NonNullable<typeof subject> => subject !== null);

  const gpa =
    reportSubjects.length > 0
      ? Number(
          (
            reportSubjects.reduce((total, subject) => total + subject.score, 0) /
            reportSubjects.length
          ).toFixed(2)
        )
      : 0;

  return c.json({
    student: {
      id: studentId,
      name: student?.fullName ?? "Siswa",
      nisn: "-",
      classroom: classroomName,
      academicYear: yearLabel,
    },
    subjects: reportSubjects,
    attendanceSummary: summarizeAttendance(attendanceRows),
    gpa,
  });
});

export { gradebookRouter };
