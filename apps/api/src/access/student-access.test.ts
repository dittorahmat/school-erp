import { describe, expect, it } from "vitest";
import {
  activeYearId,
  canReadStudent,
  visibleStudentIds,
  type AccessUser,
} from "./student-access";
import { createFakeD1 } from "../testing/fake-d1";
import { createDb, demoAcademicYears, demoGuardianStudents, demoUsers } from "@school-erp/db";

const activeYear = demoAcademicYears.find((year) => year.isActive)!;
const link = demoGuardianStudents[0];
const guardianRow = demoUsers.find((user) => user.id === link.guardianId)!;

const guardian = (sub: string): AccessUser => ({
  sub,
  username: guardianRow.username,
  role: "guardian",
});

const seeded = (rows: Record<string, Array<Record<string, unknown>>>) =>
  createDb(
    createFakeD1((sql) => {
      if (/"users"/.test(sql)) return [{ id: "usr_admin" }];
      if (/"academic_years"/.test(sql)) return rows.academicYears ?? [];
      if (/"guardian_students"/.test(sql)) return rows.guardianLinks ?? [];
      return [];
    })
  );

const unseeded = () => createDb(createFakeD1(() => []));

describe("activeYearId", () => {
  it("returns the active year when the database has one", async () => {
    const db = seeded({ academicYears: [{ id: "ay_active" }] });
    expect(await activeYearId(db)).toBe("ay_active");
  });

  it("falls back to the demo year only on an unseeded database", async () => {
    const db = unseeded();
    expect(await activeYearId(db)).toBe(activeYear.id);
  });

  it("refuses to invent a year on a seeded database", async () => {
    const db = seeded({});
    await expect(activeYearId(db)).rejects.toThrow("Tahun ajaran aktif belum ditetapkan");
  });
});

describe("canReadStudent", () => {
  it("lets staff read anyone", async () => {
    const db = seeded({});
    expect(await canReadStudent(db, { sub: "u1", username: "a", role: "admin" }, "s1")).toBe(true);
    expect(await canReadStudent(db, { sub: "u2", username: "b", role: "teacher" }, "s1")).toBe(true);
  });

  it("lets a student read only their own record", async () => {
    const db = seeded({});
    expect(await canReadStudent(db, { sub: "s1", username: "s", role: "student" }, "s1")).toBe(true);
    expect(await canReadStudent(db, { sub: "s1", username: "s", role: "student" }, "s2")).toBe(false);
  });

  it("honours a seeded guardian link and rejects the rest", async () => {
    const db = seeded({ guardianLinks: [{ studentId: "s1" }] });
    expect(await canReadStudent(db, guardian("usr_guardian_1"), "s1")).toBe(true);
    expect(await canReadStudent(db, guardian("usr_guardian_1"), "s2")).toBe(false);
  });

  it("rejects a guardian without a link once the database is seeded", async () => {
    const db = seeded({});
    expect(await canReadStudent(db, guardian("usr_guardian_1"), link.studentId)).toBe(false);
  });

  it("resolves demo links by sub and by username on an unseeded database", async () => {
    const db = unseeded();
    const bootstrap = guardianRow.username;

    expect(await canReadStudent(db, guardian(bootstrap), link.studentId)).toBe(true);
    expect(
      await canReadStudent(db, guardian(`usr_demo_${bootstrap}`), link.studentId)
    ).toBe(true);
  });
});

describe("visibleStudentIds", () => {
  it("returns null for staff, a single id for a student, and the links for a guardian", async () => {
    const db = seeded({ guardianLinks: [{ studentId: "s1" }, { studentId: "s2" }] });

    expect(await visibleStudentIds(db, { sub: "u", username: "a", role: "admin" })).toBeNull();
    expect(await visibleStudentIds(db, { sub: "s1", username: "s", role: "student" })).toEqual([
      "s1",
    ]);
    expect(await visibleStudentIds(db, guardian("usr_guardian_1"))).toEqual(["s1", "s2"]);
  });

  it("returns an empty list for a guardian without links on a seeded database", async () => {
    const db = seeded({});
    expect(await visibleStudentIds(db, guardian("usr_guardian_1"))).toEqual([]);
  });

  it("returns the demo links on an unseeded database", async () => {
    const db = unseeded();
    const expected = demoGuardianStudents
      .filter((entry) => entry.guardianId === link.guardianId)
      .map((entry) => entry.studentId);

    expect(await visibleStudentIds(db, guardian(guardianRow.username))).toEqual(expected);
  });
});
