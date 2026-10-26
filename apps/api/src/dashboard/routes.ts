import { Hono } from "hono";
import { Bindings } from "../index";
import { authMiddleware } from "../auth/middleware";
import {
  attendanceRecords,
  attendanceSessions,
  classrooms,
  createDb,
  demoAttendanceRecords,
  demoClassrooms,
  demoInvoices,
  demoUsers,
  desc,
  eq,
  invoices,
  users,
} from "@school-erp/db";
import { summarizeAttendance } from "../attendance/summary";

export const dashboardRouter = new Hono<{ Bindings: Bindings }>();

dashboardRouter.use("*", authMiddleware());

const jakartaMonth = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "10";
  return `${year}-${month}`;
};

/** Today in Jakarta. Used when a seeded database has no attendance session yet. */
const jakartaDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

dashboardRouter.get("/summary", async (c) => {
  const db = createDb(c.env.DB);

  let studentCount = 0;
  let classroomCount = 0;
  let latestDate = jakartaDate();
  let attendance = summarizeAttendance([]);
  let invoiceRows: Array<{ month: string | null; amount: number; status: string }> = [];

  try {
    const [studentRows, classroomRows, latestSessions, allInvoices] = await Promise.all([
      db.select({ id: users.id }).from(users).where(eq(users.role, "student")),
      db.select({ id: classrooms.id }).from(classrooms),
      db
        .select({ date: attendanceSessions.date })
        .from(attendanceSessions)
        .orderBy(desc(attendanceSessions.date))
        .limit(1),
      db.select({ month: invoices.month, amount: invoices.amount, status: invoices.status }).from(invoices),
    ]);

    // No row in any table the dashboard reads: the database was never seeded.
    const empty =
      studentRows.length === 0 &&
      classroomRows.length === 0 &&
      latestSessions.length === 0 &&
      allInvoices.length === 0;

    if (empty) {
      studentCount = demoUsers.filter((user) => user.role === "student").length;
      classroomCount = demoClassrooms.length;
      latestDate = "2026-10-23";
      attendance = summarizeAttendance(
        demoAttendanceRecords.filter((record) => record.sessionId.includes(latestDate))
      );
      invoiceRows = demoInvoices.map((invoice) => ({
        month: invoice.month ?? null,
        amount: invoice.amount,
        status: invoice.status ?? "unpaid",
      }));
    } else {
      studentCount = studentRows.length;
      classroomCount = classroomRows.length;
      invoiceRows = allInvoices;

      if (latestSessions[0]) latestDate = latestSessions[0].date;
      const records = await db
        .select({ status: attendanceRecords.status })
        .from(attendanceRecords)
        .innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id))
        .where(eq(attendanceSessions.date, latestDate));
      attendance = summarizeAttendance(records);
    }
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat ringkasan dashboard", message: String(err) }, 500);
  }

  const currentMonth = jakartaMonth();
  const months = Array.from(
    new Set(invoiceRows.map((invoice) => invoice.month).filter((month): month is string => Boolean(month)))
  ).sort();
  const period = months.includes(currentMonth)
    ? currentMonth
    : (months[months.length - 1] ?? currentMonth);

  const periodInvoices = invoiceRows.filter(
    (invoice) => invoice.month === period && invoice.status !== "void"
  );
  const totalAmount = periodInvoices.reduce((total, invoice) => total + invoice.amount, 0);
  const paidAmount = periodInvoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((total, invoice) => total + invoice.amount, 0);
  const collectionRate =
    totalAmount > 0 ? Number(((paidAmount / totalAmount) * 100).toFixed(1)) : 0;
  const pendingVerifications = invoiceRows.filter((invoice) => invoice.status === "pending").length;

  return c.json({
    data: {
      students: studentCount,
      classrooms: classroomCount,
      attendance: {
        date: latestDate,
        present: attendance.present,
        total: attendance.total,
        percentage: attendance.percentage,
      },
      finance: {
        month: period,
        paidAmount,
        totalAmount,
        collectionRate,
      },
      pendingVerifications,
    },
  });
});
