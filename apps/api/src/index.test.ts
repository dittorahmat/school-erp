import { describe, it, expect } from "vitest";
import app from "./index";

const envWithoutSecret = {
  DB: {} as D1Database,
  STORAGE: {} as R2Bucket,
  ENVIRONMENT: "test",
} as never;

describe("API Health Check", () => {
  it("should return ok on /api/health", async () => {
    const res = await app.request("http://localhost/api/health");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; service: string };
    expect(data.status).toBe("ok");
    expect(data.service).toBe("school-erp-api");
  });

  it("keeps health reachable without a JWT secret", async () => {
    const res = await app.request("http://localhost/api/health", {}, envWithoutSecret);
    expect(res.status).toBe(200);
  });

  it("names the missing JWT secret instead of failing inside crypto", async () => {
    const res = await app.request("http://localhost/api/dashboard/summary", {}, envWithoutSecret);
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("JWT_SECRET belum dikonfigurasi");
  });
});
