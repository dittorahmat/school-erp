import type {
  academicYears,
  assessmentComponents,
  attendanceRecords,
  attendanceSessions,
  classrooms,
  feeComponents,
  guardianStudents,
  inventoryAssetUnits,
  inventoryCategories,
  inventoryItems,
  inventoryLoans,
  inventoryLocations,
  inventoryRequisitions,
  inventoryStockMovements,
  invoices,
  studentEnrollments,
  studentGrades,
  subjects,
  users,
} from "../schema";

type UserRow = typeof users.$inferInsert;
type AcademicYearRow = typeof academicYears.$inferInsert;
type ClassroomRow = typeof classrooms.$inferInsert;
type SubjectRow = typeof subjects.$inferInsert;
type EnrollmentRow = typeof studentEnrollments.$inferInsert;
type AttendanceSessionRow = typeof attendanceSessions.$inferInsert;
type AttendanceRecordRow = typeof attendanceRecords.$inferInsert;
type FeeComponentRow = typeof feeComponents.$inferInsert;
type InvoiceRow = typeof invoices.$inferInsert;
type AssessmentComponentRow = typeof assessmentComponents.$inferInsert;
type StudentGradeRow = typeof studentGrades.$inferInsert;
type GuardianStudentRow = typeof guardianStudents.$inferInsert;
type InventoryCategoryRow = typeof inventoryCategories.$inferInsert;
type InventoryLocationRow = typeof inventoryLocations.$inferInsert;
type InventoryItemRow = typeof inventoryItems.$inferInsert;
type InventoryAssetUnitRow = typeof inventoryAssetUnits.$inferInsert;
type InventoryLoanRow = typeof inventoryLoans.$inferInsert;
type InventoryStockMovementRow = typeof inventoryStockMovements.$inferInsert;
type InventoryRequisitionRow = typeof inventoryRequisitions.$inferInsert;

export type DemoUser = Omit<UserRow, "passwordHash"> & { password: string };

const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const createdAt = at("2026-07-01");

// ---------------------------------------------------------------------------
// Academic calendar
// ---------------------------------------------------------------------------

export const demoAcademicYears: AcademicYearRow[] = [
  {
    id: "ay_2026_2027",
    name: "2026/2027",
    semester: "odd",
    isActive: true,
    startDate: "2026-07-13",
    endDate: "2026-12-18",
    createdAt,
  },
  {
    id: "ay_2025_2026_even",
    name: "2025/2026",
    semester: "even",
    isActive: false,
    startDate: "2026-01-05",
    endDate: "2026-06-26",
    createdAt,
  },
];

export const demoUsers: DemoUser[] = [
  {
    id: "usr_admin_1",
    username: "admin",
    fullName: "Hj. Siti Aminah, S.Pd., M.M.",
    role: "admin",
    email: "admin@sekolah.sch.id",
    phone: "081234567890",
    password: "admin123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_teacher_1",
    username: "guru_budi",
    fullName: "Budi Purnomo, S.Pd.",
    role: "teacher",
    email: "budi.purnomo@sekolah.sch.id",
    phone: "081234567891",
    password: "guru123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_teacher_2",
    username: "guru_siti",
    fullName: "Siti Rahmawati, M.Pd.",
    role: "teacher",
    email: "siti.rahmawati@sekolah.sch.id",
    phone: "081234567895",
    password: "guru123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_1",
    username: "siswa_ahmad",
    fullName: "Ahmad Dahlan",
    role: "student",
    email: "ahmad.dahlan@student.sekolah.sch.id",
    phone: "081234567892",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_2",
    username: "siswa_dewi",
    fullName: "Dewi Sartika",
    role: "student",
    email: "dewi.sartika@student.sekolah.sch.id",
    phone: "081234567896",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_3",
    username: "siswa_budi",
    fullName: "Budi Santoso",
    role: "student",
    email: "budi.santoso@student.sekolah.sch.id",
    phone: "081234567897",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_4",
    username: "siswa_citra",
    fullName: "Citra Lestari",
    role: "student",
    email: "citra.lestari@student.sekolah.sch.id",
    phone: "081234567898",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_5",
    username: "siswa_eka",
    fullName: "Eko Prasetyo",
    role: "student",
    email: "eko.prasetyo@student.sekolah.sch.id",
    phone: "081234567899",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_6",
    username: "siswa_fajar",
    fullName: "Fajar Nugroho",
    role: "student",
    email: "fajar.nugroho@student.sekolah.sch.id",
    phone: "081234567801",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_7",
    username: "siswa_rina",
    fullName: "Rina Marlina",
    role: "student",
    email: "rina.marlina@student.sekolah.sch.id",
    phone: "081234567802",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_8",
    username: "siswa_andi",
    fullName: "Andi Wijaya",
    role: "student",
    email: "andi.wijaya@student.sekolah.sch.id",
    phone: "081234567803",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_9",
    username: "siswa_sari",
    fullName: "Sari Melati",
    role: "student",
    email: "sari.melati@student.sekolah.sch.id",
    phone: "081234567804",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_10",
    username: "siswa_dimas",
    fullName: "Dimas Prakoso",
    role: "student",
    email: "dimas.prakoso@student.sekolah.sch.id",
    phone: "081234567805",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_11",
    username: "siswa_nadia",
    fullName: "Nadia Putri",
    role: "student",
    email: "nadia.putri@student.sekolah.sch.id",
    phone: "081234567806",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_student_12",
    username: "siswa_rizky",
    fullName: "Rizky Ramadhan",
    role: "student",
    email: "rizky.ramadhan@student.sekolah.sch.id",
    phone: "081234567807",
    password: "siswa123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_guardian_1",
    username: "wali_subagyo",
    fullName: "Ir. Bambang Subagyo",
    role: "guardian",
    email: "bambang.subagyo@gmail.com",
    phone: "081234567893",
    password: "wali123",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "usr_guardian_2",
    username: "wali_hartono",
    fullName: "Drs. H. Hartono",
    role: "guardian",
    email: "hartono.family@gmail.com",
    phone: "081234567808",
    password: "wali123",
    createdAt,
    updatedAt: createdAt,
  },
];

