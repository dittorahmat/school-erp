import { describe, expect, it } from "vitest";
import { app } from "../index";
import { signJwt } from "../auth/crypto";
import { createFakeD1 } from "../testing/fake-d1";
import { demoUsers } from "@school-erp/db";

const SECRET = "guardians-test-secret";

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

describe("GET /api/guardians", () => {
  it("returns demo guardians with linked students on an unseeded database", async () => {
    const emptyDb = createFakeD1(() => []);
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians",
      { headers: { Authorization: `Bearer ${token}` } },
      envWith(emptyDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: Array<{
        id: string;
        role: string;
        fullName: string;
        students: Array<{ id: string; name: string; relationship: string }>;
      }>;
    };
    const expectedGuardians = demoUsers.filter((u) => u.role === "guardian");
    expect(body.data.length).toBe(expectedGuardians.length);
    expect(body.data.map((u) => u.id)).toContain("usr_guardian_1");

    const guardian1 = body.data.find((g) => g.id === "usr_guardian_1");
    expect(guardian1?.students.length).toBeGreaterThan(0);
    expect(guardian1?.students[0].name).toBeTruthy();
  });

  it("returns empty list on seeded database with no guardians", async () => {
    const seededNoGuardiansDb = createFakeD1((sql) => {
      // isEmptyDatabase query
      if (/limit \?/i.test(sql) && !/where/i.test(sql)) {
        return [{ id: "usr_student_1" }];
      }
      return [];
    });
    const token = await tokenFor("teacher");

    const res = await app.request(
      "/api/guardians",
      { headers: { Authorization: `Bearer ${token}` } },
      envWith(seededNoGuardiansDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown[] };
    expect(body.data).toEqual([]);
  });

  it("returns guardians with student links on seeded database", async () => {
    const seededDb = createFakeD1((sql) => {
      if (/from "users"/i.test(sql) && /"role" = \?/i.test(sql)) {
        return [
          {
            id: "usr_g1",
            username: "wali_bambang",
            fullName: "Bambang",
            role: "guardian",
            email: "bambang@test.com",
            phone: "0812345",
            createdAt: new Date(),
          },
        ];
      }
      if (/from "guardian_students"/i.test(sql)) {
        return [
          {
            guardianId: "usr_g1",
            studentId: "usr_s1",
            relationship: "Ayah",
            studentName: "Ahmad Dahlan",
          },
        ];
      }
      return [];
    });
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians",
      { headers: { Authorization: `Bearer ${token}` } },
      envWith(seededDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: Array<{
        id: string;
        fullName: string;
        students: Array<{ id: string; name: string; relationship: string }>;
      }>;
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("usr_g1");
    expect(body.data[0].students).toHaveLength(1);
    expect(body.data[0].students[0].name).toBe("Ahmad Dahlan");
  });
});

describe("POST /api/guardians", () => {
  it("rejects invalid payload", async () => {
    const emptyDb = createFakeD1(() => []);
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "w", // too short
          password: "123", // too short
        }),
      },
      envWith(emptyDb)
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBeTruthy();
  });

  it("creates a guardian successfully with optional student links", async () => {
    const insertedUsers: any[] = [];
    const insertedLinks: any[] = [];

    const db = createFakeD1((sql) => {
      // uniqueness check
      if (/where "users"\."username" = \?/i.test(sql)) {
        return [];
      }
      // student validation check
      if (/where "users"\."id" in/i.test(sql)) {
        return [{ id: "usr_student_1", role: "student" }];
      }
      if (/insert into "users"/i.test(sql)) {
        insertedUsers.push(sql);
        return [];
      }
      if (/insert into "guardian_students"/i.test(sql)) {
        insertedLinks.push(sql);
        return [];
      }
      return [];
    });

    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "wali_baru",
          password: "password123",
          fullName: "Wali Baru",
          email: "wali@test.com",
          phone: "08987654321",
          studentIds: ["usr_student_1"],
        }),
      },
      envWith(db)
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      message: string;
      data: { id: string; username: string; role: string; studentIds: string[] };
    };
    expect(body.data.username).toBe("wali_baru");
    expect(body.data.role).toBe("guardian");
    expect(body.data.studentIds).toEqual(["usr_student_1"]);
    expect(insertedUsers.length).toBe(1);
    expect(insertedLinks.length).toBe(1);
  });

  it("rejects non-existent student IDs during creation", async () => {
    const db = createFakeD1((sql) => {
      if (/where "users"\."username" = \?/i.test(sql)) return [];
      if (/where "users"\."id" in/i.test(sql)) return []; // student not found
      return [];
    });

    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "wali_baru2",
          password: "password123",
          fullName: "Wali Baru 2",
          studentIds: ["invalid_student"],
        }),
      },
      envWith(db)
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("siswa tidak valid");
  });
});

