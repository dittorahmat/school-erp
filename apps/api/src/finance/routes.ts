import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import {
  academicYears,
  and,
  classrooms,
  createDb,
  demoGuardianStudents,
  demoSeedInvoices,
  demoUsers,
  desc,
  eq,
  feeComponents,
  guardianStudents,
  invoices,
  studentEnrollments,
  users,
} from "@school-erp/db";
import { isEmptyDatabase } from "../empty-database";

const financeRouter = new Hono<{ Bindings: Bindings }>();

financeRouter.use("*", authMiddleware());

const batchSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.number().positive().optional(),
  componentId: z.string().optional(),
});

const verifySchema = z.object({
  invoiceId: z.string().min(1),
  status: z.enum(["paid", "unpaid"]),
});

async function visibleStudentIds(
  db: ReturnType<typeof createDb>,
  user: { sub: string; username: string; role: string }
) {
  if (user.role === "admin" || user.role === "teacher") return null;
  if (user.role === "student") return [user.sub];

  const links = await db
    .select({ studentId: guardianStudents.studentId })
    .from(guardianStudents)
    .where(eq(guardianStudents.guardianId, user.sub));
  if (links.length > 0) return links.map((link) => link.studentId);
  if (!(await isEmptyDatabase(db))) return [];

  // Never-seeded database: fall back to the demo guardian links.
  const demoGuardian = demoUsers.find((candidate) => candidate.username === user.username);
  if (!demoGuardian) return [];
  return demoGuardianStudents
    .filter((link) => link.guardianId === demoGuardian.id)
    .map((link) => link.studentId);
}

async function canAccessInvoice(
  db: ReturnType<typeof createDb>,
  user: { sub: string; username: string; role: string },
  studentId: string
) {
  if (user.role === "admin" || user.role === "teacher") return true;
  if (user.role === "student") return user.sub === studentId;

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

// GET /api/finance/invoices
financeRouter.get("/invoices", async (c) => {
  const db = createDb(c.env.DB);
  const user = c.get("user");
  const requestedStudent = c.req.query("studentId");
  const month = c.req.query("month");
  const status = c.req.query("status");

  try {
    const allowedStudentIds = await visibleStudentIds(db, user);

    const rows = await db
      .select({
        id: invoices.id,
        studentId: invoices.studentId,
        studentName: users.fullName,
        classroom: classrooms.name,
        componentName: feeComponents.name,
        amount: invoices.amount,
        month: invoices.month,
        status: invoices.status,
        paymentProofUrl: invoices.paymentProofUrl,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(users, eq(invoices.studentId, users.id))
      .leftJoin(feeComponents, eq(invoices.feeComponentId, feeComponents.id))
      .leftJoin(studentEnrollments, eq(studentEnrollments.studentId, invoices.studentId))
      .leftJoin(classrooms, eq(classrooms.id, studentEnrollments.classroomId))
      .orderBy(desc(invoices.createdAt));

    if (rows.length > 0) {
      const deduped = Array.from(new Map(rows.map((row) => [row.id, row])).values());
      const filtered = deduped.filter((row) => {
        if (allowedStudentIds && !allowedStudentIds.includes(row.studentId)) return false;
        if (requestedStudent && row.studentId !== requestedStudent) return false;
        if (month && row.month !== month) return false;
        if (status && row.status !== status) return false;
        return true;
      });
      return c.json({
        data: filtered.map((row) => ({
          ...row,
          dueDate: row.month ? `${row.month}-15` : null,
        })),
      });
    }

    // A month without invoices is a real answer once the database is seeded.
    if (!(await isEmptyDatabase(db))) return c.json({ data: [] });

    // Never-seeded database: fall back to the demo invoices.
    return c.json({
      data: demoSeedInvoices.filter((invoice) => {
        if (allowedStudentIds && !allowedStudentIds.includes(invoice.studentId)) return false;
        if (requestedStudent && invoice.studentId !== requestedStudent) return false;
        if (month && invoice.month !== month) return false;
        if (status && invoice.status !== status) return false;
        return true;
      }),
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat tagihan", message: String(err) }, 500);
  }
});

// POST /api/finance/batch-generate (Admin TU)
financeRouter.post("/batch-generate", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid batch billing payload" }, 400);
  }

  const db = createDb(c.env.DB);
  const { month } = parsed.data;
  const componentId = parsed.data.componentId ?? "fee_spp";
  const amount = parsed.data.amount;

  try {
    const activeYears = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.isActive, true))
      .limit(1);

    const yearId = activeYears[0]?.id;
    if (!yearId) {
      return c.json({ error: "Tahun ajaran aktif belum ditetapkan" }, 400);
    }

    const components = await db
      .select()
      .from(feeComponents)
      .where(eq(feeComponents.id, componentId))
      .limit(1);
    const component = components[0];
    if (!component) {
      return c.json({ error: `Komponen biaya ${componentId} tidak ditemukan` }, 400);
    }
    const billedAmount = amount ?? component.amount;

    const enrollments = await db
      .select({ studentId: studentEnrollments.studentId })
      .from(studentEnrollments);
    const studentIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.studentId)));
    if (studentIds.length === 0) {
      return c.json({ error: "Belum ada siswa terdaftar. Jalankan seeder demo." }, 400);
    }

    const existing = await db
      .select({ studentId: invoices.studentId })
      .from(invoices)
      .where(and(eq(invoices.month, month), eq(invoices.feeComponentId, componentId)));
    const alreadyBilled = new Set(existing.map((invoice) => invoice.studentId));

    const rows = studentIds
      .filter((studentId) => !alreadyBilled.has(studentId))
      .map((studentId, index) => ({
        id: `INV-${month}-${String(Date.now()).slice(-5)}-${String(index + 1).padStart(2, "0")}`,
        studentId,
        academicYearId: yearId,
        feeComponentId: componentId,
        month,
        amount: billedAmount,
        status: "unpaid" as const,
        paymentProofUrl: null,
        paidAt: null,
        createdAt: new Date(),
      }));

    for (let index = 0; index < rows.length; index += 10) {
      await db.insert(invoices).values(rows.slice(index, index + 10));
    }

    return c.json({
      message: `Berhasil menerbitkan tagihan bulan ${month}`,
      generatedCount: rows.length,
      skippedCount: studentIds.length - rows.length,
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menerbitkan tagihan", message: String(err) }, 500);
  }
});

