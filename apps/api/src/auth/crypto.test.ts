import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signJwt, verifyJwt } from "./crypto";

describe("Edge Web Crypto Auth", () => {
  it("should hash and verify passwords correctly", async () => {
    const raw = "Admin123!Secure";
    const hashed = await hashPassword(raw);
    expect(hashed).toContain(":");

    const ok = await verifyPassword(raw, hashed);
    expect(ok).toBe(true);

    const fail = await verifyPassword("WrongPassword", hashed);
    expect(fail).toBe(false);
  });

  it("should sign and verify JWT correctly", async () => {
    const secret = "very-secret-test-key-32-chars-long";
    const payload = {
      sub: "usr_123",
      username: "admin",
      fullName: "Super Admin",
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = await signJwt(payload, secret);
    expect(token.split(".")).toHaveLength(3);

    const verified = await verifyJwt(token, secret);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("usr_123");
    expect(verified?.role).toBe("admin");

    const badVerify = await verifyJwt(token, "wrong-secret-key-32-chars-long");
    expect(badVerify).toBeNull();
  });
});
