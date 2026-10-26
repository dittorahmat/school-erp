import { describe, expect, it } from "vitest";
import { app } from "../index";
import { signJwt } from "../auth/crypto";
import { createFakeD1 } from "../testing/fake-d1";

const SECRET = "enrollment-test-secret";

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

describe("Classroom Homeroom Assignment (PATCH /api/academic/classrooms/:id/homeroom)", () => {
  it("assigns a homeroom teacher successfully", async () => {
    const fakeDb = createFakeD1((sql) => {
      // 1. check existing class
      if (/from "classrooms"/i.test(sql)) {
        return [{ id: "cls_10_mipa_1" }];
      }
      // 2. check teacher user
      if (/from "users"/i.test(sql)) {
        return [{ id: "usr_teacher_1", role: "teacher" }];
      }
      return [];
    });

    const token = await tokenFor("admin");
    const res = await app.request(
      "/api/academic/classrooms/cls_10_mipa_1/homeroom",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ homeroomTeacherId: "usr_teacher_1" }),
      },
      envWith(fakeDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string; data: { id: string; homeroomTeacherId: string } };
    expect(body.data.homeroomTeacherId).toBe("usr_teacher_1");
  });

  it("can remove homeroom teacher with null", async () => {
    const fakeDb = createFakeD1((sql) => {
      if (/from "classrooms"/i.test(sql)) {
        return [{ id: "cls_10_mipa_1" }];
      }
      return [];
    });

    const token = await tokenFor("admin");
    const res = await app.request(
      "/api/academic/classrooms/cls_10_mipa_1/homeroom",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ homeroomTeacherId: null }),
      },
      envWith(fakeDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string; data: { id: string; homeroomTeacherId: string | null } };
    expect(body.data.homeroomTeacherId).toBeNull();
  });

  it("returns 404 when classroom not found", async () => {
    const fakeDb = createFakeD1(() => []);
    const token = await tokenFor("admin");
    const res = await app.request(
      "/api/academic/classrooms/cls_nonexistent/homeroom",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ homeroomTeacherId: "usr_teacher_1" }),
      },
      envWith(fakeDb)
    );

    expect(res.status).toBe(404);
  });

  it("returns 404 when teacher user not found", async () => {
    const fakeDb = createFakeD1((sql) => {
      if (/from "classrooms"/i.test(sql)) {
        return [{ id: "cls_10_mipa_1" }];
      }
      return [];
    });

    const token = await tokenFor("admin");
    const res = await app.request(
      "/api/academic/classrooms/cls_10_mipa_1/homeroom",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ homeroomTeacherId: "usr_nonexistent" }),
      },
      envWith(fakeDb)
    );

    expect(res.status).toBe(404);
  });

  it("rejects assigning non-teacher/admin as homeroom teacher", async () => {
    const fakeDb = createFakeD1((sql) => {
      if (/from "classrooms"/i.test(sql)) {
        return [{ id: "cls_10_mipa_1" }];
      }
      if (/from "users"/i.test(sql)) {
        return [{ id: "usr_student_1", role: "student" }];
      }
      return [];
    });

    const token = await tokenFor("admin");
    const res = await app.request(
      "/api/academic/classrooms/cls_10_mipa_1/homeroom",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ homeroomTeacherId: "usr_student_1" }),
      },
      envWith(fakeDb)
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("bukan guru");
  });
});

describe("Student Enrollment (POST & DELETE /api/academic/classrooms/:id/enroll)", () => {
  it("enrolls a student into a classroom successfully", async () => {
    const fakeDb = createFakeD1((sql) => {
      if (/from "classrooms"/i.test(sql)) {
        return [{ id: "cls_10_mipa_1", academicYearId: "ay_2026_2027" }];
      }
      if (/from "users"/i.test(sql)) {
        return [{ id: "usr_student_1", role: "student" }];
      }
      if (/from "student_enrollments"/i.test(sql)) {
        return []; // not yet enrolled
      }
      return [];
    });

    const token = await tokenFor("admin");
    const res = await app.request(
      "/api/academic/classrooms/cls_10_mipa_1/enroll",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId: "usr_student_1" }),
      },
      envWith(fakeDb)
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { studentId: string; classroomId: string; academicYearId: string } };
    expect(body.data.studentId).toBe("usr_student_1");
    expect(body.data.classroomId).toBe("cls_10_mipa_1");
    expect(body.data.academicYearId).toBe("ay_2026_2027");
  });

  it("rejects duplicate enrollment in the same classroom", async () => {
    const fakeDb = createFakeD1((sql) => {
      if (/from "classrooms"/i.test(sql)) {
        return [{ id: "cls_10_mipa_1", academicYearId: "ay_2026_2027" }];
      }
      if (/from "users"/i.test(sql)) {
        return [{ id: "usr_student_1", role: "student" }];
      }
      if (/from "student_enrollments"/i.test(sql)) {
        return [{ id: "enr_001" }]; // already enrolled
      }
      return [];
    });

    const token = await tokenFor("admin");
    const res = await app.request(
      "/api/academic/classrooms/cls_10_mipa_1/enroll",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId: "usr_student_1" }),
      },
      envWith(fakeDb)
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("sudah terdaftar");
  });

  it("rejects enrolling non-student user", async () => {
    const fakeDb = createFakeD1((sql) => {
      if (/from "classrooms"/i.test(sql)) {
        return [{ id: "cls_10_mipa_1", academicYearId: "ay_2026_2027" }];
      }
      if (/from "users"/i.test(sql)) {
        return [{ id: "usr_teacher_1", role: "teacher" }];
      }
      return [];
    });

    const token = await tokenFor("admin");
    const res = await app.request(
      "/api/academic/classrooms/cls_10_mipa_1/enroll",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId: "usr_teacher_1" }),
      },
      envWith(fakeDb)
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Pengguna bukan siswa");
  });

  it("unenrolls a student from classroom successfully", async () => {
    const fakeDb = createFakeD1((sql) => {
      if (/from "student_enrollments"/i.test(sql)) {
        return [{ id: "enr_001" }];
      }
      return [];
    });

    const token = await tokenFor("admin");
    const res = await app.request(
      "/api/academic/classrooms/cls_10_mipa_1/enroll/usr_student_1",
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      envWith(fakeDb)
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string; classroomId: string; studentId: string };
    expect(body.classroomId).toBe("cls_10_mipa_1");
    expect(body.studentId).toBe("usr_student_1");
  });

  it("returns 404 when unenroll target is not found in classroom", async () => {
    const fakeDb = createFakeD1(() => []);

    const token = await tokenFor("admin");
    const res = await app.request(
      "/api/academic/classrooms/cls_10_mipa_1/enroll/usr_student_999",
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      envWith(fakeDb)
    );

    expect(res.status).toBe(404);
  });
});