export const demoClassrooms: ClassroomRow[] = [
  {
    id: "cls_10_mipa_1",
    academicYearId: "ay_2026_2027",
    name: "X-MIPA-1",
    gradeLevel: 10,
    homeroomTeacherId: "usr_teacher_1",
    createdAt,
  },
  {
    id: "cls_10_mipa_2",
    academicYearId: "ay_2026_2027",
    name: "X-MIPA-2",
    gradeLevel: 10,
    homeroomTeacherId: "usr_teacher_2",
    createdAt,
  },
  {
    id: "cls_11_mipa_1",
    academicYearId: "ay_2026_2027",
    name: "XI-MIPA-1",
    gradeLevel: 11,
    homeroomTeacherId: null,
    createdAt,
  },
  {
    id: "cls_11_ips_1",
    academicYearId: "ay_2026_2027",
    name: "XI-IPS-1",
    gradeLevel: 11,
    homeroomTeacherId: null,
    createdAt,
  },
  {
    id: "cls_12_mipa_1",
    academicYearId: "ay_2026_2027",
    name: "XII-MIPA-1",
    gradeLevel: 12,
    homeroomTeacherId: null,
    createdAt,
  },
  {
    id: "cls_7_b",
    academicYearId: "ay_2026_2027",
    name: "VII-B",
    gradeLevel: 7,
    homeroomTeacherId: null,
    createdAt,
  },
];

export const demoSubjects: SubjectRow[] = [
  { id: "sub_mat", code: "MAT-X", name: "Matematika", gradeLevel: 10, createdAt },
  { id: "sub_bin", code: "BIN-X", name: "Bahasa Indonesia", gradeLevel: 10, createdAt },
  { id: "sub_fis", code: "FIS-X", name: "Fisika", gradeLevel: 10, createdAt },
  { id: "sub_eng", code: "ENG-X", name: "Bahasa Inggris", gradeLevel: 10, createdAt },
  { id: "sub_inf", code: "INF-X", name: "Informatika", gradeLevel: 10, createdAt },
  { id: "sub_sej", code: "SEJ-X", name: "Sejarah", gradeLevel: 10, createdAt },
];

const enrollmentPlan: Array<[string, string]> = [
  ["usr_student_1", "cls_10_mipa_1"],
  ["usr_student_3", "cls_10_mipa_1"],
  ["usr_student_4", "cls_10_mipa_1"],
  ["usr_student_5", "cls_10_mipa_1"],
  ["usr_student_6", "cls_10_mipa_1"],
  ["usr_student_2", "cls_10_mipa_2"],
  ["usr_student_7", "cls_10_mipa_2"],
  ["usr_student_8", "cls_10_mipa_2"],
  ["usr_student_9", "cls_11_mipa_1"],
  ["usr_student_10", "cls_11_ips_1"],
  ["usr_student_11", "cls_12_mipa_1"],
  ["usr_student_12", "cls_7_b"],
];

