import { describe, expect, it } from "vitest";
import { app } from "../index";
import { signJwt } from "../auth/crypto";
import { createFakeD1 } from "../testing/fake-d1";
import { demoSubjects } from "@school-erp/db";

const SECRET = "subjects-test-secret";

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

describe("Academic Subjects API (/api/academic/subjects)", () => {
  describe("GET /api/academic/subjects", () => {
    it("returns demo subjects on an unseeded database", async () => {
      const emptyDb = createFakeD1(() => []);
      const token = await tokenFor("teacher");

      const res = await app.request(
        "/api/academic/subjects",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(emptyDb)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: Array<{ id: string; code: string; name: string; gradeLevel: number }> };
      expect(body.data.length).toBe(demoSubjects.length);
      expect(body.data[0].code).toBe(demoSubjects[0].code);
    });

    it("filters demo subjects by gradeLevel on unseeded database", async () => {
      const emptyDb = createFakeD1(() => []);
      const token = await tokenFor("teacher");

      const res = await app.request(
        "/api/academic/subjects?gradeLevel=10",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(emptyDb)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: Array<{ id: string; gradeLevel: number }> };
      expect(body.data.every((s) => s.gradeLevel === 10)).toBe(true);
      expect(body.data.length).toBe(demoSubjects.filter((s) => s.gradeLevel === 10).length);
    });

    it("returns empty list on seeded database with no subjects", async () => {
      const seededNoSubjectsDb = createFakeD1((sql) => {
        if (/limit \?/i.test(sql) && !/where/i.test(sql)) {
          return [{ id: "usr_admin" }];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/subjects",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(seededNoSubjectsDb)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: unknown[] };
      expect(body.data).toEqual([]);
    });

    it("returns subjects from database when seeded", async () => {
      const mockSubjects = [
        { id: "sub_1", code: "MAT-7", name: "Matematika 7", gradeLevel: 7, createdAt: new Date() },
        { id: "sub_2", code: "IPA-8", name: "IPA 8", gradeLevel: 8, createdAt: new Date() },
      ];
      const db = createFakeD1((sql) => {
        if (/from "subjects"/i.test(sql)) {
          return mockSubjects;
        }
        return [];
      });
      const token = await tokenFor("student");

      const res = await app.request(
        "/api/academic/subjects",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: typeof mockSubjects };
      expect(body.data).toHaveLength(2);
    });

    it("filters subjects from database by gradeLevel", async () => {
      const mockSubjects = [
        { id: "sub_1", code: "MAT-7", name: "Matematika 7", gradeLevel: 7, createdAt: new Date() },
        { id: "sub_2", code: "IPA-8", name: "IPA 8", gradeLevel: 8, createdAt: new Date() },
      ];
      const db = createFakeD1((sql) => {
        if (/from "subjects"/i.test(sql)) {
          return mockSubjects;
        }
        return [];
      });
      const token = await tokenFor("teacher");

      const res = await app.request(
        "/api/academic/subjects?gradeLevel=7",
        { headers: { Authorization: `Bearer ${token}` } },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { data: typeof mockSubjects };
      expect(body.data).toHaveLength(1);
      expect(body.data[0].code).toBe("MAT-7");
    });
  });

  describe("POST /api/academic/subjects", () => {
    it("validates required fields and gradeLevel bounds (7-12)", async () => {
      const db = createFakeD1(() => []);
      const token = await tokenFor("admin");

      const resInvalidGrade = await app.request(
        "/api/academic/subjects",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: "MAT-6",
            name: "Matematika 6",
            gradeLevel: 6, // invalid: < 7
          }),
        },
        envWith(db)
      );

      expect(resInvalidGrade.status).toBe(400);

      const resMissingCode = await app.request(
        "/api/academic/subjects",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: "",
            name: "Matematika",
            gradeLevel: 10,
          }),
        },
        envWith(db)
      );

      expect(resMissingCode.status).toBe(400);
    });

    it("prevents duplicate subject code", async () => {
      const db = createFakeD1((sql) => {
        if (/from "subjects" where "subjects"\."code" = \?/i.test(sql)) {
          return [{ id: "sub_existing" }];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/subjects",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: "MAT-10",
            name: "Matematika 10",
            gradeLevel: 10,
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(409);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("Kode mata pelajaran sudah digunakan");
    });

    it("successfully creates a new subject", async () => {
      let inserted = false;
      const db = createFakeD1((sql) => {
        if (/insert into "subjects"/i.test(sql)) {
          inserted = true;
          return [];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/subjects",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: "BIO-10",
            name: "Biologi Kelas 10",
            gradeLevel: 10,
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(201);
      const body = (await res.json()) as { message: string; data: { id: string; code: string; name: string; gradeLevel: number } };
      expect(body.message).toContain("berhasil ditambahkan");
      expect(body.data.code).toBe("BIO-10");
      expect(body.data.gradeLevel).toBe(10);
      expect(inserted).toBe(true);
    });
  });

  describe("PATCH /api/academic/subjects/:id", () => {
    it("returns 404 when subject not found", async () => {
      const db = createFakeD1(() => []);
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/subjects/sub_notfound",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "New Name",
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(404);
    });

    it("returns 409 when changing code to already existing code", async () => {
      const db = createFakeD1((sql) => {
        if (/from "subjects" where "subjects"\."id" = \?/i.test(sql)) {
          return [{ id: "sub_1", code: "MAT-10", name: "Matematika", gradeLevel: 10 }];
        }
        if (/from "subjects" where "subjects"\."code" = \?/i.test(sql)) {
          return [{ id: "sub_2" }];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/subjects/sub_1",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: "ENG-10",
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(409);
    });

    it("updates subject successfully when valid", async () => {
      let updated = false;
      const db = createFakeD1((sql) => {
        if (/from "subjects" where "subjects"\."id" = \?/i.test(sql)) {
          return [{ id: "sub_1", code: "MAT-10", name: "Matematika", gradeLevel: 10 }];
        }
        if (/update "subjects"/i.test(sql)) {
          updated = true;
          return [];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/subjects/sub_1",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Matematika Wajib",
            gradeLevel: 10,
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { message: string; data: { id: string; name: string } };
      expect(body.data.name).toBe("Matematika Wajib");
      expect(updated).toBe(true);
    });
  });

  describe("DELETE /api/academic/subjects/:id", () => {
    it("returns 404 when subject to delete not found", async () => {
      const db = createFakeD1(() => []);
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/subjects/sub_notfound",
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

    it("deletes subject successfully", async () => {
      const executedSqls: string[] = [];
      const db = createFakeD1((sql) => {
        executedSqls.push(sql);
        if (/from "subjects" where "subjects"\."id" = \?/i.test(sql)) {
          return [{ id: "sub_1", code: "MAT-10", name: "Matematika", gradeLevel: 10 }];
        }
        return [];
      });
      const token = await tokenFor("admin");

      const res = await app.request(
        "/api/academic/subjects/sub_1",
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
      expect(body.id).toBe("sub_1");
      expect(executedSqls.some((sql) => /delete from "subjects"/i.test(sql))).toBe(true);
    });
  });
});
