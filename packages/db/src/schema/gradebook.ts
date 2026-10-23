import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import { classrooms, subjects, academicYears } from "./academic";

export const assessmentComponents = sqliteTable("assessment_components", {
  id: text("id").primaryKey(),
  subjectId: text("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  academicYearId: text("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Tugas/Formatif", "UTS/Sumatif Tengah", "UAS/SAS"
  weightPercentage: integer("weight_percentage").notNull(), // e.g. 30, 30, 40 (total 100)
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const studentGrades = sqliteTable("student_grades", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  componentId: text("component_id")
    .notNull()
    .references(() => assessmentComponents.id, { onDelete: "cascade" }),
  score: real("score").notNull(), // Nilai 0 - 100
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
