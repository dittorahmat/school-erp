import { describe, expect, it } from "vitest";
import { app } from "../index";
import { signJwt } from "../auth/crypto";
import { createFakeD1 } from "../testing/fake-d1";
import { demoUsers } from "@school-erp/db";

const SECRET = "staff-test-secret";

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

describe("GET /api/staff", () => {
  it("returns demo staff on an unseeded database", async () => {
    const emptyDb = createFakeD1(() => []);
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/staff",
      { headers: { Authorization: `Bearer ${token}` } },
      envWith(emptyDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; role: string; fullName: string }> };
    const expectedStaff = demoUsers.filter((u) => u.role === "teacher" || u.role === "admin");
    expect(body.data.length).toBe(expectedStaff.length);
    expect(body.data.map((u) => u.id)).toContain("usr_admin_1");
    expect(body.data.map((u) => u.id)).toContain("usr_teacher_1");
  });

  it("returns empty list on seeded database with no staff", async () => {
    const seededNoStaffDb = createFakeD1((sql) => {
      // isEmptyDatabase query:
      if (/limit \?/i.test(sql) && !/where/i.test(sql)) {
        return [{ id: "usr_student_1" }];
      }
      return [];
    });
    const token = await tokenFor("teacher");

    const res = await app.request(
      "/api/staff",
      { headers: { Authorization: `Bearer ${token}` } },
      envWith(seededNoStaffDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown[] };
    expect(body.data).toEqual([]);
  });

  it("returns staff on seeded database", async () => {
    const seededWithStaffDb = createFakeD1((sql) => {
      if (/where/i.test(sql) && /"users"\."role"/i.test(sql)) {
        return [
          {
            id: "usr_t1",
            username: "guru_t1",
            fullName: "Guru Satu",
            role: "teacher",
            email: "t1@test.com",
            phone: "0812345",
            createdAt: new Date(),
          },
        ];
      }
      return [];
    });
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/staff",
      { headers: { Authorization: `Bearer ${token}` } },
      envWith(seededWithStaffDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; role: string }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("usr_t1");
    expect(body.data[0].role).toBe("teacher");
  });
});

describe("POST /api/staff", () => {
  it("validates payload and rejects duplicate username", async () => {
    const db = createFakeD1((sql) => {
      if (/where "users"\."username" = \?/i.test(sql)) {
        return [{ id: "usr_existing" }];
      }
      return [];
    });
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/staff",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "existing_user",
          password: "password123",
          fullName: "Guru Baru",
          role: "teacher",
        }),
      },
      envWith(db)
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Username sudah digunakan");
  });

  it("creates a staff member with valid payload", async () => {
    const db = createFakeD1(() => []);
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/staff",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "guru_baru",
          password: "password123",
          fullName: "Guru Baru, S.Pd.",
          role: "teacher",
          email: "guru.baru@school.sch.id",
          phone: "081234567890",
        }),
      },
      envWith(db)
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { message: string; data: { id: string; username: string; fullName: string; role: string } };
    expect(body.message).toBe("Data staf berhasil ditambahkan");
    expect(body.data.username).toBe("guru_baru");
    expect(body.data.fullName).toBe("Guru Baru, S.Pd.");
    expect(body.data.role).toBe("teacher");
  });
});

describe("PATCH & DELETE /api/staff/:id", () => {
  it("returns 404 if staff not found", async () => {
    const db = createFakeD1(() => []);
    const token = await tokenFor("admin");

    const patchRes = await app.request(
      "/api/staff/usr_not_found",
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
      "/api/staff/usr_not_found",
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
      envWith(db)
    );
    expect(delRes.status).toBe(404);
  });

  it("prevents admin from deleting themselves", async () => {
    const db = createFakeD1(() => []);
    const adminId = "usr_admin_1_test";
    const token = await tokenFor("admin", "admin_test", adminId);

    const res = await app.request(
      `/api/staff/${adminId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
      envWith(db)
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Tidak dapat menghapus akun admin Anda sendiri");
  });

  it("updates and deletes staff when found", async () => {
    const now = new Date();
    const db = createFakeD1((sql) => {
      if (/where "users"\."id" = \?/i.test(sql)) {
        return [
          {
            id: "usr_teacher_test",
            username: "guru_test",
            passwordHash: "hash123",
            fullName: "Guru Lama",
            role: "teacher",
            email: "old@test.com",
            phone: "08123",
            createdAt: now,
            updatedAt: now,
          },
        ];
      }
      return [];
    });
    const token = await tokenFor("admin", "admin_main", "usr_admin_1_main");

    const patchRes = await app.request(
      "/api/staff/usr_teacher_test",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName: "Guru Terupdate" }),
      },
      envWith(db)
    );
    expect(patchRes.status).toBe(200);

    const delRes = await app.request(
      "/api/staff/usr_teacher_test",
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
      envWith(db)
    );
    expect(delRes.status).toBe(200);
  });
});
