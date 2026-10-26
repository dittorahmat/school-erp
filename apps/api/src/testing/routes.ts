/**
 * The API route table, shared by every suite that needs to enumerate routes.
 *
 * `authz.test.ts` proves the allow list and `fallback.test.ts` proves the error
 * semantics of every GET, so a new route only has to be added here once.
 */
export const ALL = ["admin", "teacher", "student", "guardian"] as const;
export type Role = (typeof ALL)[number];

export interface RouteSpec {
  method: "GET" | "POST" | "PATCH";
  path: string;
  allow: readonly Role[];
}

export const routes: RouteSpec[] = [
  { method: "GET", path: "/api/dashboard/summary", allow: ALL },

  { method: "GET", path: "/api/academic/years", allow: ALL },
  { method: "GET", path: "/api/academic/subjects", allow: ALL },
  { method: "GET", path: "/api/academic/classrooms", allow: ALL },
  { method: "GET", path: "/api/academic/classrooms/cls_test/students", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/academic/classrooms", allow: ["admin"] },
  { method: "POST", path: "/api/academic/years", allow: ["admin"] },

  { method: "GET", path: "/api/attendance/summary", allow: ALL },
  { method: "GET", path: "/api/attendance/sessions?classroomId=cls_test&date=2026-10-23", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/attendance/session", allow: ["admin", "teacher"] },

  { method: "GET", path: "/api/finance/invoices", allow: ALL },
  { method: "POST", path: "/api/finance/batch-generate", allow: ["admin"] },
  { method: "POST", path: "/api/finance/upload-proof", allow: ALL },
  { method: "POST", path: "/api/finance/verify", allow: ["admin"] },

  { method: "GET", path: "/api/gradebook/scores", allow: ["admin", "teacher"] },
  { method: "POST", path: "/api/gradebook/save", allow: ["admin", "teacher"] },
  { method: "GET", path: "/api/gradebook/report-card", allow: ALL },

  { method: "GET", path: "/api/parent/children", allow: ALL },

  { method: "GET", path: "/api/inventory/categories", allow: ALL },
  { method: "POST", path: "/api/inventory/categories", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/locations", allow: ALL },
  { method: "POST", path: "/api/inventory/locations", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/items", allow: ALL },
  { method: "POST", path: "/api/inventory/items", allow: ["admin"] },
  { method: "GET", path: "/api/inventory/asset-units", allow: ALL },
  { method: "POST", path: "/api/inventory/asset-units", allow: ["admin"] },
  { method: "PATCH", path: "/api/inventory/asset-units/unit_test", allow: ["admin"] },
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