export const demoEnrollments: EnrollmentRow[] = enrollmentPlan.map(
  ([studentId, classroomId], index) => ({
    id: `enr_${String(index + 1).padStart(3, "0")}`,
    studentId,
    classroomId,
    academicYearId: "ay_2026_2027",
    enrolledAt: at("2026-07-13"),
  })
);

// ---------------------------------------------------------------------------
// Attendance: 45 effective school days, 24 Aug - 23 Oct 2026
// ---------------------------------------------------------------------------

export const demoSchoolDays: string[] = (() => {
  const days: string[] = [];
  const cursor = at("2026-08-24");
  const end = at("2026-10-23");
  while (cursor <= end) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
})();

const xMipa1Students = [
  "usr_student_1",
  "usr_student_3",
  "usr_student_4",
  "usr_student_5",
  "usr_student_6",
];

const xMipa2Students = ["usr_student_2", "usr_student_7", "usr_student_8"];

const attendanceClasses = [
  { classroomId: "cls_10_mipa_1", teacherId: "usr_teacher_1", students: xMipa1Students },
  { classroomId: "cls_10_mipa_2", teacherId: "usr_teacher_2", students: xMipa2Students },
];

const attendancePlan: Record<
  string,
  { sick: number[]; permit: number[]; absent: number[] }
> = {
  usr_student_1: { sick: [10, 25], permit: [30], absent: [] },
  usr_student_3: { sick: [5, 20, 35], permit: [12], absent: [40] },
  usr_student_4: { sick: [15], permit: [], absent: [] },
  usr_student_5: { sick: [7], permit: [18, 33], absent: [28, 42] },
  usr_student_6: { sick: [22], permit: [38], absent: [] },
  usr_student_2: { sick: [12], permit: [], absent: [] },
  usr_student_7: { sick: [5], permit: [20], absent: [] },
  usr_student_8: { sick: [8, 30], permit: [15], absent: [] },
};

export const demoAttendanceSessions: AttendanceSessionRow[] = attendanceClasses.flatMap(
  (classroom) =>
    demoSchoolDays.map((date) => ({
      id: `att_sess_${classroom.classroomId}_${date}`,
      classroomId: classroom.classroomId,
      subjectId: null,
      recordedById: classroom.teacherId,
      date,
      createdAt: at(date),
    }))
);

export const demoAttendanceRecords: AttendanceRecordRow[] = attendanceClasses.flatMap(
  (classroom) =>
    demoSchoolDays.flatMap((date, dayIndex) =>
      classroom.students.map((studentId) => {
        const plan = attendancePlan[studentId] ?? { sick: [], permit: [], absent: [] };
        const status = plan.sick.includes(dayIndex)
          ? ("sick" as const)
          : plan.permit.includes(dayIndex)
            ? ("permit" as const)
            : plan.absent.includes(dayIndex)
              ? ("absent" as const)
              : ("present" as const);
        const remarks =
          status === "sick"
            ? "Surat keterangan orang tua"
            : status === "permit"
              ? "Kegiatan lomba di luar sekolah"
              : status === "absent"
                ? "Belum ada konfirmasi"
                : null;
        const sessionId = `att_sess_${classroom.classroomId}_${date}`;
        return {
          id: `att_rec_${sessionId}_${studentId}`,
          sessionId,
          studentId,
          status,
          remarks,
        };
      })
    )
);

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export const demoFeeComponents: FeeComponentRow[] = [
  {
    id: "fee_spp",
    name: "SPP Bulanan",
    amount: 350000,
    isRecurring: true,
    createdAt,
  },
  {
    id: "fee_kegiatan",
    name: "Uang Kegiatan Semester",
    amount: 150000,
    isRecurring: false,
    createdAt,
  },
  {
    id: "fee_ujian",
    name: "Ujian Semester",
    amount: 200000,
    isRecurring: false,
    createdAt,
  },
];

const demoStudentIds = enrollmentPlan.map(([studentId]) => studentId);

const octoberStatuses: Record<string, "paid" | "pending" | "unpaid"> = {
  usr_student_1: "unpaid",
  usr_student_2: "paid",
  usr_student_3: "pending",
  usr_student_4: "paid",
  usr_student_5: "unpaid",
  usr_student_6: "paid",
  usr_student_7: "pending",
  usr_student_8: "unpaid",
  usr_student_9: "paid",
  usr_student_10: "unpaid",
  usr_student_11: "paid",
  usr_student_12: "unpaid",
};

