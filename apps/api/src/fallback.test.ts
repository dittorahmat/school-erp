import { describe, expect, it } from "vitest";
import { app } from "./index";
import { signJwt } from "./auth/crypto";

/**
 * A broken database must be visible as a 500. The demo dataset may only answer
 * when a query succeeds and returns nothing (a genuinely empty database), never
 * as a silent replacement for a failed query.
 */
const SECRET = "fallback-test-secret";

const throwingDb = new Proxy(
  {},
  {
    get() {
      throw new Error("fallback test: database is unavailable");
    },
  }
) as unknown as D1Database;

const env = {
  DB: throwingDb,
  STORAGE: undefined,
  JWT_SECRET: SECRET,
  ENVIRONMENT: "test",
};

const tokenFor = (role: string) =>
  signJwt(
    {
      sub: `usr_${role}_test`,
      username: `${role}_test`,
      fullName: `Test ${role}`,
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    SECRET
  );

const reads = [
  { path: "/api/academic/years", role: "admin" },
  { path: "/api/academic/classrooms", role: "admin" },
  { path: "/api/academic/subjects", role: "admin" },
  { path: "/api/academic/classrooms/cls_10_mipa_1/students", role: "teacher" },
  { path: "/api/attendance/summary?studentId=usr_student_1", role: "teacher" },
  { path: "/api/attendance/sessions?classroomId=cls_10_mipa_1&date=2026-10-23", role: "teacher" },
  { path: "/api/finance/invoices", role: "admin" },
  { path: "/api/gradebook/scores?subjectId=sub_mat&classroomId=cls_10_mipa_1", role: "teacher" },
  { path: "/api/gradebook/report-card?studentId=usr_student_1", role: "teacher" },
  { path: "/api/parent/children", role: "guardian" },
  { path: "/api/dashboard/summary", role: "admin" },
  { path: "/api/inventory/categories", role: "admin" },
  { path: "/api/inventory/items", role: "admin" },
  { path: "/api/inventory/asset-units", role: "admin" },
  { path: "/api/inventory/loans", role: "admin" },
  { path: "/api/inventory/stock-movements", role: "admin" },
  { path: "/api/inventory/requisitions", role: "admin" },
];

describe("database failures are not masked by demo data", () => {
  it.each(reads)("$path answers 500 when the query fails", async ({ path, role }) => {
    const response = await app.request(
      path,
      { headers: { Authorization: `Bearer ${await tokenFor(role)}` } },
      env
    );
    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    expect(response.status).toBe(500);
    expect(body?.error).toBeTruthy();
    expect(body?.data).toBeUndefined();
    expect(body?.categories).toBeUndefined();
    expect(body?.items).toBeUndefined();
    expect(body?.units).toBeUndefined();
    expect(body?.loans).toBeUndefined();
    expect(body?.movements).toBeUndefined();
    expect(body?.requisitions).toBeUndefined();
  });
});

/**
 * The other half of the contract: before the first seed, the demo dataset is
 * the intended answer, so the same reads must answer 200 with content.
 */
const emptyStatement = {
  bind: () => emptyStatement,
  all: async () => ({ results: [] }),
  first: async () => null,
  raw: async () => [],
  run: async () => ({ results: [] }),
};

const emptyDb = {
  prepare: () => emptyStatement,
  batch: async () => [],
  exec: async () => ({ count: 0 }),
} as unknown as D1Database;

const emptyEnv = { ...env, DB: emptyDb };

describe("a never-seeded database still serves the demo dataset", () => {
  it("returns the demo academic years", async () => {
    const response = await app.request(
      "/api/academic/years",
      { headers: { Authorization: `Bearer ${await tokenFor("admin")}` } },
      emptyEnv
    );
    const body = (await response.json()) as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("returns the demo inventory categories", async () => {
    const response = await app.request(
      "/api/inventory/categories",
      { headers: { Authorization: `Bearer ${await tokenFor("admin")}` } },
      emptyEnv
    );
    const body = (await response.json()) as { categories?: unknown[] };

    expect(response.status).toBe(200);
    expect(body.categories?.length).toBeGreaterThan(0);
  });

  it("returns the demo dashboard summary", async () => {
    const response = await app.request(
      "/api/dashboard/summary",
      { headers: { Authorization: `Bearer ${await tokenFor("admin")}` } },
      emptyEnv
    );
    const body = (await response.json()) as { data?: { students: number } };

    expect(response.status).toBe(200);
    expect(body.data?.students).toBeGreaterThan(0);
  });
});

/**
 * Once a single user exists the database is seeded, so an empty read is a real
 * answer — not an invitation to reuse the demo rows.
 */
const seededStatement = (sql: string) => {
  const results = /users/i.test(sql) ? [{ id: "usr_admin" }] : [];
  const statement = {
    bind: () => statement,
    all: async () => ({ results }),
    first: async () => results[0] ?? null,
    // Drizzle reads projected columns through raw(), one array per row.
    raw: async () => results.map((row) => Object.values(row)),
    run: async () => ({ results }),
  };
  return statement;
};

const seededDb = {
  prepare: seededStatement,
  batch: async () => [],
  exec: async () => ({ count: 0 }),
} as unknown as D1Database;

const seededEnv = { ...env, DB: seededDb };

describe("a seeded database reports empty reads as empty", () => {
  it("returns no academic years instead of the demo calendar", async () => {
    const response = await app.request(
      "/api/academic/years",
      { headers: { Authorization: `Bearer ${await tokenFor("admin")}` } },
      seededEnv
    );
    const body = (await response.json()) as { data: unknown[] };

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("returns no inventory categories instead of the demo catalogue", async () => {
    const response = await app.request(
      "/api/inventory/categories",
      { headers: { Authorization: `Bearer ${await tokenFor("admin")}` } },
      seededEnv
    );
    const body = (await response.json()) as { categories: unknown[] };

    expect(response.status).toBe(200);
    expect(body.categories).toEqual([]);
  });
});
