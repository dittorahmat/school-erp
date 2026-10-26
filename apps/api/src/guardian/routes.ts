import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import { hashPassword } from "../auth/crypto";
import {
  createDb,
  users,
  guardianStudents,
  demoUsers,
  demoGuardianStudents,
  desc,
  eq,
  and,
  inArray,
} from "@school-erp/db";
import { isEmptyDatabase } from "../empty-database";

export const guardianRouter = new Hono<{ Bindings: Bindings }>();

guardianRouter.use("*", authMiddleware());

// GET /api/guardians (Admin & Guru)
guardianRouter.get("/", requireRoles("admin", "teacher"), async (c) => {
  const db = createDb(c.env.DB);

  try {
    const guardianUsers = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "guardian"))
      .orderBy(desc(users.createdAt));

    if (guardianUsers.length > 0) {
      const guardianIds = guardianUsers.map((g) => g.id);

      // Fetch links with students
      const links = await db
        .select({
          guardianId: guardianStudents.guardianId,
          studentId: guardianStudents.studentId,
          relationship: guardianStudents.relationship,
          studentName: users.fullName,
        })
        .from(guardianStudents)
        .innerJoin(users, eq(guardianStudents.studentId, users.id))
        .where(inArray(guardianStudents.guardianId, guardianIds));

      const linksByGuardianId = new Map<
        string,
        Array<{ id: string; name: string; relationship: string }>
      >();

      for (const link of links) {
        const list = linksByGuardianId.get(link.guardianId) ?? [];
        list.push({
          id: link.studentId,
          name: link.studentName,
          relationship: link.relationship,
        });
        linksByGuardianId.set(link.guardianId, list);
      }

      const data = guardianUsers.map((guardian) => ({
        ...guardian,
        students: linksByGuardianId.get(guardian.id) ?? [],
      }));

      return c.json({ data });
    }

    if (!(await isEmptyDatabase(db))) return c.json({ data: [] });

    // Fallback for unseeded database
    const studentUserMap = new Map(demoUsers.map((u) => [u.id, u.fullName]));

    const demoLinksByGuardian = new Map<
      string,
      Array<{ id: string; name: string; relationship: string }>
    >();

    for (const link of demoGuardianStudents) {
      const list = demoLinksByGuardian.get(link.guardianId) ?? [];
      list.push({
        id: link.studentId,
        name: studentUserMap.get(link.studentId) ?? link.studentId,
        relationship: link.relationship ?? "Wali",
      });
      demoLinksByGuardian.set(link.guardianId, list);
    }

    const data = demoUsers
      .filter((user) => user.role === "guardian")
      .map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email ?? null,
        phone: user.phone ?? null,
        createdAt: user.createdAt,
        students: demoLinksByGuardian.get(user.id) ?? [],
      }));

    return c.json({ data });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat data orang tua / wali", message: String(err) }, 500);
  }
});

