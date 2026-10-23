import { describe, it, expect } from "vitest";
import { UserRole, loginSchema } from "./index";

describe("Shared Package Domain Primitives", () => {
  it("should have correct roles defined", () => {
    expect(UserRole.ADMIN).toBe("admin");
    expect(UserRole.TEACHER).toBe("teacher");
    expect(UserRole.STUDENT).toBe("student");
    expect(UserRole.GUARDIAN).toBe("guardian");
  });

  it("should validate valid login schema", () => {
    const valid = loginSchema.safeParse({
      username: "admin1",
      password: "secretpassword",
    });
    expect(valid.success).toBe(true);
  });

  it("should reject invalid login schema", () => {
    const invalid = loginSchema.safeParse({
      username: "ab",
      password: "123",
    });
    expect(invalid.success).toBe(false);
  });
});
