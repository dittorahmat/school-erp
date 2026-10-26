import { describe, expect, it } from "vitest";
import { app } from "../index";
import { signJwt } from "../auth/crypto";
import { createFakeD1 } from "../testing/fake-d1";
import { demoUsers } from "@school-erp/db";

const SECRET = "students-test-secret";

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

describe("GET /api/academic/students", () => {
  it("returns demo students on an unseeded database", async () => {
    const emptyDb = createFakeD1(() => []);
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/academic/students",
      { headers: { Authorization: `Bearer ${token}` } },
      envWith(emptyDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; role?: string; currentClassroom: string | null }> };
    expect(body.data.length).toBe(demoUsers.filter((u) => u.role === "student").length);
    expect(body.data[0].id).toBe("usr_student_1");
    expect(body.data[0].currentClassroom).toBe("X-MIPA-1");
  });

  it("returns empty list on seeded database with no students", async () => {
    const seededNoStudentsDb = createFakeD1((sql) => {
      // isEmptyDatabase query:
      if (/limit \?/i.test(sql) && !/where/i.test(sql)) {
        return [{ id: "usr_admin" }];
      }
      return [];
    });
    const token = await tokenFor("teacher");

    const res = await app.request(
      "/api/academic/students",
      { headers: { Authorization: `Bearer ${token}` } },
      envWith(seededNoStudentsDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown[] };
    expect(body.data).toEqual([]);
  });

  it("returns students with classroom on seeded database", async () => {
    const seededWithStudentsDb = createFakeD1((sql) => {
      if (/where "users"\."role" = \?/i.test(sql)) {
        return [
          {
            id: "usr_s1",
            username: "siswa_s1",
            fullName: "Siswa Satu",
            email: "s1@test.com",
            phone: "0812345",
            createdAt: new Date(),
          },
        ];
      }
      if (/from "student_enrollments"/i.test(sql)) {
        return [
          {
            studentId: "usr_s1",
            classroomName: "X-MIPA-1",
          },
        ];
      }
      return [];
    });
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/academic/students",
      { headers: { Authorization: `Bearer ${token}` } },
      envWith(seededWithStudentsDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; currentClassroom: string | null }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("usr_s1");
    expect(body.data[0].currentClassroom).toBe("X-MIPA-1");
  });
});

describe("POST /api/academic/students", () => {
  it("validates payload and rejects duplicate username", async () => {
    const db = createFakeD1((sql) => {
      if (/where "users"\."username" = \?/i.test(sql)) {
        return [{ id: "usr_existing" }];
      }
      return [];
    });
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/academic/students",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "existing_user",
          password: "password123",
          fullName: "Siswa Baru",
        }),
      },
      envWith(db)
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Username sudah digunakan");
  });

  it("creates a student with valid payload", async () => {
    const db = createFakeD1(() => []);
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/academic/students",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "siswa_baru",
          password: "password123",
          fullName: "Siswa Baru",
          email: "baru@school.sch.id",
          phone: "081234567890",
        }),
      },
      envWith(db)
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { message: string; data: { id: string; username: string; fullName: string } };
    expect(body.message).toBe("Data siswa berhasil ditambahkan");
    expect(body.data.username).toBe("siswa_baru");
    expect(body.data.fullName).toBe("Siswa Baru");
  });
});

describe("PATCH & DELETE /api/academic/students/:id", () => {
  it("returns 404 if student not found", async () => {
    const db = createFakeD1(() => []);
    const token = await tokenFor("admin");

    const patchRes = await app.request(
      "/api/academic/students/usr_not_found",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName: "Updated Name" }),
      },
      envWith(db)
    );
    expect(patchRes.status).toBe(404);

    const delRes = await app.request(
      "/api/academic/students/usr_not_found",
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
      envWith(db)
    );
    expect(delRes.status).toBe(404);
  });

  it("updates and deletes student when found", async () => {
    const now = new Date();
    const db = createFakeD1((sql) => {
      if (/where "users"\."id" = \?/i.test(sql)) {
        return [
          {
            id: "usr_student_test",
            username: "siswa_test",
            passwordHash: "hash123",
            fullName: "Old Name",
            role: "student",
            email: "old@test.com",
            phone: "08123",
            createdAt: now,
            updatedAt: now,
          },
        ];
      }
      return [];
    });
    const token = await tokenFor("admin");

    const patchRes = await app.request(
      "/api/academic/students/usr_student_test",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName: "New Name" }),
      },
      envWith(db)
    );
    expect(patchRes.status).toBe(200);

    const delRes = await app.request(
      "/api/academic/students/usr_student_test",
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
      envWith(db)
    );
    expect(delRes.status).toBe(200);
  });
});
