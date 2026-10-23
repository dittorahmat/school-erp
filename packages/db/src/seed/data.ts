import { users, academicYears, classrooms, subjects, feeComponents } from "../schema";

export const demoSeedUsers = [
  {
    id: "usr_admin_1",
    username: "admin",
    // Password raw: admin123
    fullName: "Hj. Siti Aminah, S.Pd., M.M.",
    role: "admin" as const,
    email: "admin@sekolah.sch.id",
    phone: "081234567890",
  },
  {
    id: "usr_teacher_1",
    username: "guru_budi",
    // Password raw: guru123
    fullName: "Budi Purnomo, S.Pd.",
    role: "teacher" as const,
    email: "budi.purnomo@sekolah.sch.id",
    phone: "081234567891",
  },
  {
    id: "usr_student_1",
    username: "siswa_ahmad",
    // Password raw: siswa123
    fullName: "Ahmad Dahlan",
    role: "student" as const,
    email: "ahmad.dahlan@student.sekolah.sch.id",
    phone: "081234567892",
  },
  {
    id: "usr_guardian_1",
    username: "wali_subagyo",
    // Password raw: wali123
    fullName: "Ir. Bambang Subagyo",
    role: "guardian" as const,
    email: "bambang.subagyo@gmail.com",
    phone: "081234567893",
  },
];
