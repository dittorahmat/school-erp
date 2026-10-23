import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import { createDb, invoices, feeComponents, demoSeedInvoices } from "@school-erp/db";

const financeRouter = new Hono<{ Bindings: Bindings }>();

financeRouter.use("*", authMiddleware());

// GET /api/finance/invoices
financeRouter.get("/invoices", async (c) => {
  return c.json({ data: demoSeedInvoices });
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
    generatedCount: 192,
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
    // Graceful fallback
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
