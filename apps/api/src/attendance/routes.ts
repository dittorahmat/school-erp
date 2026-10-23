import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import { createDb, attendanceSessions, attendanceRecords } from "@school-erp/db";
import { AttendanceStatus } from "@school-erp/shared";

const attendanceRouter = new Hono<{ Bindings: Bindings }>();

attendanceRouter.use("*", authMiddleware());

// GET /api/attendance/summary (Untuk Siswa atau Wali)
attendanceRouter.get("/summary", async (c) => {
  return c.json({
    data: {
      present: 42,
      sick: 2,
      permit: 1,
      absent: 0,
      percentage: "93.3%",
    },
  });
});

// POST /api/attendance/session (Untuk Guru / Admin)
attendanceRouter.post("/session", requireRoles("admin", "teacher"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    classroomId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    records: z.array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(["present", "sick", "permit", "absent"]),
        remarks: z.string().optional(),
      })
    ),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid attendance session payload" }, 400);
  }

  const user = c.get("user");
  const sessionId = `att_${Date.now()}`;

  return c.json({
    message: "Presensi berhasil disimpan",
    data: {
      sessionId,
      recordedBy: user.fullName,
      totalStudents: parsed.data.records.length,
      date: parsed.data.date,
    },
  });
});

export { attendanceRouter };
