import { Hono } from "hono";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import {
  and,
  attendanceRecords,
  attendanceSessions,
  createDb,
  demoAttendanceRecords,
  eq,
  isNull,
  users,
} from "@school-erp/db";
import { summarizeAttendance } from "./summary";
import { sessionInputSchema } from "./schema";
import { isEmptyDatabase } from "../empty-database";
import { canReadStudent } from "../access/student-access";

const attendanceRouter = new Hono<{ Bindings: Bindings }>();

attendanceRouter.use("*", authMiddleware());

// GET /api/attendance/summary?studentId=
attendanceRouter.get("/summary", async (c) => {
  const user = c.get("user");
  const studentId = c.req.query("studentId") || user.sub;
  const db = createDb(c.env.DB);

  try {
    if (!(await canReadStudent(db, user, studentId))) {
      return c.json({ error: "Forbidden: tidak berhak melihat presensi siswa ini" }, 403);
    }

    let records = await db
      .select({ status: attendanceRecords.status })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, studentId));

    if (records.length === 0 && (await isEmptyDatabase(db))) {
      // Never-seeded database: fall back to the demo history.
      records = demoAttendanceRecords.filter((record) => record.studentId === studentId);
    }

    return c.json({ data: summarizeAttendance(records) });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat rekap presensi", message: String(err) }, 500);
  }
});

// GET /api/attendance/sessions?classroomId=&date=
attendanceRouter.get("/sessions", requireRoles("admin", "teacher"), async (c) => {
  const classroomId = c.req.query("classroomId");
  const date = c.req.query("date");
  if (!classroomId || !date) {
    return c.json({ error: "classroomId dan date wajib diisi" }, 400);
  }

  const db = createDb(c.env.DB);

  try {
    const session = await db
      .select()
      .from(attendanceSessions)
      .where(and(eq(attendanceSessions.classroomId, classroomId), eq(attendanceSessions.date, date)))
      .limit(1);

    if (session[0]) {
      const records = await db
        .select({
          id: attendanceRecords.id,
          studentId: attendanceRecords.studentId,
          studentName: users.fullName,
          status: attendanceRecords.status,
          remarks: attendanceRecords.remarks,
        })
        .from(attendanceRecords)
        .innerJoin(users, eq(attendanceRecords.studentId, users.id))
        .where(eq(attendanceRecords.sessionId, session[0].id))
        .orderBy(users.fullName);

      return c.json({ data: { ...session[0], records } });
    }

    return c.json({ data: null });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat sesi presensi", message: String(err) }, 500);
  }
});

// POST /api/attendance/session (Guru / Admin)
attendanceRouter.post("/session", requireRoles("admin", "teacher"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = sessionInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid attendance session payload" }, 400);
  }

  const user = c.get("user");
  const db = createDb(c.env.DB);
  const { classroomId, subjectId, date, records } = parsed.data;

  try {
    const dbUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, user.username))
      .limit(1);

    if (!dbUser[0]) {
      return c.json({ error: "Akun guru belum tersedia di database. Jalankan seeder demo." }, 400);
    }

    const existing = await db
      .select({ id: attendanceSessions.id })
      .from(attendanceSessions)
      .where(
        and(
          eq(attendanceSessions.classroomId, classroomId),
          eq(attendanceSessions.date, date),
          subjectId
            ? eq(attendanceSessions.subjectId, subjectId)
            : isNull(attendanceSessions.subjectId)
        )
      )
      .limit(1);

    const sessionId = existing[0]?.id ?? `att_${classroomId}_${date}_${subjectId ?? "daily"}`;

    if (existing[0]) {
      await db
        .update(attendanceSessions)
        .set({ recordedById: dbUser[0].id })
        .where(eq(attendanceSessions.id, sessionId));
    } else {
      await db.insert(attendanceSessions).values({
        id: sessionId,
        classroomId,
        subjectId: subjectId ?? null,
        recordedById: dbUser[0].id,
        date,
        createdAt: new Date(),
      });
    }

    await db.delete(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId));

    const rows = records.map((record) => ({
      id: `att_rec_${sessionId}_${record.studentId}`,
      sessionId,
      studentId: record.studentId,
      status: record.status,
      remarks: record.remarks ?? null,
    }));

    for (let index = 0; index < rows.length; index += 50) {
      await db.insert(attendanceRecords).values(rows.slice(index, index + 50));
    }

    return c.json({
      message: "Presensi berhasil disimpan",
      data: {
        sessionId,
        recordedBy: user.fullName,
        totalStudents: rows.length,
        date,
      },
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menyimpan presensi", message: String(err) }, 500);
  }
});

export { attendanceRouter };
