import { describe, it, expect } from "vitest";
import app from "../index";

describe("Auth Routes", () => {
  it("should fail login with empty body", async () => {
    const res = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("should reject /api/auth/me without token", async () => {
    const res = await app.request("http://localhost/api/auth/me");
    expect(res.status).toBe(401);
  });
});
