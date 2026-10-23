import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./auth";

export const academicYears = sqliteTable("academic_years", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g. "2025/2026"
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  semester: text("semester", { enum: ["odd", "even"] }).notNull().default("odd"), // ganjil / genap
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const classrooms = sqliteTable("classrooms", {
  id: text("id").primaryKey(),
  academicYearId: text("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "X-MIPA-1"
  gradeLevel: integer("grade_level").notNull(), // 7, 8, 9, 10, 11, 12
  homeroomTeacherId: text("homeroom_teacher_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g. "MAT-X"
  name: text("name").notNull(), // Matematika
  gradeLevel: integer("grade_level").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const studentEnrollments = sqliteTable("student_enrollments", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id, { onDelete: "cascade" }),
  academicYearId: text("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  enrolledAt: integer("enrolled_at", { mode: "timestamp" }).notNull(),
});