describe("PATCH /api/guardians/:id", () => {
  it("updates guardian profile", async () => {
    let updateExecuted = false;
    const db = createFakeD1((sql) => {
      if (/from "users"/i.test(sql)) {
        return [{ id: "usr_g1", role: "guardian" }];
      }
      if (/update.*"users"/i.test(sql)) {
        updateExecuted = true;
        return [];
      }
      return [];
    });

    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians/usr_g1",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Updated Name",
          phone: "08999999",
        }),
      },
      envWith(db)
    );

    expect(res.status).toBe(200);
    expect(updateExecuted).toBe(true);
  });

  it("returns 404 for non-existent guardian", async () => {
    const db = createFakeD1(() => []);
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians/usr_nonexistent",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Name",
        }),
      },
      envWith(db)
    );

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/guardians/:id", () => {
  it("deletes guardian and student links", async () => {
    let userDeleted = false;
    let linksDeleted = false;

    const db = createFakeD1((sql) => {
      if (/from "users"/i.test(sql) && /select/i.test(sql)) {
        return [{ id: "usr_g1", role: "guardian" }];
      }
      if (/delete.*from "guardian_students"/i.test(sql)) {
        linksDeleted = true;
        return [];
      }
      if (/delete.*from "users"/i.test(sql)) {
        userDeleted = true;
        return [];
      }
      return [];
    });

    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians/usr_g1",
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
      envWith(db)
    );

    expect(res.status).toBe(200);
    expect(linksDeleted).toBe(true);
    expect(userDeleted).toBe(true);
  });
});

describe("POST /api/guardians/:id/students & DELETE /api/guardians/:id/students/:studentId", () => {
  it("links student to guardian", async () => {
    let linkInserted = false;

    let userQueryCount = 0;
    const customDb = createFakeD1((sql) => {
      if (/from "users"/i.test(sql)) {
        userQueryCount++;
        if (userQueryCount === 1) {
          // First query: guardian check
          return [{ id: "usr_g1", role: "guardian" }];
        }
        // Second query: student check
        return [{ id: "usr_s1", role: "student", fullName: "Siswa Satu" }];
      }
      if (/from "guardian_students"/i.test(sql)) {
        return [];
      }
      if (/insert into "guardian_students"/i.test(sql)) {
        linkInserted = true;
        return [];
      }
      return [];
    });

    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians/usr_g1/students",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: "usr_s1",
          relationship: "Ibu",
        }),
      },
      envWith(customDb)
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { studentId: string; relationship: string; studentName: string } };
    expect(body.data.studentId).toBe("usr_s1");
    expect(body.data.relationship).toBe("Ibu");
    expect(body.data.studentName).toBe("Siswa Satu");
    expect(linkInserted).toBe(true);
  });

  it("rejects duplicate student link", async () => {
    let userQueryCount = 0;
    const customDb = createFakeD1((sql) => {
      if (/from "users"/i.test(sql)) {
        userQueryCount++;
        if (userQueryCount === 1) {
          return [{ id: "usr_g1", role: "guardian" }];
        }
        return [{ id: "usr_s1", role: "student", fullName: "Siswa Satu" }];
      }
      if (/from "guardian_students"/i.test(sql)) {
        return [{ id: "gs_existing" }];
      }
      return [];
    });

    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians/usr_g1/students",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: "usr_s1",
        }),
      },
      envWith(customDb)
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("sudah terhubung");
  });

  it("unlinks student from guardian", async () => {
    let linkDeleted = false;
    const customDb = createFakeD1((sql) => {
      if (/select.*from "guardian_students"/i.test(sql)) {
        return [{ id: "gs_1" }];
      }
      if (/delete from "guardian_students"/i.test(sql)) {
        linkDeleted = true;
        return [];
      }
      return [];
    });

    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians/usr_g1/students/usr_s1",
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
      envWith(customDb)
    );

    expect(res.status).toBe(200);
    expect(linkDeleted).toBe(true);
  });

  it("returns 404 when unlinking non-existent link", async () => {
    const customDb = createFakeD1(() => []);
    const token = await tokenFor("admin");

    const res = await app.request(
      "/api/guardians/usr_g1/students/usr_nonexistent",
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
      envWith(customDb)
    );

    expect(res.status).toBe(404);
  });
});
