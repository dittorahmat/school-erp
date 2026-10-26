import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./auth/routes";
import { academicRouter } from "./academic/routes";
import { attendanceRouter } from "./attendance/routes";
import { financeRouter } from "./finance/routes";
import { gradebookRouter } from "./gradebook/routes";
import { parentRouter } from "./parent/routes";
import { inventoryRouter } from "./inventory/routes";
import { adminRouter } from "./admin/routes";
import { dashboardRouter } from "./dashboard/routes";
import { staffRouter } from "./academic/staff";

export type Bindings = {
  DB: D1Database;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: string;
};

export const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
  })
);

/**
 * Signing needs JWT_SECRET. Fail with an actionable message instead of a crypto
 * stack trace when a checkout or deployment never configured it.
 */
app.use("/api/*", async (c, next) => {
  if (c.req.path !== "/api/health" && !c.env?.JWT_SECRET) {
    return c.json({ error: "JWT_SECRET belum dikonfigurasi" }, 500);
  }
  await next();
});

app.route("/api/auth", authRouter);
app.route("/api/academic", academicRouter);
app.route("/api/attendance", attendanceRouter);
app.route("/api/finance", financeRouter);
app.route("/api/gradebook", gradebookRouter);
app.route("/api/parent", parentRouter);
app.route("/api/inventory", inventoryRouter);
app.route("/api/admin", adminRouter);
app.route("/api/dashboard", dashboardRouter);
app.route("/api/staff", staffRouter);

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "school-erp-api",
  });
});

export default app;