// POST /api/guardians (Hanya Admin)
guardianRouter.post("/", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    username: z.string().min(3, "Username minimal 3 karakter"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
    email: z.string().email("Format email tidak valid").optional().nullable(),
    phone: z.string().optional().nullable(),
    studentIds: z.array(z.string()).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Payload data orang tua/wali tidak valid";
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

    // Validate students if provided
    const studentIds = parsed.data.studentIds ?? [];
    if (studentIds.length > 0) {
      const studentsList = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(inArray(users.id, studentIds));

      if (studentsList.length !== studentIds.length || studentsList.some((s) => s.role !== "student")) {
        return c.json({ error: "Satu atau lebih siswa tidak valid" }, 400);
      }
    }

    const id = `usr_guardian_${Date.now()}`;
    const passwordHash = await hashPassword(parsed.data.password);
    const now = new Date();

    const newGuardian = {
      id,
      username: parsed.data.username,
      passwordHash,
      fullName: parsed.data.fullName,
      role: "guardian" as const,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(users).values(newGuardian);

    if (studentIds.length > 0) {
      for (const studentId of studentIds) {
        await db.insert(guardianStudents).values({
          id: `gs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          guardianId: id,
          studentId,
          relationship: "Wali",
          createdAt: now,
        });
      }
    }

    return c.json(
      {
        message: "Data orang tua / wali berhasil ditambahkan",
        data: {
          id: newGuardian.id,
          username: newGuardian.username,
          fullName: newGuardian.fullName,
          role: newGuardian.role,
          email: newGuardian.email,
          phone: newGuardian.phone,
          createdAt: newGuardian.createdAt,
          studentIds,
        },
      },
      201
    );
  } catch (err: unknown) {
    return c.json({ error: "Gagal menambahkan data orang tua / wali", message: String(err) }, 500);
  }
});

// PATCH /api/guardians/:id (Hanya Admin)
guardianRouter.patch("/:id", requireRoles("admin"), async (c) => {
  const guardianId = c.req.param("id");
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
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, guardianId))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Data orang tua / wali tidak ditemukan" }, 404);
    }

    if (existing[0].role !== "guardian") {
      return c.json({ error: "Pengguna bukan orang tua / wali" }, 400);
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

    await db.update(users).set(updates).where(eq(users.id, guardianId));

    return c.json({
      message: "Data orang tua / wali berhasil diperbarui",
      data: {
        id: guardianId,
        ...parsed.data,
      },
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memperbarui data orang tua / wali", message: String(err) }, 500);
  }
});

// DELETE /api/guardians/:id (Hanya Admin)
guardianRouter.delete("/:id", requireRoles("admin"), async (c) => {
  const guardianId = c.req.param("id");
  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, guardianId))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Data orang tua / wali tidak ditemukan" }, 404);
    }

    if (existing[0].role !== "guardian") {
      return c.json({ error: "Pengguna bukan orang tua / wali" }, 400);
    }

    // Delete guardian student relations first (to ensure cleanup across drivers)
    await db.delete(guardianStudents).where(eq(guardianStudents.guardianId, guardianId));

    // Delete user
    await db.delete(users).where(eq(users.id, guardianId));

    return c.json({
      message: "Data orang tua / wali berhasil dihapus",
      id: guardianId,
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menghapus data orang tua / wali", message: String(err) }, 500);
  }
});

// POST /api/guardians/:id/students (Hanya Admin)
guardianRouter.post("/:id/students", requireRoles("admin"), async (c) => {
  const guardianId = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    studentId: z.string().min(1, "Student ID wajib diisi"),
    relationship: z.string().optional().default("Wali"),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Payload penautan siswa tidak valid";
    return c.json({ error: errorMsg }, 400);
  }

  const db = createDb(c.env.DB);

  try {
    const guardian = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, guardianId))
      .limit(1);

    if (guardian.length === 0) {
      return c.json({ error: "Data orang tua / wali tidak ditemukan" }, 404);
    }
    if (guardian[0].role !== "guardian") {
      return c.json({ error: "Pengguna bukan orang tua / wali" }, 400);
    }

    const student = await db
      .select({ id: users.id, role: users.role, fullName: users.fullName })
      .from(users)
      .where(eq(users.id, parsed.data.studentId))
      .limit(1);

    if (student.length === 0) {
      return c.json({ error: "Siswa tidak ditemukan" }, 404);
    }
    if (student[0].role !== "student") {
      return c.json({ error: "Pengguna bukan siswa" }, 400);
    }

    // Check duplicate link
    const existingLink = await db
      .select({ id: guardianStudents.id })
      .from(guardianStudents)
      .where(
        and(
          eq(guardianStudents.guardianId, guardianId),
          eq(guardianStudents.studentId, parsed.data.studentId)
        )
      )
      .limit(1);

    if (existingLink.length > 0) {
      return c.json({ error: "Siswa sudah terhubung dengan orang tua / wali ini" }, 400);
    }

    const linkId = `gs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();

    await db.insert(guardianStudents).values({
      id: linkId,
      guardianId,
      studentId: parsed.data.studentId,
      relationship: parsed.data.relationship || "Wali",
      createdAt: now,
    });

    return c.json(
      {
        message: "Siswa berhasil ditautkan ke orang tua / wali",
        data: {
          id: linkId,
          guardianId,
          studentId: parsed.data.studentId,
          studentName: student[0].fullName,
          relationship: parsed.data.relationship || "Wali",
        },
      },
      201
    );
  } catch (err: unknown) {
    return c.json({ error: "Gagal menautkan siswa", message: String(err) }, 500);
  }
});

// DELETE /api/guardians/:id/students/:studentId (Hanya Admin)
guardianRouter.delete("/:id/students/:studentId", requireRoles("admin"), async (c) => {
  const guardianId = c.req.param("id");
  const studentId = c.req.param("studentId");
  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select({ id: guardianStudents.id })
      .from(guardianStudents)
      .where(
        and(
          eq(guardianStudents.guardianId, guardianId),
          eq(guardianStudents.studentId, studentId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Tautan siswa dan wali tidak ditemukan" }, 404);
    }

    await db
      .delete(guardianStudents)
      .where(
        and(
          eq(guardianStudents.guardianId, guardianId),
          eq(guardianStudents.studentId, studentId)
        )
      );

    return c.json({
      message: "Tautan siswa berhasil dilepas",
      guardianId,
      studentId,
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal melepas tautan siswa", message: String(err) }, 500);
  }
});
