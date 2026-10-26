import { describe, expect, it } from "vitest";
import { app } from "../index";
import { signJwt } from "../auth/crypto";
import { createFakeD1 } from "../testing/fake-d1";
import { demoAcademicYears } from "@school-erp/db";

const SECRET = "years-test-secret";

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

describe("Academic Years Management (GET, POST, PATCH /api/academic/years)", () => {
  describe("GET /api/academic/years", () => {
    it("returns all academic years on seeded database ordered by createdAt desc", async () => {
      const mockYears = [
        {
          id: "ay_2026",
          name: "2026/2027",
          isActive: true,
          semester: "odd",
          startDate: "2026-07-15",
          endDate: "2026-12-20",
          createdAt: new Date("2026-07-01"),
        },
        {
          id: "ay_2025",
          name: "2025/2026",
          isActive: false,
          semester: "even",
          startDate: "2026-01-05",
          endDate: "2026-06-20",
          createdAt: new Date("2025-07-01"),
        },
      ];

      const fakeDb = createFakeD1((sql) => {
        if (/from "academic_years"/i.test(sql)) {
          return mockYears;
        }
        return [];
      });

      const token = await tokenFor("teacher");
      const res = await app.request(
        "/api/academic/years",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(fakeDb)
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { data: typeof mockYears };
      expect(json.data.length).toBe(2);
      expect(json.data[0].id).toBe("ay_2026");
    });

    it("returns active year when query param active=true", async () => {
      const mockYears = [
        {
          id: "ay_2026",
          name: "2026/2027",
          isActive: true,
          semester: "odd",
          startDate: "2026-07-15",
          endDate: "2026-12-20",
          createdAt: new Date("2026-07-01"),
        },
        {
          id: "ay_2025",
          name: "2025/2026",
          isActive: false,
          semester: "even",
          startDate: "2026-01-05",
          endDate: "2026-06-20",
          createdAt: new Date("2025-07-01"),
        },
      ];

      const fakeDb = createFakeD1((sql) => {
        if (/from "academic_years"/i.test(sql)) {
          return mockYears;
        }
        return [];
      });

      const token = await tokenFor("student");
      const res = await app.request(
        "/api/academic/years?active=true",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(fakeDb)
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { data: (typeof mockYears)[0] };
      expect(json.data.id).toBe("ay_2026");
      expect(json.data.isActive).toBe(true);
    });

    it("falls back to demo data on unseeded database", async () => {
      const fakeDb = createFakeD1(() => []);

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/academic/years",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(fakeDb)
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { data: Array<{ id: string; name: string }> };
      expect(json.data.length).toBe(demoAcademicYears.length);
      expect(json.data[0].name).toBe(demoAcademicYears[0].name);
    });
  });

  describe("POST /api/academic/years", () => {
    it("allows admin to create a new academic year", async () => {
      let insertCalled = false;
      const fakeDb = createFakeD1((sql) => {
        if (/insert into "academic_years"/i.test(sql)) {
          insertCalled = true;
          return [];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/academic/years",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "2027/2028",
            semester: "odd",
            isActive: false,
            startDate: "2027-07-15",
            endDate: "2027-12-20",
          }),
        },
        envWith(fakeDb)
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { data: { id: string; name: string; semester: string } };
      expect(json.data.name).toBe("2027/2028");
      expect(json.data.semester).toBe("odd");
      expect(insertCalled).toBe(true);
    });

    it("rejects invalid payload", async () => {
      const fakeDb = createFakeD1();
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/years",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "27", // too short, min is 4
            semester: "invalid",
          }),
        },
        envWith(fakeDb)
      );

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/academic/years/:id/activate", () => {
    it("activates chosen year and sets other years inactive", async () => {
      let updateCount = 0;
      const fakeDb = createFakeD1((sql) => {
        if (/select .* from "academic_years"/i.test(sql)) {
          return [
            {
              id: "ay_target",
              name: "2027/2028",
              isActive: updateCount > 0,
              semester: "odd",
              startDate: "2027-07-15",
              endDate: "2027-12-20",
              createdAt: new Date(),
            },
          ];
        }
        if (/update "academic_years"/i.test(sql)) {
          updateCount++;
          return [];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/academic/years/ay_target/activate",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(fakeDb)
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { message: string; data: { id: string; isActive: boolean } };
      expect(json.message).toBe("Tahun ajaran berhasil diaktifkan");
      expect(json.data.id).toBe("ay_target");
      expect(updateCount).toBe(2); // once for reset all to false, once for target to true
    });

    it("returns 404 when activating nonexistent year", async () => {
      const fakeDb = createFakeD1(() => []);
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/years/ay_nonexistent/activate",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(fakeDb)
      );

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/academic/years/:id", () => {
    it("allows admin to update name, semester, and dates", async () => {
      let updateCalled = false;
      const fakeDb = createFakeD1((sql) => {
        if (/select .* from "academic_years"/i.test(sql)) {
          return [
            {
              id: "ay_edit",
              name: "2027/2028 Revised",
              isActive: false,
              semester: "even",
              startDate: "2028-01-05",
              endDate: "2028-06-25",
              createdAt: new Date(),
            },
          ];
        }
        if (/update "academic_years"/i.test(sql)) {
          updateCalled = true;
          return [];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/academic/years/ay_edit",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "2027/2028 Revised",
            semester: "even",
            startDate: "2028-01-05",
            endDate: "2028-06-25",
          }),
        },
        envWith(fakeDb)
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { message: string; data: { id: string; name: string; semester: string } };
      expect(json.data.name).toBe("2027/2028 Revised");
      expect(json.data.semester).toBe("even");
      expect(updateCalled).toBe(true);
    });

    it("returns 404 when updating nonexistent year", async () => {
      const fakeDb = createFakeD1(() => []);
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/years/ay_nonexistent",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "2027/2028",
          }),
        },
        envWith(fakeDb)
      );

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid date format", async () => {
      const fakeDb = createFakeD1();
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/years/ay_test",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: "15-07-2027", // invalid format, expects YYYY-MM-DD
          }),
        },
        envWith(fakeDb)
      );

      expect(res.status).toBe(400);
    });
  });
});
