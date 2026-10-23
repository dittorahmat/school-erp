import { describe, it, expect } from "vitest";
import app from "./index";

describe("API Health Check", () => {
  it("should return ok on /api/health", async () => {
    const res = await app.request("http://localhost/api/health");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; service: string };
    expect(data.status).toBe("ok");
    expect(data.service).toBe("school-erp-api");
  });
});
