import { describe, expect, it } from "vitest";
import { ClassroomEnrollment, ClassroomEnrollmentError } from "./enrollment";

class InMemoryEnrollmentAdapter {
  classrooms: any[] = [];
  users: any[] = [];
  studentEnrollments: any[] = [];

  select(fields?: any) {
    const self = this;
    return {
      from(table: any) {
        return {
          where(clause: any) {
            return {
              async limit(n: number) {
                const tableName = table?.[Symbol.for("drizzle:Name")] || "";
                if (tableName.includes("classrooms")) return self.classrooms.slice(0, n);
                if (tableName.includes("users")) return self.users.slice(0, n);
                if (tableName.includes("student_enrollments")) return self.studentEnrollments.slice(0, n);
                return [];
              },
            };
          },
        };
      },
    };
  }

  insert(table: any) {
    const self = this;
    return {
      async values(val: any) {
        self.studentEnrollments.push(val);
        return val;
      },
    };
  }

  update(table: any) {
    const self = this;
    return {
      set(val: any) {
        return {
          async where(clause: any) {
            for (const c of self.classrooms) {
              Object.assign(c, val);
            }
            return self.classrooms;
          },
        };
      },
    };
  }

  delete(table: any) {
    const self = this;
    return {
      async where(clause: any) {
        self.studentEnrollments = [];
        return [];
      },
    };
  }
}

describe("ClassroomEnrollment Domain Module (Unit Tests)", () => {
  it("assigns homeroom teacher to an existing classroom", async () => {
    const adapter = new InMemoryEnrollmentAdapter();
    adapter.classrooms = [{ id: "cls_1", homeroomTeacherId: null }];
    adapter.users = [{ id: "usr_teacher_1", role: "teacher" }];

    const enrollment = new ClassroomEnrollment(adapter as any);
    const result = await enrollment.assignHomeroom("cls_1", "usr_teacher_1");

    expect(result.homeroomTeacherId).toBe("usr_teacher_1");
    expect(adapter.classrooms[0].homeroomTeacherId).toBe("usr_teacher_1");
  });

  it("throws 404 when assigning homeroom to non-existent classroom", async () => {
    const adapter = new InMemoryEnrollmentAdapter();
    adapter.classrooms = [];

    const enrollment = new ClassroomEnrollment(adapter as any);
    await expect(enrollment.assignHomeroom("cls_none", "usr_teacher_1")).rejects.toThrow(
      ClassroomEnrollmentError
    );
  });

  it("enrolls a student successfully", async () => {
    const adapter = new InMemoryEnrollmentAdapter();
    adapter.classrooms = [{ id: "cls_1", academicYearId: "ay_2026" }];
    adapter.users = [{ id: "usr_student_1", role: "student" }];
    adapter.studentEnrollments = [];

    const enrollment = new ClassroomEnrollment(adapter as any);
    const result = await enrollment.enrollStudent("cls_1", "usr_student_1");

    expect(result.studentId).toBe("usr_student_1");
    expect(result.classroomId).toBe("cls_1");
    expect(result.academicYearId).toBe("ay_2026");
    expect(adapter.studentEnrollments.length).toBe(1);
  });

  it("prevents double enrollment in the same classroom", async () => {
    const adapter = new InMemoryEnrollmentAdapter();
    adapter.classrooms = [{ id: "cls_1", academicYearId: "ay_2026" }];
    adapter.users = [{ id: "usr_student_1", role: "student" }];
    adapter.studentEnrollments = [{ id: "enr_1", classroomId: "cls_1", studentId: "usr_student_1" }];

    const enrollment = new ClassroomEnrollment(adapter as any);
    await expect(enrollment.enrollStudent("cls_1", "usr_student_1")).rejects.toThrow(
      "Siswa sudah terdaftar di rombel ini"
    );
  });
});
