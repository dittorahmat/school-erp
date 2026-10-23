import { Hono } from "hono";
import { cors } from "hono/cors";

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

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "school-erp-api",
  });
});

export default app;
