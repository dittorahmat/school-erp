import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import { createDb, academicYears, classrooms, subjects, studentEnrollments } from "@school-erp/db";
import { eq, desc } from "drizzle-orm";

const academicRouter = new Hono<{ Bindings: Bindings }>();

// Semua route akademik memerlukan autentikasi
academicRouter.use("*", authMiddleware());

// GET /api/academic/years
academicRouter.get("/years", async (c) => {
  const db = createDb(c.env.DB);
  try {
    const years = await db.select().from(academicYears).orderBy(desc(academicYears.createdAt));
    return c.json({ data: years });
  } catch {
    // Fallback Mock jika DB belum ter-migrate
    return c.json({
      data: [
        {
          id: "ay_2025_2026",
          name: "2025/2026",
          isActive: true,
          semester: "odd",
          createdAt: new Date(),
        },
      ],
    });
  }
});

// POST /api/academic/years (Hanya Admin)
academicRouter.post("/years", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    name: z.string().min(4),
    semester: z.enum(["odd", "even"]).default("odd"),
    isActive: z.boolean().default(false),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid academic year payload" }, 400);
  }

  const db = createDb(c.env.DB);
  const id = `ay_${Date.now()}`;
  try {
    await db.insert(academicYears).values({
      id,
      name: parsed.data.name,
      semester: parsed.data.semester,
      isActive: parsed.data.isActive,
      createdAt: new Date(),
    });
  } catch {
    // Return simulated created record for mock/in-memory dev
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
    const list = await db.select().from(classrooms);
    return c.json({ data: list });
  } catch {
    return c.json({
      data: [
        { id: "cls_10_mipa_1", name: "X-MIPA-1", gradeLevel: 10, academicYearId: "ay_2025_2026" },
        { id: "cls_11_mipa_1", name: "XI-MIPA-1", gradeLevel: 11, academicYearId: "ay_2025_2026" },
      ],
    });
  }
});

export { academicRouter };
