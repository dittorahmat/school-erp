import { describe, it, expect } from "vitest";
import app from "../index";
import { throwingD1 } from "../testing/fake-d1";

const env = {
  DB: throwingD1,
  STORAGE: undefined,
  JWT_SECRET: "auth-routes-test-secret",
  ENVIRONMENT: "test",
};

describe("Auth Routes", () => {
  it("should fail login with empty body", async () => {
    const res = await app.request(
      "http://localhost/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      },
      env
    );
    expect(res.status).toBe(400);
  });

  it("should reject /api/auth/me without token", async () => {
    const res = await app.request("http://localhost/api/auth/me", {}, env);
    expect(res.status).toBe(401);
  });
});