const septemberUnpaid = new Set(["usr_student_5", "usr_student_12"]);

export const demoInvoices: InvoiceRow[] = [
  ...demoStudentIds.map((studentId, index) => {
    const id = `INV-2026-09-${String(index + 1).padStart(3, "0")}`;
    const status = septemberUnpaid.has(studentId) ? ("unpaid" as const) : ("paid" as const);
    return {
      id,
      studentId,
      academicYearId: "ay_2026_2027",
      feeComponentId: "fee_spp",
      month: "2026-09",
      amount: 350000,
      status,
      paymentProofUrl: status === "paid" ? `proofs/${id}.jpg` : null,
      paidAt: status === "paid" ? at("2026-09-10") : null,
      createdAt: at("2026-09-01"),
    };
  }),
  ...demoStudentIds.map((studentId, index) => {
    const id = `INV-2026-10-${String(index + 1).padStart(3, "0")}`;
    const status = octoberStatuses[studentId] ?? "unpaid";
    return {
      id,
      studentId,
      academicYearId: "ay_2026_2027",
      feeComponentId: "fee_spp",
      month: "2026-10",
      amount: 350000,
      status,
      paymentProofUrl: status === "unpaid" ? null : `proofs/${id}.jpg`,
      paidAt: status === "paid" ? at("2026-10-12") : null,
      createdAt: at("2026-10-01"),
    };
  }),
  {
    id: "INV-KEG-2026-001",
    studentId: "usr_student_1",
    academicYearId: "ay_2026_2027",
    feeComponentId: "fee_kegiatan",
    month: "2026-09",
    amount: 150000,
    status: "paid",
    paymentProofUrl: "proofs/INV-KEG-2026-001.jpg",
    paidAt: at("2026-09-12"),
    createdAt: at("2026-09-01"),
  },
];

// ---------------------------------------------------------------------------
// Gradebook
// ---------------------------------------------------------------------------

const gradedSubjects = [
  { id: "sub_mat", code: "mat" },
  { id: "sub_bin", code: "bin" },
  { id: "sub_fis", code: "fis" },
  { id: "sub_eng", code: "eng" },
];

const componentTemplate = [
  { key: "tugas", name: "Tugas Harian", weight: 30 },
  { key: "uts", name: "Sumatif Tengah (UTS)", weight: 30 },
  { key: "sas", name: "Sumatif Akhir (SAS)", weight: 40 },
];

export const demoAssessmentComponents: AssessmentComponentRow[] =
  gradedSubjects.flatMap((subject) =>
    componentTemplate.map((component) => ({
      id: `comp_${subject.code}_${component.key}`,
      subjectId: subject.id,
      academicYearId: "ay_2026_2027",
      name: component.name,
      weightPercentage: component.weight,
      createdAt,
    }))
  );

const scorePlan: Record<string, Record<string, [number, number, number]>> = {
  usr_student_1: {
    sub_mat: [88, 85, 90],
    sub_bin: [85, 84, 86],
    sub_fis: [80, 78, 86],
    sub_eng: [90, 88, 91],
  },
  usr_student_3: {
    sub_mat: [78, 76, 80],
    sub_bin: [80, 78, 82],
    sub_fis: [75, 72, 78],
    sub_eng: [76, 74, 80],
  },
  usr_student_4: {
    sub_mat: [92, 90, 94],
    sub_bin: [90, 88, 92],
    sub_fis: [88, 86, 90],
    sub_eng: [94, 92, 95],
  },
  usr_student_5: {
    sub_mat: [70, 68, 72],
    sub_bin: [74, 72, 76],
    sub_fis: [68, 66, 70],
    sub_eng: [72, 70, 74],
  },
  usr_student_6: {
    sub_mat: [84, 82, 86],
    sub_bin: [82, 80, 84],
    sub_fis: [79, 77, 81],
    sub_eng: [86, 84, 88],
  },
  usr_student_2: {
    sub_mat: [90, 88, 92],
    sub_bin: [92, 90, 93],
    sub_fis: [86, 84, 88],
    sub_eng: [94, 92, 95],
  },
  usr_student_7: {
    sub_mat: [80, 78, 82],
    sub_bin: [82, 80, 84],
    sub_fis: [78, 76, 80],
    sub_eng: [84, 82, 86],
  },
  usr_student_8: {
    sub_mat: [75, 73, 77],
    sub_bin: [78, 76, 80],
    sub_fis: [72, 70, 74],
    sub_eng: [80, 78, 82],
  },
};

