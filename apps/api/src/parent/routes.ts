import { Hono } from "hono";
import { Bindings } from "../index";
import { authMiddleware } from "../auth/middleware";

const parentRouter = new Hono<{ Bindings: Bindings }>();

parentRouter.use("*", authMiddleware());

// GET /api/parent/children (Mendapatkan daftar anak perwalian)
parentRouter.get("/children", async (c) => {
  return c.json({
    data: [
      {
        id: "std_1",
        name: "Ahmad Dahlan",
        nisn: "0081293812",
        classroom: "X-MIPA-1",
        gradeLevel: 10,
        attendancePercentage: "93.3%",
        unpaidInvoicesCount: 1,
        totalUnpaidAmount: 350000,
        gpa: 86.25,
      },
      {
        id: "std_4",
        name: "Dewi Sartika",
        nisn: "0081293844",
        classroom: "VII-B",
        gradeLevel: 7,
        attendancePercentage: "97.5%",
        unpaidInvoicesCount: 0,
        totalUnpaidAmount: 0,
        gpa: 88.5,
      },
    ],
  });
});

export { parentRouter };
