import { describe, expect, it } from "vitest";
import { app } from "./index";
import { signJwt } from "./auth/crypto";

/**
 * Authorization matrix. Every protected route must answer 401 without a token and
 * 403 for a role outside its allow list. Anything that passes the guard may still
 * fail on payload or database, so the allowed case only asserts "not 401/403".
 *
 * The database is a stub that throws on first use: routes fall back or return 5xx,
 * which is fine here because this test owns authorization, not data.
 */
const SECRET = "authz-test-secret";

const throwingDb = new Proxy(
  {},
  {
    get() {
      throw new Error("authz test: database is not available");
    },
  }
) as unknown as D1Database;

const env = {
  DB: throwingDb,
  STORAGE: undefined,
  JWT_SECRET: SECRET,
  ENVIRONMENT: "test",
};

const ALL = ["admin", "teacher", "student", "guardian"] as const;
type Role = (typeof ALL)[number];

async function tokenFor(role: Role) {
  return signJwt(
    {
      sub: `usr_${role}_test`,
      username: `${role}_test`,
      fullName: `Test ${role}`,
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    SECRET
  );
}

interface RouteSpec {
  method: "GET" | "POST" | "PATCH";
  path: string;
  allow: readonly Role[];
}

const routes: RouteSpec[] = [
  { method: "GET", path: "/api/dashboard/summary", allow: ALL },

  { method: "GET", path: "/api/academic/years", allow: ALL },
  { method: "GET", path: "/api/academic/subjects", allow: ALL },
  { method: "GET", path: "/api/academic/classrooms", allow: ALL },
  { method: "GET", path: "/api/academic/classrooms/cls_test/students", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/academic/classrooms", allow: ["admin"] },
  { method: "POST", path: "/api/academic/years", allow: ["admin"] },

  { method: "GET", path: "/api/attendance/summary", allow: ALL },
  { method: "GET", path: "/api/attendance/sessions?classroomId=cls_test&date=2026-10-23", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/attendance/session", allow: ["admin", "teacher"] },

  { method: "GET", path: "/api/finance/invoices", allow: ALL },
  { method: "POST", path: "/api/finance/batch-generate", allow: ["admin"] },
  { method: "POST", path: "/api/finance/upload-proof", allow: ALL },
  { method: "POST", path: "/api/finance/verify", allow: ["admin"] },

  { method: "GET", path: "/api/gradebook/scores", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/gradebook/save", allow: ["admin", "teacher"] },
  { method: "GET", path: "/api/gradebook/report-card", allow: ALL },

  { method: "GET", path: "/api/parent/children", allow: ALL },

  { method: "GET", path: "/api/inventory/categories", allow: ALL },
  { method: "POST", path: "/api/inventory/categories", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/locations", allow: ALL },
  { method: "POST", path: "/api/inventory/locations", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/items", allow: ALL },
  { method: "POST", path: "/api/inventory/items", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/asset-units", allow: ALL },
  { method: "POST", path: "/api/inventory/asset-units", allow: ["admin"] },
  { method: "PATCH", path: "/api/inventory/asset-units/unit_test", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/loans", allow: ALL },
  { method: "POST", path: "/api/inventory/loans", allow: ALL },
  { method: "POST", path: "/api/inventory/loans/loan_test/approval", allow: ["admin"] },
  { method: "POST", path: "/api/inventory/loans/loan_test/return", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/stock-movements", allow: ALL },
  { method: "POST", path: "/api/inventory/stock-movements", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/requisitions", allow: ALL },
  { method: "POST", path: "/api/inventory/requisitions", allow: ALL },
  { method: "POST", path: "/api/inventory/requisitions/req_test/approval", allow: ["admin"] },

  { method: "POST", path: "/api/admin/seed-demo", allow: ["admin"] },
];

describe("route authorization matrix", () => {
  it("covers every route the API exposes", () => {
    expect(routes.length).toBeGreaterThan(30);
  });

  it.each(routes)("rejects anonymous $method $path", async (route) => {
    const response = await app.request(route.path, { method: route.method }, env);
    expect(response.status).toBe(401);
  });

  it.each(routes.flatMap((route) => ALL.map((role) => ({ route, role }))))(
    "$role on $route.method $route.path",
    async ({ route, role }) => {
      const token = await tokenFor(role);
      const response = await app.request(
        route.path,
        {
          method: route.method,
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: route.method === "GET" ? undefined : "{}",
        },
        env
      );

      if (route.allow.includes(role)) {
        expect([401, 403]).not.toContain(response.status);
      } else {
        expect(response.status).toBe(403);
      }
    }
  );
});