export const demoStudentGrades: StudentGradeRow[] = Object.entries(scorePlan).flatMap(
  ([studentId, subjects]) =>
    Object.entries(subjects).flatMap(([subjectId, scores]) => {
      const code = gradedSubjects.find((subject) => subject.id === subjectId)?.code;
      return componentTemplate.map((component, index) => ({
        id: `grade_${studentId}_${subjectId}_${component.key}`,
        studentId,
        componentId: `comp_${code}_${component.key}`,
        score: scores[index],
        notes: null,
        createdAt,
      }));
    })
);

export const demoGuardianStudents: GuardianStudentRow[] = [
  {
    id: "gs_subagyo_ahmad",
    guardianId: "usr_guardian_1",
    studentId: "usr_student_1",
    relationship: "Ayah",
    createdAt,
  },
  {
    id: "gs_subagyo_dewi",
    guardianId: "usr_guardian_1",
    studentId: "usr_student_2",
    relationship: "Ayah",
    createdAt,
  },
  {
    id: "gs_hartono_budi",
    guardianId: "usr_guardian_2",
    studentId: "usr_student_3",
    relationship: "Wali",
    createdAt,
  },
];

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export const demoInventoryCategories: InventoryCategoryRow[] = [
  {
    id: "cat_elektronik",
    name: "Elektronik & Multimedia",
    description: "Perangkat proyektor, audio, dan komputer sekolah",
    createdAt,
  },
  {
    id: "cat_atk",
    name: "ATK & Kertas",
    description: "Alat tulis kantor dan perlengkapan kelas harian",
    createdAt,
  },
  {
    id: "cat_lab",
    name: "Peralatan Laboratorium",
    description: "Alat praktikum IPA dan reagen/bahan lab",
    createdAt,
  },
  {
    id: "cat_olahraga",
    name: "Sarana Olahraga",
    description: "Bola, matras, dan perlengkapan senam",
    createdAt,
  },
];

export const demoInventoryLocations: InventoryLocationRow[] = [
  {
    id: "loc_gudang",
    code: "LOC-GUDANG",
    name: "Gudang Sarpras Utama",
    description: "Pusat penyimpanan aset dan logistik sekolah",
    createdAt,
  },
  {
    id: "loc_lab_1",
    code: "LOC-LAB-1",
    name: "Lab Komputer 1",
    description: "Gedung B Lantai 2",
    createdAt,
  },
  {
    id: "loc_guru",
    code: "LOC-GURU",
    name: "Ruang Guru & TU",
    description: "Gedung Utama Lantai 1",
    createdAt,
  },
  {
    id: "loc_aula",
    code: "LOC-AULA",
    name: "Aula Serbaguna",
    description: "Gedung C Lantai Dasar",
    createdAt,
  },
];

export const demoInventoryItems: InventoryItemRow[] = [
  {
    id: "itm_proyektor",
    categoryId: "cat_elektronik",
    code: "BRG-ELK-001",
    name: "Proyektor Epson EB-X500",
    type: "fixed_asset",
    unit: "unit",
    minStockAlert: 0,
    description: "3600 Lumens, HDMI & VGA Input",
    createdAt,
  },
  {
    id: "itm_laptop",
    categoryId: "cat_elektronik",
    code: "BRG-ELK-002",
    name: "Laptop Lenovo ThinkBook 14",
    type: "fixed_asset",
    unit: "unit",
    minStockAlert: 0,
    description: "Core i5, 16GB RAM, SSD 512GB untuk lab & presentasi",
    createdAt,
  },
  {
    id: "itm_spidol",
    categoryId: "cat_atk",
    code: "BRG-ATK-001",
    name: "Spidol Boardmarker Hitam Snowman",
    type: "consumable",
    unit: "kotak",
    minStockAlert: 5,
    description: "Isi 12 pcs per kotak",
    createdAt,
  },
  {
    id: "itm_kertas",
    categoryId: "cat_atk",
    code: "BRG-ATK-002",
    name: "Kertas HVS A4 80gr PaperOne",
    type: "consumable",
    unit: "rim",
    minStockAlert: 10,
    description: "500 lembar per rim",
    createdAt,
  },
  {
    id: "itm_penghapus",
    categoryId: "cat_atk",
    code: "BRG-ATK-003",
    name: "Penghapus Papan Tulis",
    type: "consumable",
    unit: "buah",
    minStockAlert: 5,
    description: "Penghapus whiteboard magnetik",
    createdAt,
  },
  {
    id: "itm_mikroskop",
    categoryId: "cat_lab",
    code: "BRG-LAB-001",
    name: "Mikroskop Binokuler",
    type: "fixed_asset",
    unit: "unit",
    minStockAlert: 0,
    description: "Perbesaran 40x-1000x untuk praktikum biologi",
    createdAt,
  },
  {
    id: "itm_bola",
    categoryId: "cat_olahraga",
    code: "BRG-OLH-001",
    name: "Bola Voli Mikasa",
    type: "fixed_asset",
    unit: "buah",
    minStockAlert: 0,
    description: "Bola voli standar pertandingan",
    createdAt,
  },
];

