import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./auth/routes";
import { academicRouter } from "./academic/routes";
import { attendanceRouter } from "./attendance/routes";
import { financeRouter } from "./finance/routes";
import { gradebookRouter } from "./gradebook/routes";
import { parentRouter } from "./parent/routes";

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

app.route("/api/auth", authRouter);
app.route("/api/academic", academicRouter);
app.route("/api/attendance", attendanceRouter);
app.route("/api/finance", financeRouter);
app.route("/api/gradebook", gradebookRouter);
app.route("/api/parent", parentRouter);

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "school-erp-api",
  });
});

export default app;
