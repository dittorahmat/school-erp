import {
  classrooms,
  studentEnrollments,
  users,
  eq,
  and,
} from "@school-erp/db";

export interface EnrollmentDatabaseAdapter {
  select(fields?: any): any;
  insert(table: any): { values(val: any): Promise<any> };
  update(table: any): { set(val: any): { where(clause: any): Promise<any> } };
  delete(table: any): { where(clause: any): Promise<any> };
}

export interface EnrollmentResult {
  id: string;
  studentId: string;
  classroomId: string;
  academicYearId: string;
  enrolledAt: Date;
}

export interface HomeroomResult {
  id: string;
  homeroomTeacherId: string | null;
}

export class ClassroomEnrollmentError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "ClassroomEnrollmentError";
  }
}

/**
 * Deep domain module: ClassroomEnrollment
 * Encapsulates the domain rules, invariants, and state management for
 * classroom student enrollments and homeroom teacher assignments.
 */
export class ClassroomEnrollment {
  constructor(private db: EnrollmentDatabaseAdapter) {}

  /**
   * Assigns or clears a homeroom teacher for a given classroom.
   */
  async assignHomeroom(classroomId: string, homeroomTeacherId: string | null): Promise<HomeroomResult> {
    const existingClass = await this.db
      .select({ id: classrooms.id })
      .from(classrooms)
      .where(eq(classrooms.id, classroomId))
      .limit(1);

    if (!existingClass || existingClass.length === 0) {
      throw new ClassroomEnrollmentError("Rombel tidak ditemukan", 404);
    }

    if (homeroomTeacherId) {
      const teacher = await this.db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.id, homeroomTeacherId))
        .limit(1);

      if (!teacher || teacher.length === 0) {
        throw new ClassroomEnrollmentError("Guru tidak ditemukan", 404);
      }
      if (teacher[0].role !== "teacher" && teacher[0].role !== "admin") {
        throw new ClassroomEnrollmentError("Pengguna yang dipilih bukan guru atau admin", 400);
      }
    }

    await this.db
      .update(classrooms)
      .set({ homeroomTeacherId })
      .where(eq(classrooms.id, classroomId));

    return {
      id: classroomId,
      homeroomTeacherId,
    };
  }

  /**
   * Enrolls a student into a classroom under its associated academic year.
   */
  async enrollStudent(classroomId: string, studentId: string): Promise<EnrollmentResult> {
    if (!studentId) {
      throw new ClassroomEnrollmentError("Student ID wajib diisi", 400);
    }

    const existingClass = await this.db
      .select({ id: classrooms.id, academicYearId: classrooms.academicYearId })
      .from(classrooms)
      .where(eq(classrooms.id, classroomId))
      .limit(1);

    if (!existingClass || existingClass.length === 0) {
      throw new ClassroomEnrollmentError("Rombel tidak ditemukan", 404);
    }

    const student = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student || student.length === 0) {
      throw new ClassroomEnrollmentError("Siswa tidak ditemukan", 404);
    }

    if (student[0].role !== "student") {
      throw new ClassroomEnrollmentError("Pengguna bukan siswa", 400);
    }

    const alreadyEnrolled = await this.db
      .select({ id: studentEnrollments.id })
      .from(studentEnrollments)
      .where(
        and(
          eq(studentEnrollments.classroomId, classroomId),
          eq(studentEnrollments.studentId, studentId)
        )
      )
      .limit(1);

    if (alreadyEnrolled && alreadyEnrolled.length > 0) {
      throw new ClassroomEnrollmentError("Siswa sudah terdaftar di rombel ini", 400);
    }

    const enrollmentId = `enr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();
    const academicYearId = existingClass[0].academicYearId;

    await this.db.insert(studentEnrollments).values({
      id: enrollmentId,
      studentId,
      classroomId,
      academicYearId,
      enrolledAt: now,
    });

    return {
      id: enrollmentId,
      studentId,
      classroomId,
      academicYearId,
      enrolledAt: now,
    };
  }

  /**
   * Unenrolls a student from a classroom.
   */
  async unenrollStudent(classroomId: string, studentId: string): Promise<{ classroomId: string; studentId: string }> {
    const existing = await this.db
      .select({ id: studentEnrollments.id })
      .from(studentEnrollments)
      .where(
        and(
          eq(studentEnrollments.classroomId, classroomId),
          eq(studentEnrollments.studentId, studentId)
        )
      )
      .limit(1);

    if (!existing || existing.length === 0) {
      throw new ClassroomEnrollmentError("Data pendaftaran siswa di rombel tidak ditemukan", 404);
    }

    await this.db
      .delete(studentEnrollments)
      .where(
        and(
          eq(studentEnrollments.classroomId, classroomId),
          eq(studentEnrollments.studentId, studentId)
        )
      );

    return { classroomId, studentId };
  }
}
