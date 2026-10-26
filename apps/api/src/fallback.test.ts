import { describe, expect, it } from "vitest";
import { app } from "./index";
import { signJwt } from "./auth/crypto";
import { createFakeD1, throwingD1 } from "./testing/fake-d1";
import { readRoutes, type Role } from "./testing/routes";

/**
 * Error semantics of every read route.
 *
 * - A failed query answers 500. It never falls back to the demo dataset.
 * - A never-seeded database answers with the demo dataset, so a fresh install works.
 * - A seeded database that returns no rows answers empty, not demo.
 *
 * The route list comes from `testing/routes.ts`, so a new GET joins this suite by
 * being added for authorization.
 */
const SECRET = "fallback-test-secret";

const tokenFor = (role: Role) =>
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

const envWith = (db: D1Database) => ({
  DB: db,
  STORAGE: undefined,
  JWT_SECRET: SECRET,
  ENVIRONMENT: "test",
});

const get = async (path: string, role: Role, db: D1Database) =>
  app.request(path, { headers: { Authorization: `Bearer ${await tokenFor(role)}` } }, envWith(db));

// Routes that do not query the database (e.g. JWT session inspection) do not answer 500 on DB failure
const dbReadRoutes = readRoutes.filter((route) => route.path !== "/api/auth/me");

describe("database failures are not masked by demo data", () => {
  it.each(dbReadRoutes)("$method $path answers 500 when the query fails", async (route) => {
    const response = await get(route.path, route.allow[0], throwingD1);
    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    expect(response.status).toBe(500);
    expect(body?.error).toBeTruthy();
    for (const key of ["data", "categories", "items", "units", "loans", "movements", "requisitions"]) {
      expect(body?.[key]).toBeUndefined();
    }
  });
});

/**
 * The other half of the contract: before the first seed, the demo dataset is the
 * intended answer, so the same reads must answer 200 with content.
 */
const emptyDb = createFakeD1(() => []);

describe("a never-seeded database still serves the demo dataset", () => {
  it("returns the demo academic years", async () => {
    const response = await get("/api/academic/years", "admin", emptyDb);
    const body = (await response.json()) as { data: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("returns the demo inventory categories", async () => {
    const response = await get("/api/inventory/categories", "admin", emptyDb);
    const body = (await response.json()) as { categories?: unknown[] };

    expect(response.status).toBe(200);
    expect(body.categories?.length).toBeGreaterThan(0);
  });

  it("returns the demo dashboard summary", async () => {
    const response = await get("/api/dashboard/summary", "admin", emptyDb);
    const body = (await response.json()) as { data?: { students: number } };

    expect(response.status).toBe(200);
    expect(body.data?.students).toBeGreaterThan(0);
  });
});

/**
 * Once a single user exists the database is seeded, so an empty read is a real
 * answer — not an invitation to reuse the demo rows.
 */
const seededDb = createFakeD1((sql) => (/"users"/.test(sql) ? [{ id: "usr_admin" }] : []));

describe("a seeded database reports empty reads as empty", () => {
  it("returns no academic years instead of the demo calendar", async () => {
    const response = await get("/api/academic/years", "admin", seededDb);
    const body = (await response.json()) as { data: unknown[] };

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("returns no inventory categories instead of the demo catalogue", async () => {
    const response = await get("/api/inventory/categories", "admin", seededDb);
    const body = (await response.json()) as { categories: unknown[] };

    expect(response.status).toBe(200);
    expect(body.categories).toEqual([]);
  });
});
