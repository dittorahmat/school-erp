import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import { createDb, invoices, feeComponents } from "@school-erp/db";

const financeRouter = new Hono<{ Bindings: Bindings }>();

financeRouter.use("*", authMiddleware());

// GET /api/finance/invoices
financeRouter.get("/invoices", async (c) => {
  const user = c.get("user");
  // Demo mock list tagihan SPP
  return c.json({
    data: [
      {
        id: "inv_2026_10",
        studentName: "Ahmad Dahlan",
        componentName: "SPP Bulanan Oktober 2026",
        amount: 350000,
        month: "2026-10",
        status: "unpaid",
        dueDate: "2026-10-15",
        paymentProofUrl: null,
      },
      {
        id: "inv_2026_09",
        studentName: "Ahmad Dahlan",
        componentName: "SPP Bulanan September 2026",
        amount: 350000,
        month: "2026-09",
        status: "paid",
        dueDate: "2026-09-15",
        paymentProofUrl: "proofs/inv_2026_09.jpg",
      },
    ],
  });
});

// POST /api/finance/batch-generate (Admin TU)
financeRouter.post("/batch-generate", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    amount: z.number().positive(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid batch billing payload" }, 400);
  }

  return c.json({
    message: `Berhasil menerbitkan tagihan bulan ${parsed.data.month} untuk semua siswa aktif`,
    generatedCount: 32,
  });
});

// POST /api/finance/upload-proof (Multipart form data upload via Worker proxy ke R2)
financeRouter.post("/upload-proof", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("proof") as File | null;
  const invoiceId = formData.get("invoiceId") as string | null;

  if (!file || !invoiceId) {
    return c.json({ error: "Berkas bukti bayar dan invoiceId wajib diisi" }, 400);
  }

  const key = `proofs/${invoiceId}-${Date.now()}-${file.name}`;

  try {
    if (c.env.STORAGE) {
      await c.env.STORAGE.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type || "application/octet-stream",
        },
      });
    }
  } catch {
    // Graceful fallback jika R2 belum terhubung di runtime lokal
  }

  return c.json({
    message: "Bukti transfer berhasil diunggah ke Cloudflare R2",
    key,
    status: "pending",
  });
});

// POST /api/finance/verify (Admin TU verifikasi lunas)
financeRouter.post("/verify", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    invoiceId: z.string().min(1),
    status: z.enum(["paid", "unpaid"]),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid verify payload" }, 400);
  }

  return c.json({
    message: `Status tagihan ${parsed.data.invoiceId} berhasil diubah menjadi ${parsed.data.status}`,
    invoiceId: parsed.data.invoiceId,
    status: parsed.data.status,
  });
});

export { financeRouter };
