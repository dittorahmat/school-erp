import { Hono } from "hono";
import { createDb } from "@school-erp/db";
import { authMiddleware, requireRoles } from "../auth/middleware";
import { hashPassword } from "../auth/crypto";
import type { Bindings } from "../index";
import { seedDemo } from "./seed";

export const adminRouter = new Hono<{ Bindings: Bindings }>();

adminRouter.use("*", authMiddleware(), requireRoles("admin"));

adminRouter.post("/seed-demo", async (c) => {
  const db = createDb(c.env.DB);

  try {
    const counts = await seedDemo(db, hashPassword);
    return c.json({
      message: "Data demo berhasil ditanam. Jalankan ulang dengan aman.",
      counts,
    });
  } catch (err: unknown) {
    return c.json(
      { error: "Gagal menanam data demo", message: String(err) },
      500
    );
  }
});