// POST /api/finance/upload-proof
financeRouter.post("/upload-proof", async (c) => {
  const formData = await c.req.formData().catch(() => null);
  const file = formData?.get("proof");
  const invoiceId = formData?.get("invoiceId");

  if (!(file instanceof File) || typeof invoiceId !== "string" || !invoiceId) {
    return c.json({ error: "Berkas bukti bayar dan invoiceId wajib diisi" }, 400);
  }

  const MAX_PROOF_BYTES = 5 * 1024 * 1024;
  const allowedProofTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (file.size > MAX_PROOF_BYTES) {
    return c.json({ error: "Ukuran bukti bayar maksimal 5MB" }, 400);
  }
  if (file.type && !allowedProofTypes.includes(file.type)) {
    return c.json({ error: "Format bukti bayar harus PNG, JPG, WEBP, atau PDF" }, 400);
  }

  const user = c.get("user");
  const db = createDb(c.env.DB);

  try {
    const invoiceRows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);
    if (!invoiceRows[0]) return c.json({ error: "Tagihan tidak ditemukan" }, 404);

    if (!(await canAccessInvoice(db, user, invoiceRows[0].studentId))) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const key = `proofs/${invoiceId}-${Date.now()}-${file.name}`;
    if (c.env.STORAGE) {
      await c.env.STORAGE.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || "application/octet-stream" },
      });
    }

    await db
      .update(invoices)
      .set({ status: "pending", paymentProofUrl: key })
      .where(eq(invoices.id, invoiceId));

    return c.json({
      message: "Bukti transfer berhasil diunggah dan menunggu verifikasi",
      key,
      status: "pending",
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal mengunggah bukti bayar", message: String(err) }, 500);
  }
});

// POST /api/finance/verify (Admin TU verifikasi lunas)
financeRouter.post("/verify", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid verify payload" }, 400);
  }

  const db = createDb(c.env.DB);
  try {
    const existing = await db
      .select({ id: invoices.id, status: invoices.status })
      .from(invoices)
      .where(eq(invoices.id, parsed.data.invoiceId))
      .limit(1);

    if (!existing[0]) {
      return c.json({ error: "Tagihan tidak ditemukan" }, 404);
    }
    if (existing[0].status === "void") {
      return c.json({ error: "Tagihan yang dibatalkan tidak dapat diverifikasi" }, 400);
    }

    await db
      .update(invoices)
      .set({
        status: parsed.data.status,
        paidAt: parsed.data.status === "paid" ? new Date() : null,
      })
      .where(eq(invoices.id, parsed.data.invoiceId));

    return c.json({
      message: `Status tagihan ${parsed.data.invoiceId} berhasil diubah menjadi ${parsed.data.status}`,
      invoiceId: parsed.data.invoiceId,
      status: parsed.data.status,
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memverifikasi tagihan", message: String(err) }, 500);
  }
});

export { financeRouter };
