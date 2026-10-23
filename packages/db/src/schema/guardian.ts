import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./auth";

export const guardianStudents = sqliteTable("guardian_students", {
  id: text("id").primaryKey(),
  guardianId: text("guardian_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  relationship: text("relationship").notNull().default("Wali"), // Ayah, Ibu, Wali
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
