import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import { classrooms, subjects } from "./academic";

export const attendanceSessions = sqliteTable("attendance_sessions", {
  id: text("id").primaryKey(),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subjects.id),
  recordedById: text("recorded_by_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const attendanceRecords = sqliteTable("attendance_records", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => attendanceSessions.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["present", "sick", "permit", "absent"] }).notNull(),
  remarks: text("remarks"),
});