export const demoInventoryAssetUnits: InventoryAssetUnitRow[] = [
  {
    id: "ast_proyektor_1",
    itemId: "itm_proyektor",
    assetTag: "AST/2026/1001",
    serialNumber: "SN-EPSON-89211",
    locationId: "loc_lab_1",
    status: "available",
    condition: "good",
    notes: "Kabel HDMI & tas lengkap",
    createdAt,
  },
  {
    id: "ast_proyektor_2",
    itemId: "itm_proyektor",
    assetTag: "AST/2026/1002",
    serialNumber: "SN-EPSON-89212",
    locationId: "loc_gudang",
    status: "loaned",
    condition: "good",
    notes: "Dipinjam untuk presentasi ujian praktik",
    createdAt,
  },
  {
    id: "ast_proyektor_3",
    itemId: "itm_proyektor",
    assetTag: "AST/2026/1003",
    serialNumber: "SN-EPSON-89213",
    locationId: "loc_gudang",
    status: "available",
    condition: "light_damage",
    notes: "Goresan ringan pada cover, fungsi normal",
    createdAt,
  },
  {
    id: "ast_laptop_1",
    itemId: "itm_laptop",
    assetTag: "AST/2026/2001",
    serialNumber: "SN-LENOVO-4100",
    locationId: "loc_guru",
    status: "available",
    condition: "light_damage",
    notes: "Goresan ringan di cover atas, fungsi 100% normal",
    createdAt,
  },
  {
    id: "ast_laptop_2",
    itemId: "itm_laptop",
    assetTag: "AST/2026/2002",
    serialNumber: "SN-LENOVO-4101",
    locationId: "loc_guru",
    status: "available",
    condition: "good",
    notes: "Menunggu persetujuan peminjaman",
    createdAt,
  },
  {
    id: "ast_laptop_3",
    itemId: "itm_laptop",
    assetTag: "AST/2026/2003",
    serialNumber: "SN-LENOVO-4102",
    locationId: "loc_lab_1",
    status: "maintenance",
    condition: "light_damage",
    notes: "Servis keyboard dan baterai",
    createdAt,
  },
  {
    id: "ast_laptop_4",
    itemId: "itm_laptop",
    assetTag: "AST/2026/2004",
    serialNumber: "SN-LENOVO-4103",
    locationId: "loc_lab_1",
    status: "loaned",
    condition: "good",
    notes: "Terlambat kembali, perlu tindak lanjut",
    createdAt,
  },
  {
    id: "ast_mikroskop_1",
    itemId: "itm_mikroskop",
    assetTag: "AST/2026/3001",
    serialNumber: "SN-MIKRO-7711",
    locationId: "loc_lab_1",
    status: "available",
    condition: "good",
    notes: "Lensa bersih, kalibrasi terakhir Juli 2026",
    createdAt,
  },
  {
    id: "ast_mikroskop_2",
    itemId: "itm_mikroskop",
    assetTag: "AST/2026/3002",
    serialNumber: "SN-MIKRO-7712",
    locationId: "loc_lab_1",
    status: "available",
    condition: "good",
    notes: null,
    createdAt,
  },
  {
    id: "ast_bola_1",
    itemId: "itm_bola",
    assetTag: "AST/2026/4001",
    serialNumber: null,
    locationId: "loc_gudang",
    status: "available",
    condition: "good",
    notes: "Untuk ekstrakurikuler voli",
    createdAt,
  },
];

