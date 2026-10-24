import { Hono } from "hono";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import {
  and,
  attendanceRecords,
  attendanceSessions,
  createDb,
  demoAttendanceRecords,
  demoAttendanceSessions,
  demoGuardianStudents,
  demoUsers,
  eq,
  guardianStudents,
  isNull,
  users,
} from "@school-erp/db";
import { summarizeAttendance } from "./summary";
import { sessionInputSchema } from "./schema";

const attendanceRouter = new Hono<{ Bindings: Bindings }>();

attendanceRouter.use("*", authMiddleware());

async function canReadStudent(
  db: ReturnType<typeof createDb>,
  user: { sub: string; role: string },
  studentId: string
) {
  if (user.role === "admin" || user.role === "teacher") return true;
  if (studentId === user.sub) return true;
  if (user.role !== "guardian") return false;

  try {
    const links = await db
      .select()
      .from(guardianStudents)
      .where(and(eq(guardianStudents.guardianId, user.sub), eq(guardianStudents.studentId, studentId)))
      .limit(1);
    if (links.length > 0) return true;
  } catch {
    // fallback below
  }

  return demoGuardianStudents.some(
    (link) => link.guardianId === user.sub && link.studentId === studentId
  );
}

// GET /api/attendance/summary?studentId=
attendanceRouter.get("/summary", async (c) => {
  const user = c.get("user");
  const studentId = c.req.query("studentId") || user.sub;
  const db = createDb(c.env.DB);

  if (!(await canReadStudent(db, user, studentId))) {
    return c.json({ error: "Forbidden: tidak berhak melihat presensi siswa ini" }, 403);
  }

  let records: Array<{ status: string }> = [];
  try {
    records = await db
      .select({ status: attendanceRecords.status })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, studentId));
  } catch {
    records = demoAttendanceRecords.filter((record) => record.studentId === studentId);
  }

  return c.json({ data: summarizeAttendance(records) });
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
  } catch {
    // fallback below
  }

  const demoSession = demoAttendanceSessions.find(
    (item) => item.classroomId === classroomId && item.date === date
  );
  if (!demoSession) return c.json({ data: null });

  return c.json({
    data: {
      ...demoSession,
      records: demoAttendanceRecords
        .filter((record) => record.sessionId === demoSession.id)
        .map((record) => ({
          ...record,
          studentName: demoUsers.find((user) => user.id === record.studentId)?.fullName ?? "",
        })),
    },
  });
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
