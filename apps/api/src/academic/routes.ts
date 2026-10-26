import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import { hashPassword } from "../auth/crypto";
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
  and,
} from "@school-erp/db";
import { isEmptyDatabase } from "../empty-database";
import { ClassroomEnrollment, ClassroomEnrollmentError } from "./enrollment";

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

// PATCH /api/academic/years/:id/activate (Hanya Admin)
academicRouter.patch("/years/:id/activate", requireRoles("admin"), async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Tahun ajaran tidak ditemukan" }, 404);
    }

    // Set all other years to isActive = false, and chosen year to isActive = true
    await db.update(academicYears).set({ isActive: false });
    await db.update(academicYears).set({ isActive: true }).where(eq(academicYears.id, id));

    const updated = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, id))
      .limit(1);

    return c.json({
      message: "Tahun ajaran berhasil diaktifkan",
      data: updated[0] ?? { ...existing[0], isActive: true },
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal mengaktifkan tahun ajaran", message: String(err) }, 500);
  }
});

// PATCH /api/academic/years/:id (Hanya Admin)
academicRouter.patch("/years/:id", requireRoles("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    name: z.string().min(4).optional(),
    semester: z.enum(["odd", "even"]).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    isActive: z.boolean().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid academic year update payload" }, 400);
  }

  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Tahun ajaran tidak ditemukan" }, 404);
    }

    const updates: Partial<typeof academicYears.$inferInsert> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.semester !== undefined) updates.semester = parsed.data.semester;
    if (parsed.data.startDate !== undefined) updates.startDate = parsed.data.startDate;
    if (parsed.data.endDate !== undefined) updates.endDate = parsed.data.endDate;
    if (parsed.data.isActive !== undefined) {
      if (parsed.data.isActive) {
        await db.update(academicYears).set({ isActive: false });
      }
      updates.isActive = parsed.data.isActive;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(academicYears).set(updates).where(eq(academicYears.id, id));
    }

    const updated = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, id))
      .limit(1);

    return c.json({
      message: "Tahun ajaran berhasil diperbarui",
      data: updated[0] ?? { ...existing[0], ...updates },
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memperbarui tahun ajaran", message: String(err) }, 500);
  }
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

// POST /api/academic/subjects (Hanya Admin)
academicRouter.post("/subjects", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    code: z.string().min(1, "Kode mata pelajaran wajib diisi").trim(),
    name: z.string().min(1, "Nama mata pelajaran wajib diisi").trim(),
    gradeLevel: z.number().int().min(7).max(12),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Data mata pelajaran tidak valid", details: parsed.error.issues }, 400);
  }

  const db = createDb(c.env.DB);

  try {
    const existingCode = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.code, parsed.data.code))
      .limit(1);

    if (existingCode.length > 0) {
      return c.json({ error: "Kode mata pelajaran sudah digunakan" }, 409);
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSubject = {
      id,
      code: parsed.data.code,
      name: parsed.data.name,
      gradeLevel: parsed.data.gradeLevel,
      createdAt: new Date(),
    };

    await db.insert(subjects).values(newSubject);

    return c.json({
      message: "Mata pelajaran berhasil ditambahkan",
      data: newSubject,
    }, 201);
  } catch (err: unknown) {
    return c.json({ error: "Gagal menambahkan mata pelajaran", message: String(err) }, 500);
  }
});

// PATCH /api/academic/subjects/:id (Hanya Admin)
academicRouter.patch("/subjects/:id", requireRoles("admin"), async (c) => {
  const subjectId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    code: z.string().min(1).trim().optional(),
    name: z.string().min(1).trim().optional(),
    gradeLevel: z.number().int().min(7).max(12).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Data perubahan mata pelajaran tidak valid", details: parsed.error.issues }, 400);
  }

  const { code, name, gradeLevel } = parsed.data;
  if (code === undefined && name === undefined && gradeLevel === undefined) {
    return c.json({ error: "Tidak ada data yang diperbarui" }, 400);
  }

  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Mata pelajaran tidak ditemukan" }, 404);
    }

    if (code !== undefined && code !== existing[0].code) {
      const duplicate = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.code, code))
        .limit(1);

      if (duplicate.length > 0) {
        return c.json({ error: "Kode mata pelajaran sudah digunakan" }, 409);
      }
    }

    const updates: Partial<{ code: string; name: string; gradeLevel: number }> = {};
    if (code !== undefined) updates.code = code;
    if (name !== undefined) updates.name = name;
    if (gradeLevel !== undefined) updates.gradeLevel = gradeLevel;

    await db.update(subjects).set(updates).where(eq(subjects.id, subjectId));

    return c.json({
      message: "Mata pelajaran berhasil diperbarui",
      data: {
        ...existing[0],
        ...updates,
      },
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memperbarui mata pelajaran", message: String(err) }, 500);
  }
});

