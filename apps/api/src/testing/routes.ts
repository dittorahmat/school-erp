/**
 * The API route table, shared by every suite that needs to enumerate routes.
 *
 * `authz.test.ts` proves the allow list and `fallback.test.ts` proves the error
 * semantics of every GET, so a new route only has to be added here once.
 */
export const ALL = ["admin", "teacher", "student", "guardian"] as const;
export type Role = (typeof ALL)[number];

export const staffRoutes: RouteSpec[] = [
  { method: "GET", path: "/api/staff", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/staff", allow: ["admin"] },
  { method: "PATCH", path: "/api/staff/usr_teacher_test", allow: ["admin"] },
  { method: "DELETE", path: "/api/staff/usr_teacher_test", allow: ["admin"] },
];

export const guardianRoutes: RouteSpec[] = [
  { method: "GET", path: "/api/guardians", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/guardians", allow: ["admin"] },
  { method: "PATCH", path: "/api/guardians/usr_guardian_test", allow: ["admin"] },
  { method: "DELETE", path: "/api/guardians/usr_guardian_test", allow: ["admin"] },
  { method: "POST", path: "/api/guardians/usr_guardian_test/students", allow: ["admin"] },
  { method: "DELETE", path: "/api/guardians/usr_guardian_test/students/usr_student_test", allow: ["admin"] },
];

export interface RouteSpec {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  allow: readonly Role[];
}

export const routes: RouteSpec[] = [
  ...staffRoutes,
  ...guardianRoutes,
  { method: "GET", path: "/api/dashboard/summary", allow: ALL },

  { method: "GET", path: "/api/academic/years", allow: ALL },
  { method: "GET", path: "/api/academic/subjects", allow: ALL },
  { method: "POST", path: "/api/academic/subjects", allow: ["admin"] },
  { method: "PATCH", path: "/api/academic/subjects/sub_test", allow: ["admin"] },
  { method: "DELETE", path: "/api/academic/subjects/sub_test", allow: ["admin"] },
  { method: "GET", path: "/api/academic/classrooms", allow: ALL },
  { method: "GET", path: "/api/academic/classrooms/cls_test/students", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/academic/classrooms", allow: ["admin"] },
  { method: "PATCH", path: "/api/academic/classrooms/cls_test/homeroom", allow: ["admin"] },
  { method: "POST", path: "/api/academic/classrooms/cls_test/enroll", allow: ["admin"] },
  { method: "DELETE", path: "/api/academic/classrooms/cls_test/enroll/usr_student_test", allow: ["admin"] },
  { method: "POST", path: "/api/academic/years", allow: ["admin"] },
  { method: "PATCH", path: "/api/academic/years/ay_test/activate", allow: ["admin"] },
  { method: "PATCH", path: "/api/academic/years/ay_test", allow: ["admin"] },
  { method: "GET", path: "/api/academic/students", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/academic/students", allow: ["admin"] },
  { method: "PATCH", path: "/api/academic/students/usr_student_test", allow: ["admin"] },
  { method: "DELETE", path: "/api/academic/students/usr_student_test", allow: ["admin"] },

  { method: "GET", path: "/api/attendance/summary", allow: ALL },
  { method: "GET", path: "/api/attendance/sessions?classroomId=cls_test&date=2026-10-23", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/attendance/session", allow: ["admin", "teacher"] },

  { method: "GET", path: "/api/finance/invoices", allow: ALL },
  { method: "POST", path: "/api/finance/invoices", allow: ["admin"] },
  { method: "GET", path: "/api/finance/fee-components", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/finance/fee-components", allow: ["admin"] },
  { method: "PATCH", path: "/api/finance/fee-components/fee_test", allow: ["admin"] },
  { method: "DELETE", path: "/api/finance/fee-components/fee_test", allow: ["admin"] },
  { method: "POST", path: "/api/finance/batch-generate", allow: ["admin"] },
  { method: "POST", path: "/api/finance/upload-proof", allow: ALL },
  { method: "POST", path: "/api/finance/verify", allow: ["admin"] },

  { method: "GET", path: "/api/gradebook/scores", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/gradebook/save", allow: ["admin", "teacher"] },
  { method: "GET", path: "/api/gradebook/report-card", allow: ALL },

  { method: "GET", path: "/api/parent/children", allow: ALL },

  { method: "GET", path: "/api/inventory/categories", allow: ALL },
  { method: "POST", path: "/api/inventory/categories", allow: ["admin"] },
  { method: "PATCH", path: "/api/inventory/categories/cat_test", allow: ["admin"] },
  { method: "DELETE", path: "/api/inventory/categories/cat_test", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/locations", allow: ALL },
  { method: "POST", path: "/api/inventory/locations", allow: ["admin"] },
  { method: "PATCH", path: "/api/inventory/locations/loc_test", allow: ["admin"] },
  { method: "DELETE", path: "/api/inventory/locations/loc_test", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/items", allow: ALL },
  { method: "POST", path: "/api/inventory/items", allow: ["admin"] },
  { method: "PATCH", path: "/api/inventory/items/itm_test", allow: ["admin"] },
  { method: "DELETE", path: "/api/inventory/items/itm_test", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/asset-units", allow: ALL },
  { method: "POST", path: "/api/inventory/asset-units", allow: ["admin"] },
  { method: "PATCH", path: "/api/inventory/asset-units/unit_test", allow: ["admin"] },
  { method: "DELETE", path: "/api/inventory/asset-units/unit_test", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/loans", allow: ALL },
  { method: "POST", path: "/api/inventory/loans", allow: ALL },
  { method: "POST", path: "/api/inventory/loans/loan_test/approval", allow: ["admin"] },
  { method: "POST", path: "/api/inventory/loans/loan_test/return", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/stock-movements", allow: ALL },
  { method: "POST", path: "/api/inventory/stock-movements", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/requisitions", allow: ALL },
  { method: "POST", path: "/api/inventory/requisitions", allow: ALL },
  { method: "POST", path: "/api/inventory/requisitions/req_test/approval", allow: ["admin"] },

  { method: "POST", path: "/api/admin/seed-demo", allow: ["admin"] },
];

export const readRoutes = routes.filter((route) => route.method === "GET");