export const demoInventoryLoans: InventoryLoanRow[] = [
  {
    id: "loan_pending_1",
    unitId: "ast_laptop_2",
    borrowerId: "usr_teacher_2",
    approverId: null,
    loanDate: at("2026-10-22"),
    expectedReturnDate: at("2026-10-27"),
    actualReturnDate: null,
    purpose: "Menyusun bahan ajar Bahasa Indonesia",
    outCondition: "good",
    returnCondition: null,
    status: "pending",
    inspectionNotes: null,
    createdAt: at("2026-10-22"),
  },
  {
    id: "loan_active_1",
    unitId: "ast_proyektor_2",
    borrowerId: "usr_teacher_1",
    approverId: "usr_admin_1",
    loanDate: at("2026-10-21"),
    expectedReturnDate: at("2026-10-26"),
    actualReturnDate: null,
    purpose: "Presentasi ujian praktik Fisika di Lab",
    outCondition: "good",
    returnCondition: null,
    status: "borrowed",
    inspectionNotes: null,
    createdAt: at("2026-10-21"),
  },
  {
    id: "loan_overdue_1",
    unitId: "ast_laptop_4",
    borrowerId: "usr_teacher_1",
    approverId: "usr_admin_1",
    loanDate: at("2026-10-18"),
    expectedReturnDate: at("2026-10-22"),
    actualReturnDate: null,
    purpose: "Rapat kurikulum di luar ruang guru",
    outCondition: "good",
    returnCondition: null,
    status: "borrowed",
    inspectionNotes: null,
    createdAt: at("2026-10-18"),
  },
  {
    id: "loan_returned_1",
    unitId: "ast_proyektor_3",
    borrowerId: "usr_teacher_1",
    approverId: "usr_admin_1",
    loanDate: at("2026-10-10"),
    expectedReturnDate: at("2026-10-12"),
    actualReturnDate: at("2026-10-12"),
    purpose: "Sosialisasi program sekolah",
    outCondition: "good",
    returnCondition: "light_damage",
    status: "returned",
    inspectionNotes: "Ada goresan ringan pada cover, tetap berfungsi",
    createdAt: at("2026-10-10"),
  },
  {
    id: "loan_rejected_1",
    unitId: "ast_mikroskop_1",
    borrowerId: "usr_teacher_2",
    approverId: "usr_admin_1",
    loanDate: at("2026-10-15"),
    expectedReturnDate: at("2026-10-17"),
    actualReturnDate: null,
    purpose: "Praktikum luar kelas tanpa jadwal lab",
    outCondition: "good",
    returnCondition: null,
    status: "rejected",
    inspectionNotes: "Jadwal bentrok dengan praktikum kelas XII",
    createdAt: at("2026-10-15"),
  },
];

export const demoInventoryStockMovements: InventoryStockMovementRow[] = [
  {
    id: "mv_spidol_in",
    itemId: "itm_spidol",
    type: "in",
    quantity: 20,
    balanceAfter: 20,
    referenceUser: "usr_admin_1",
    notes: "Pengadaan logistik awal semester",
    createdAt: at("2026-07-15"),
  },
  {
    id: "mv_spidol_out",
    itemId: "itm_spidol",
    type: "out",
    quantity: 4,
    balanceAfter: 16,
    referenceUser: "usr_admin_1",
    notes: "Distribusi ke guru kelas X",
    createdAt: at("2026-08-01"),
  },
  {
    id: "mv_kertas_in",
    itemId: "itm_kertas",
    type: "in",
    quantity: 50,
    balanceAfter: 50,
    referenceUser: "usr_admin_1",
    notes: "Restock kertas cetak ujian",
    createdAt: at("2026-07-15"),
  },
  {
    id: "mv_kertas_out",
    itemId: "itm_kertas",
    type: "out",
    quantity: 1,
    balanceAfter: 49,
    referenceUser: "usr_admin_1",
    notes: "Permintaan disetujui: cetak modul Bahasa Indonesia",
    createdAt: at("2026-09-05"),
  },
  {
    id: "mv_penghapus_in",
    itemId: "itm_penghapus",
    type: "in",
    quantity: 10,
    balanceAfter: 10,
    referenceUser: "usr_admin_1",
    notes: "Pembelian perlengkapan kelas",
    createdAt: at("2026-07-15"),
  },
  {
    id: "mv_penghapus_out",
    itemId: "itm_penghapus",
    type: "out",
    quantity: 7,
    balanceAfter: 3,
    referenceUser: "usr_admin_1",
    notes: "Pemakaian ruang kelas dan ruang guru",
    createdAt: at("2026-08-20"),
  },
];

