import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import { hashPassword } from "../auth/crypto";
import {
  createDb,
  users,
  demoUsers,
  desc,
  eq,
  or,
} from "@school-erp/db";
import { isEmptyDatabase } from "../empty-database";

export const staffRouter = new Hono<{ Bindings: Bindings }>();

staffRouter.use("*", authMiddleware());

// GET /api/staff (Admin dan Guru)
staffRouter.get("/", requireRoles("admin", "teacher"), async (c) => {
  const db = createDb(c.env.DB);

  try {
    const staffMembers = await db
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
      .where(or(eq(users.role, "teacher"), eq(users.role, "admin")))
      .orderBy(desc(users.createdAt));

    if (staffMembers.length > 0) {
      return c.json({ data: staffMembers });
    }

    if (!(await isEmptyDatabase(db))) return c.json({ data: [] });

    // Fallback for unseeded database
    const data = demoUsers
      .filter((user) => user.role === "teacher" || user.role === "admin")
      .map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email ?? null,
        phone: user.phone ?? null,
        createdAt: user.createdAt,
      }));

    return c.json({ data });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat data staf", message: String(err) }, 500);
  }
});

// POST /api/staff (Hanya Admin)
staffRouter.post("/", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    username: z.string().min(3, "Username minimal 3 karakter"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
    role: z.enum(["teacher", "admin"]),
    email: z.string().email("Format email tidak valid").optional().nullable(),
    phone: z.string().optional().nullable(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Payload data staf tidak valid";
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

    const id = `usr_staff_${Date.now()}`;
    const passwordHash = await hashPassword(parsed.data.password);
    const now = new Date();

    const newStaff = {
      id,
      username: parsed.data.username,
      passwordHash,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(users).values(newStaff);

    return c.json(
      {
        message: "Data staf berhasil ditambahkan",
        data: {
          id: newStaff.id,
          username: newStaff.username,
          fullName: newStaff.fullName,
          role: newStaff.role,
          email: newStaff.email,
          phone: newStaff.phone,
          createdAt: newStaff.createdAt,
        },
      },
      201
    );
  } catch (err: unknown) {
    return c.json({ error: "Gagal menambahkan data staf", message: String(err) }, 500);
  }
});

// PATCH /api/staff/:id (Hanya Admin)
staffRouter.patch("/:id", requireRoles("admin"), async (c) => {
  const staffId = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").optional(),
    role: z.enum(["teacher", "admin"]).optional(),
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
      .where(eq(users.id, staffId))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Data staf tidak ditemukan" }, 404);
    }

    if (existing[0].role !== "teacher" && existing[0].role !== "admin") {
      return c.json({ error: "Pengguna bukan guru atau staf" }, 400);
    }

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.fullName !== undefined) {
      updates.fullName = parsed.data.fullName;
    }
    if (parsed.data.role !== undefined) {
      updates.role = parsed.data.role;
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

    await db.update(users).set(updates).where(eq(users.id, staffId));

    return c.json({
      message: "Data staf berhasil diperbarui",
      data: {
        id: staffId,
        ...parsed.data,
      },
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memperbarui data staf", message: String(err) }, 500);
  }
});

// DELETE /api/staff/:id (Hanya Admin)
staffRouter.delete("/:id", requireRoles("admin"), async (c) => {
  const staffId = c.req.param("id");
  const currentUser = c.get("user");

  if (currentUser?.sub === staffId) {
    return c.json({ error: "Tidak dapat menghapus akun admin Anda sendiri" }, 400);
  }

  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, staffId))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Data staf tidak ditemukan" }, 404);
    }

    if (existing[0].role !== "teacher" && existing[0].role !== "admin") {
      return c.json({ error: "Pengguna bukan guru atau staf" }, 400);
    }

    await db.delete(users).where(eq(users.id, staffId));

    return c.json({
      message: "Data staf berhasil dihapus",
      id: staffId,
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menghapus data staf", message: String(err) }, 500);
  }
});
