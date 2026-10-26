import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import { academicYears } from "./academic";

export const feeComponents = sqliteTable("fee_components", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g. "SPP Bulanan", "Uang Gedung"
  amount: integer("amount").notNull(), // dalam satuan rupiah (IDR)
  isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  academicYearId: text("academic_year_id")
    .notNull()
    .references(() => academicYears.id),
  feeComponentId: text("fee_component_id")
    .notNull()
    .references(() => feeComponents.id),
  month: text("month"), // e.g. "2026-10"
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["unpaid", "pending", "paid", "void"] }).notNull().default("unpaid"),
  paymentProofUrl: text("payment_proof_url"), // R2 Key / URL
  paidAt: integer("paid_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const cashTransactions = sqliteTable("cash_transactions", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  type: text("type", { enum: ["debit", "credit"] }).notNull(),
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  invoiceId: text("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
