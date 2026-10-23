import { Hono } from "hono";
import { Bindings } from "../index";
import { authMiddleware } from "../auth/middleware";

const parentRouter = new Hono<{ Bindings: Bindings }>();

parentRouter.use("*", authMiddleware());

// GET /api/parent/children
parentRouter.get("/children", async (c) => {
  return c.json({
    data: [
      {
        id: "std_1",
        name: "Ahmad Dahlan",
        nisn: "0081293812",
        classroom: "X-MIPA-1",
        gradeLevel: 10,
        attendancePercentage: "96.4%",
        unpaidInvoicesCount: 1,
        totalUnpaidAmount: 350000,
        gpa: 87.9,
      },
      {
        id: "std_2",
        name: "Dewi Sartika",
        nisn: "0081293844",
        classroom: "VII-B",
        gradeLevel: 7,
        attendancePercentage: "98.2%",
        unpaidInvoicesCount: 0,
        totalUnpaidAmount: 0,
        gpa: 91.5,
      },
      {
        id: "std_3",
        name: "Budi Santoso",
        nisn: "0081293855",
        classroom: "X-MIPA-1",
        gradeLevel: 10,
        attendancePercentage: "94.0%",
        unpaidInvoicesCount: 1,
        totalUnpaidAmount: 350000,
        gpa: 84.5,
      },
    ],
  });
});

export { parentRouter };
