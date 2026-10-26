import { describe, expect, it } from "vitest";
import { app } from "../index";
import { signJwt } from "../auth/crypto";
import { createFakeD1 } from "../testing/fake-d1";
import { demoFeeComponents } from "@school-erp/db";

const SECRET = "fee-components-test-secret";

async function tokenFor(role: string, username = `${role}_test`, sub = `usr_${role}_test`) {
  return signJwt(
    {
      sub,
      username,
      fullName: `Test ${role}`,
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    SECRET
  );
}

function envWith(db: D1Database) {
  return {
    DB: db,
    STORAGE: undefined,
    JWT_SECRET: SECRET,
    ENVIRONMENT: "test",
  };
}

describe("Fee Components & Manual Invoice API (/api/finance)", () => {
  describe("GET /api/finance/fee-components", () => {
    it("returns demo fee components on an unseeded database", async () => {
      const emptyDb = createFakeD1(() => []);
      const token = await tokenFor("teacher");

      const res = await app.request(
        "/api/finance/fee-components",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(emptyDb)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: Array<{ id: string; name: string; amount: number }> };
      expect(body.data.length).toBe(demoFeeComponents.length);
      expect(body.data[0].id).toBe(demoFeeComponents[0].id);
      expect(body.data[0].amount).toBe(demoFeeComponents[0].amount);
    });

    it("returns empty list on seeded database with no fee components", async () => {
      const seededNoFeesDb = createFakeD1((sql) => {
        if (/from "users"/i.test(sql) && /limit \?/i.test(sql)) {
          return [{ id: "usr_admin" }];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/fee-components",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(seededNoFeesDb)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: unknown[] };
      expect(body.data).toEqual([]);
    });

    it("returns fee components from database when populated", async () => {
      const mockComponents = [
        { id: "fee_spp_custom", name: "SPP Unggulan", amount: 500000, isRecurring: true, createdAt: new Date() },
      ];
      const db = createFakeD1((sql) => {
        if (/from "fee_components"/i.test(sql)) {
          return mockComponents;
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/fee-components",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: typeof mockComponents };
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe("SPP Unggulan");
      expect(body.data[0].amount).toBe(500000);
    });
  });

  describe("POST /api/finance/fee-components", () => {
    it("rejects invalid payload (missing name or non-positive amount)", async () => {
      const db = createFakeD1(() => []);
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/fee-components",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "",
            amount: -1000,
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("Data komponen biaya tidak valid");
    });

    it("creates fee component successfully when payload is valid", async () => {
      let inserted = false;
      const db = createFakeD1((sql) => {
        if (/insert into "fee_components"/i.test(sql)) {
          inserted = true;
          return [];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/fee-components",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Uang Praktikum Laboratorium",
            amount: 250000,
            gradeLevel: 10,
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        message: string;
        data: { id: string; name: string; amount: number; gradeLevel: number | null };
      };
      expect(body.message).toContain("berhasil ditambahkan");
      expect(body.data.name).toBe("Uang Praktikum Laboratorium");
      expect(body.data.amount).toBe(250000);
      expect(body.data.gradeLevel).toBe(10);
      expect(inserted).toBe(true);
    });
  });

  describe("PATCH /api/finance/fee-components/:id", () => {
    it("returns 404 when component not found", async () => {
      const db = createFakeD1(() => []);
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/fee-components/fee_notfound",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Name",
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(404);
    });

    it("updates fee component successfully", async () => {
      let updated = false;
      const db = createFakeD1((sql) => {
        if (/from "fee_components" where "fee_components"\."id" = \?/i.test(sql)) {
          return [{ id: "fee_spp", name: "SPP Bulanan", amount: 350000, isRecurring: true, createdAt: new Date() }];
        }
        if (/update "fee_components"/i.test(sql)) {
          updated = true;
          return [];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/fee-components/fee_spp",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "SPP Bulanan Reguler",
            amount: 375000,
            gradeLevel: 11,
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        message: string;
        data: { id: string; name: string; amount: number; gradeLevel: number | null };
      };
      expect(body.data.name).toBe("SPP Bulanan Reguler");
      expect(body.data.amount).toBe(375000);
      expect(body.data.gradeLevel).toBe(11);
      expect(updated).toBe(true);
    });
  });

  describe("DELETE /api/finance/fee-components/:id", () => {
    it("returns 404 when component to delete not found", async () => {
      const db = createFakeD1(() => []);
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/fee-components/fee_notfound",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        envWith(db)
      );

      expect(res.status).toBe(404);
    });

    it("deletes component successfully", async () => {
      const executedSqls: string[] = [];
      const db = createFakeD1((sql) => {
        executedSqls.push(sql);
        if (/from "fee_components" where "fee_components"\."id" = \?/i.test(sql)) {
          return [{ id: "fee_kegiatan", name: "Kegiatan", amount: 150000, isRecurring: false, createdAt: new Date() }];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/fee-components/fee_kegiatan",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { message: string; id: string };
      expect(body.id).toBe("fee_kegiatan");
      expect(executedSqls.some((sql) => /delete from "fee_components"/i.test(sql))).toBe(true);
    });
  });

  describe("POST /api/finance/invoices (Manual Invoice)", () => {
    it("rejects when student is not found or not role student", async () => {
      const db = createFakeD1((sql) => {
        if (/from "users"/i.test(sql)) {
          return [{ id: "usr_teacher_1", role: "teacher", fullName: "Budi Teacher" }];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/invoices",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: "usr_teacher_1",
            feeComponentId: "fee_spp",
            amount: 350000,
            month: "2026-11",
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("bukan berstatus siswa");
    });

    it("rejects when fee component is not found", async () => {
      const db = createFakeD1((sql) => {
        if (/from "users"/i.test(sql)) {
          return [{ id: "usr_student_1", role: "student", fullName: "Ahmad Siswa" }];
        }
        if (/from "fee_components"/i.test(sql)) {
          return [];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/invoices",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: "usr_student_1",
            feeComponentId: "fee_notfound",
            amount: 350000,
            month: "2026-11",
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("Komponen biaya tidak ditemukan");
    });

    it("creates invoice successfully with active academic year", async () => {
      let invoiceInserted = false;
      const db = createFakeD1((sql) => {
        if (/from "users"/i.test(sql)) {
          return [{ id: "usr_student_1", role: "student", fullName: "Ahmad Siswa" }];
        }
        if (/from "fee_components"/i.test(sql)) {
          return [{ id: "fee_spp", name: "SPP Bulanan" }];
        }
        if (/from "academic_years"/i.test(sql)) {
          return [{ id: "ay_2026_2027" }];
        }
        if (/insert into "invoices"/i.test(sql)) {
          invoiceInserted = true;
          return [];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/finance/invoices",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: "usr_student_1",
            feeComponentId: "fee_spp",
            amount: 350000,
            month: "2026-11",
            dueDate: "2026-11-15",
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        message: string;
        data: {
          id: string;
          studentId: string;
          feeComponentId: string;
          amount: number;
          month: string;
          status: string;
          studentName: string;
          componentName: string;
        };
      };
      expect(body.message).toContain("berhasil dibuat");
      expect(body.data.id).toMatch(/^INV-2026-11-/);
      expect(body.data.studentId).toBe("usr_student_1");
      expect(body.data.feeComponentId).toBe("fee_spp");
      expect(body.data.amount).toBe(350000);
      expect(body.data.status).toBe("unpaid");
      expect(body.data.studentName).toBe("Ahmad Siswa");
      expect(body.data.componentName).toBe("SPP Bulanan");
      expect(invoiceInserted).toBe(true);
    });
  });
});