// DELETE /api/academic/subjects/:id (Hanya Admin)
academicRouter.delete("/subjects/:id", requireRoles("admin"), async (c) => {
  const subjectId = c.req.param("id");
  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Mata pelajaran tidak ditemukan" }, 404);
    }

    await db.delete(subjects).where(eq(subjects.id, subjectId));

    return c.json({
      message: "Mata pelajaran berhasil dihapus",
      id: subjectId,
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menghapus mata pelajaran", message: String(err) }, 500);
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

// PATCH /api/academic/classrooms/:id/homeroom (Hanya Admin)
academicRouter.patch("/classrooms/:id/homeroom", requireRoles("admin"), async (c) => {
  const classroomId = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    homeroomTeacherId: z.string().nullable().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Payload wali kelas tidak valid" }, 400);
  }

  const db = createDb(c.env.DB);
  const enrollment = new ClassroomEnrollment(db);

  try {
    const data = await enrollment.assignHomeroom(
      classroomId,
      parsed.data.homeroomTeacherId ?? null
    );

    return c.json({
      message: "Wali kelas berhasil diperbarui",
      data,
    });
  } catch (err: unknown) {
    if (err instanceof ClassroomEnrollmentError) {
      return c.json({ error: err.message }, err.statusCode as any);
    }
    return c.json({ error: "Gagal memperbarui wali kelas", message: String(err) }, 500);
  }
});

// POST /api/academic/classrooms/:id/enroll (Hanya Admin)
academicRouter.post("/classrooms/:id/enroll", requireRoles("admin"), async (c) => {
  const classroomId = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    studentId: z.string().min(1, "Student ID wajib diisi"),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Payload pendaftaran siswa tidak valid" }, 400);
  }

  const db = createDb(c.env.DB);
  const enrollment = new ClassroomEnrollment(db);

  try {
    const data = await enrollment.enrollStudent(classroomId, parsed.data.studentId);

    return c.json(
      {
        message: "Siswa berhasil didaftarkan ke rombel",
        data,
      },
      201
    );
  } catch (err: unknown) {
    if (err instanceof ClassroomEnrollmentError) {
      return c.json({ error: err.message }, err.statusCode as any);
    }
    return c.json({ error: "Gagal mendaftarkan siswa ke rombel", message: String(err) }, 500);
  }
});

// DELETE /api/academic/classrooms/:id/enroll/:studentId (Hanya Admin)
academicRouter.delete("/classrooms/:id/enroll/:studentId", requireRoles("admin"), async (c) => {
  const classroomId = c.req.param("id");
  const studentId = c.req.param("studentId");
  const db = createDb(c.env.DB);
  const enrollment = new ClassroomEnrollment(db);

  try {
    const res = await enrollment.unenrollStudent(classroomId, studentId);

    return c.json({
      message: "Siswa berhasil dikeluarkan dari rombel",
      classroomId: res.classroomId,
      studentId: res.studentId,
    });
  } catch (err: unknown) {
    if (err instanceof ClassroomEnrollmentError) {
      return c.json({ error: err.message }, err.statusCode as any);
    }
    return c.json({ error: "Gagal mengeluarkan siswa dari rombel", message: String(err) }, 500);
  }
});

// GET /api/academic/students (Admin & Teacher)
academicRouter.get("/students", requireRoles("admin", "teacher"), async (c) => {
  const db = createDb(c.env.DB);

  try {
    const studentUsers = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "student"))
      .orderBy(users.fullName);

    if (studentUsers.length > 0) {
      const enrollments = await db
        .select({
          studentId: studentEnrollments.studentId,
          classroomName: classrooms.name,
        })
        .from(studentEnrollments)
        .innerJoin(classrooms, eq(studentEnrollments.classroomId, classrooms.id));

      const classroomByStudentId = new Map(
        enrollments.map((item) => [item.studentId, item.classroomName])
      );

      const data = studentUsers.map((student) => ({
        ...student,
        currentClassroom: classroomByStudentId.get(student.id) ?? null,
      }));

      return c.json({ data });
    }

    if (!(await isEmptyDatabase(db))) return c.json({ data: [] });

    // Fallback for unseeded database
    const classroomById = new Map(demoClassrooms.map((c) => [c.id, c.name]));
    const classroomByStudentId = new Map(
      demoEnrollments.map((item) => [item.studentId, classroomById.get(item.classroomId) ?? null])
    );

    const data = demoUsers
      .filter((user) => user.role === "student")
      .map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email ?? null,
        phone: user.phone ?? null,
        createdAt: user.createdAt,
        currentClassroom: classroomByStudentId.get(user.id) ?? null,
      }));

    return c.json({ data });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat data siswa", message: String(err) }, 500);
  }
});