export const demoInventoryRequisitions: InventoryRequisitionRow[] = [
  {
    id: "req_pending_1",
    itemId: "itm_spidol",
    requesterId: "usr_teacher_1",
    quantity: 2,
    reason: "Kebutuhan menulis papan tulis kelas X-MIPA-1",
    status: "pending",
    approverId: null,
    createdAt: at("2026-10-23"),
  },
  {
    id: "req_approved_1",
    itemId: "itm_kertas",
    requesterId: "usr_teacher_2",
    quantity: 1,
    reason: "Cetak modul Bahasa Indonesia",
    status: "approved",
    approverId: "usr_admin_1",
    createdAt: at("2026-09-05"),
  },
  {
    id: "req_rejected_1",
    itemId: "itm_penghapus",
    requesterId: "usr_teacher_1",
    quantity: 5,
    reason: "Stok kelas menipis",
    status: "rejected",
    approverId: "usr_admin_1",
    createdAt: at("2026-10-20"),
  },
];

// ---------------------------------------------------------------------------
// Backward-compatible fallbacks consumed by existing API routes
// ---------------------------------------------------------------------------

const teacherName = (id: string | null | undefined) =>
  demoUsers.find((user) => user.id === id)?.fullName ?? "Belum ditentukan";

export const demoSeedUsers = demoUsers.map(({ password: _password, ...user }) => user);

export const demoSeedClassrooms = demoClassrooms.map((classroom) => ({
  id: classroom.id,
  name: classroom.name,
  gradeLevel: classroom.gradeLevel,
  academicYearId: classroom.academicYearId,
  studentCount: demoEnrollments.filter((item) => item.classroomId === classroom.id).length,
  homeroomTeacher: teacherName(classroom.homeroomTeacherId),
}));

export const demoSeedInvoices = demoInvoices.map((invoice) => {
  const student = demoUsers.find((user) => user.id === invoice.studentId);
  const enrollment = demoEnrollments.find((item) => item.studentId === invoice.studentId);
  const classroom = demoClassrooms.find((item) => item.id === enrollment?.classroomId);
  const component = demoFeeComponents.find((item) => item.id === invoice.feeComponentId);
  return {
    id: invoice.id,
    studentId: invoice.studentId,
    studentName: student?.fullName ?? "Siswa",
    classroom: classroom?.name ?? "-",
    componentName: component?.name ?? "Komponen Biaya",
    amount: invoice.amount,
    month: invoice.month ?? "",
    status: invoice.status,
    dueDate: `${invoice.month ?? ""}-15`,
    paymentProofUrl: invoice.paymentProofUrl ?? null,
  };
});

export const demoSeedCategories = demoInventoryCategories;
export const demoSeedLocations = demoInventoryLocations;

export const demoSeedInventoryItems = demoInventoryItems.map((item) => ({
  ...item,
  categoryName:
    demoInventoryCategories.find((category) => category.id === item.categoryId)?.name ?? "",
}));

export const demoSeedAssetUnits = demoInventoryAssetUnits.map((unit) => {
  const item = demoInventoryItems.find((candidate) => candidate.id === unit.itemId);
  const location = demoInventoryLocations.find((candidate) => candidate.id === unit.locationId);
  return {
    ...unit,
    itemName: item?.name ?? "",
    itemCode: item?.code ?? "",
    locationName: location?.name ?? "",
    locationCode: location?.code ?? "",
    createdAt: unit.createdAt.toISOString(),
  };
});

export const demoSeedLoans = demoInventoryLoans.map((loan) => {
  const unit = demoInventoryAssetUnits.find((candidate) => candidate.id === loan.unitId);
  const item = demoInventoryItems.find((candidate) => candidate.id === unit?.itemId);
  const borrower = demoUsers.find((candidate) => candidate.id === loan.borrowerId);
  return {
    ...loan,
    assetTag: unit?.assetTag ?? "",
    itemName: item?.name ?? "",
    borrowerName: borrower?.fullName ?? "",
  };
});

export const demoSeedStockMovements = demoInventoryStockMovements.map((movement) => {
  const item = demoInventoryItems.find((candidate) => candidate.id === movement.itemId);
  return {
    ...movement,
    itemName: item?.name ?? "",
    itemCode: item?.code ?? "",
    unit: item?.unit ?? "",
    createdAt: movement.createdAt.toISOString(),
  };
});
