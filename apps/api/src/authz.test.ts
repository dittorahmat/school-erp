import { describe, expect, it } from "vitest";
import { app } from "./index";
import { signJwt } from "./auth/crypto";
import { ALL, routes, type Role } from "./testing/routes";
import { throwingD1 } from "./testing/fake-d1";

/**
 * Authorization matrix. Every protected route must answer 401 without a token and
 * 403 for a role outside its allow list. Anything that passes the guard may still
 * fail on payload or database, so the allowed case only asserts "not 401/403".
 *
 * The route table lives in `testing/routes.ts` so `fallback.test.ts` can prove
 * the error semantics of the same GET routes.
 */
const SECRET = "authz-test-secret";

const env = {
  DB: throwingD1,
  STORAGE: undefined,
  JWT_SECRET: SECRET,
  ENVIRONMENT: "test",
};

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
