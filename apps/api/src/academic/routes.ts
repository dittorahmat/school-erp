import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import {
  createDb,
  academicYears,
  classrooms,
  subjects,
  studentEnrollments,
  users,
  demoAcademicYears,
  demoClassrooms,
  demoEnrollments,
  demoSubjects,
  demoUsers,
  desc,
  eq,
} from "@school-erp/db";
import { isEmptyDatabase } from "../empty-database";

const academicRouter = new Hono<{ Bindings: Bindings }>();

academicRouter.use("*", authMiddleware());

const fallbackActiveYear = demoAcademicYears.find((year) => year.isActive) ?? demoAcademicYears[0];

/** A database failure must surface, not silently resolve to the demo calendar. */
function findActiveYear(db: ReturnType<typeof createDb>) {
  return db
    .select()
    .from(academicYears)
    .where(eq(academicYears.isActive, true))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

// GET /api/academic/years
academicRouter.get("/years", async (c) => {
  const db = createDb(c.env.DB);
  let years: Array<typeof academicYears.$inferSelect> = [];

  try {
    years = await db.select().from(academicYears).orderBy(desc(academicYears.createdAt));
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat tahun ajaran", message: String(err) }, 500);
  }

  if (years.length === 0 && (await isEmptyDatabase(db))) {
    years = demoAcademicYears.map((year) => ({
      id: year.id,
      name: year.name,
      isActive: year.isActive ?? false,
      semester: year.semester ?? "odd",
      startDate: year.startDate ?? null,
      endDate: year.endDate ?? null,
      createdAt: year.createdAt ?? new Date(),
    }));
  }

  if (c.req.query("active") === "true") {
    const active = years.find((year) => year.isActive) ?? fallbackActiveYear;
    return c.json({ data: active });
  }

  return c.json({ data: years });
});

// POST /api/academic/years (Hanya Admin)
academicRouter.post("/years", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    name: z.string().min(4),
    semester: z.enum(["odd", "even"]).default("odd"),
    isActive: z.boolean().default(false),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid academic year payload" }, 400);
  }

  const db = createDb(c.env.DB);
  const id = `ay_${Date.now()}`;

  try {
    if (parsed.data.isActive) {
      await db.update(academicYears).set({ isActive: false });
    }
    await db.insert(academicYears).values({
      id,
      name: parsed.data.name,
      semester: parsed.data.semester,
      isActive: parsed.data.isActive,
      startDate: parsed.data.startDate ?? null,
      endDate: parsed.data.endDate ?? null,
      createdAt: new Date(),
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menyimpan tahun ajaran", message: String(err) }, 500);
  }

  return c.json({
    message: "Tahun ajaran berhasil dibuat",
    data: { id, ...parsed.data },
  });
});

// GET /api/academic/classrooms
academicRouter.get("/classrooms", async (c) => {
  const db = createDb(c.env.DB);

  try {
    const list = await db.select().from(classrooms).orderBy(classrooms.name);
    if (list.length > 0) {
      const [enrollments, teachers] = await Promise.all([
        db
          .select({
            classroomId: studentEnrollments.classroomId,
            studentId: studentEnrollments.studentId,
          })
          .from(studentEnrollments),
        db.select({ id: users.id, fullName: users.fullName }).from(users),
      ]);

      const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher.fullName]));
      const data = list.map((classroom) => ({
        ...classroom,
        studentCount: enrollments.filter((item) => item.classroomId === classroom.id).length,
        homeroomTeacher: classroom.homeroomTeacherId
          ? (teacherById.get(classroom.homeroomTeacherId) ?? "Belum ditentukan")
          : "Belum ditentukan",
      }));
      return c.json({ data });
    }

    // No classroom yet: only a never-seeded database may show the demo rombel.
    if (!(await isEmptyDatabase(db))) return c.json({ data: [] });
    return c.json({ data: demoClassrooms });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat rombel", message: String(err) }, 500);
  }
});

// POST /api/academic/classrooms (Hanya Admin)
academicRouter.post("/classrooms", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    name: z.string().min(1, "Nama rombel wajib diisi"),
    gradeLevel: z.number().int().min(7).max(12),
    academicYearId: z.string().optional(),
    homeroomTeacherId: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid classroom payload" }, 400);
  }

  const db = createDb(c.env.DB);

  try {
    const activeYear = await findActiveYear(db);
    const classroom = {
      id: `cls_${Date.now()}`,
      academicYearId: parsed.data.academicYearId ?? activeYear?.id ?? fallbackActiveYear.id,
      name: parsed.data.name,
      gradeLevel: parsed.data.gradeLevel,
      homeroomTeacherId: parsed.data.homeroomTeacherId ?? null,
      createdAt: new Date(),
    };

    await db.insert(classrooms).values(classroom);
    return c.json({ message: "Rombel berhasil ditambahkan", data: classroom }, 201);
  } catch (err: unknown) {
    return c.json({ error: "Gagal menyimpan rombel", message: String(err) }, 500);
  }
});

// GET /api/academic/subjects
academicRouter.get("/subjects", async (c) => {
  const db = createDb(c.env.DB);
  const gradeLevel = c.req.query("gradeLevel");

  try {
    const list = await db.select().from(subjects).orderBy(subjects.name);
    if (list.length > 0) {
      return c.json({
        data: gradeLevel ? list.filter((subject) => subject.gradeLevel === Number(gradeLevel)) : list,
      });
    }

    // No subject yet: only a never-seeded database may show the demo curriculum.
    if (!(await isEmptyDatabase(db))) return c.json({ data: [] });
    return c.json({
      data: gradeLevel
        ? demoSubjects.filter((subject) => subject.gradeLevel === Number(gradeLevel))
        : demoSubjects,
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat mata pelajaran", message: String(err) }, 500);
  }
});

// GET /api/academic/classrooms/:id/students
academicRouter.get("/classrooms/:id/students", requireRoles("admin", "teacher"), async (c) => {
  const classroomId = c.req.param("id");
  const db = createDb(c.env.DB);

  try {
    const rows = await db
      .select({
        id: users.id,
        name: users.fullName,
        username: users.username,
      })
      .from(studentEnrollments)
      .innerJoin(users, eq(studentEnrollments.studentId, users.id))
      .where(eq(studentEnrollments.classroomId, classroomId))
      .orderBy(users.fullName);

    if (rows.length > 0) return c.json({ data: rows });

    // An empty rombel is a real answer once the database is seeded.
    if (!(await isEmptyDatabase(db))) return c.json({ data: [] });

    const studentIds = demoEnrollments
      .filter((enrollment) => enrollment.classroomId === classroomId)
      .map((enrollment) => enrollment.studentId);

    return c.json({
      data: demoUsers
        .filter((user) => studentIds.includes(user.id))
        .map((user) => ({ id: user.id, name: user.fullName, username: user.username })),
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat siswa rombel", message: String(err) }, 500);
  }
});

export { academicRouter };