// POST /api/academic/students (Hanya Admin)
academicRouter.post("/students", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    username: z.string().min(3, "Username minimal 3 karakter"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
    email: z.string().email("Format email tidak valid").optional().nullable(),
    phone: z.string().optional().nullable(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Payload data siswa tidak valid";
    return c.json({ error: errorMsg }, 400);
  }

  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, parsed.data.username))
      .limit(1);

    if (existing.length > 0) {
      return c.json({ error: "Username sudah digunakan" }, 400);
    }

    const id = `usr_student_${Date.now()}`;
    const passwordHash = await hashPassword(parsed.data.password);
    const now = new Date();

    const newStudent = {
      id,
      username: parsed.data.username,
      passwordHash,
      fullName: parsed.data.fullName,
      role: "student" as const,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(users).values(newStudent);

    return c.json(
      {
        message: "Data siswa berhasil ditambahkan",
        data: {
          id: newStudent.id,
          username: newStudent.username,
          fullName: newStudent.fullName,
          email: newStudent.email,
          phone: newStudent.phone,
          role: newStudent.role,
          createdAt: newStudent.createdAt,
        },
      },
      201
    );
  } catch (err: unknown) {
    return c.json({ error: "Gagal menambahkan data siswa", message: String(err) }, 500);
  }
});

// PATCH /api/academic/students/:id (Hanya Admin)
academicRouter.patch("/students/:id", requireRoles("admin"), async (c) => {
  const studentId = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").optional(),
    email: z.string().email("Format email tidak valid").optional().nullable(),
    phone: z.string().optional().nullable(),
    password: z.string().min(6, "Password minimal 6 karakter").optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Payload perbaruan tidak valid";
    return c.json({ error: errorMsg }, 400);
  }

  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Data siswa tidak ditemukan" }, 404);
    }

    if (existing[0].role !== "student") {
      return c.json({ error: "Pengguna bukan siswa" }, 400);
    }

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.fullName !== undefined) {
      updates.fullName = parsed.data.fullName;
    }
    if (parsed.data.email !== undefined) {
      updates.email = parsed.data.email || null;
    }
    if (parsed.data.phone !== undefined) {
      updates.phone = parsed.data.phone || null;
    }
    if (parsed.data.password) {
      updates.passwordHash = await hashPassword(parsed.data.password);
    }

    await db.update(users).set(updates).where(eq(users.id, studentId));

    return c.json({
      message: "Data siswa berhasil diperbarui",
      data: {
        id: studentId,
        ...parsed.data,
      },
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memperbarui data siswa", message: String(err) }, 500);
  }
});

// DELETE /api/academic/students/:id (Hanya Admin)
academicRouter.delete("/students/:id", requireRoles("admin"), async (c) => {
  const studentId = c.req.param("id");
  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Data siswa tidak ditemukan" }, 404);
    }

    if (existing[0].role !== "student") {
      return c.json({ error: "Pengguna bukan siswa" }, 400);
    }

    await db.delete(users).where(eq(users.id, studentId));

    return c.json({
      message: "Data siswa berhasil dihapus",
      id: studentId,
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menghapus data siswa", message: String(err) }, 500);
  }
});

export { academicRouter };
