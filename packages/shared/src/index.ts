import { z } from "zod";

export const UserRole = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  GUARDIAN: "guardian",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const AttendanceStatus = {
  PRESENT: "present",
  SICK: "sick",
  PERMIT: "permit",
  ABSENT: "absent",
} as const;

export type AttendanceStatusType = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const InvoiceStatus = {
  UNPAID: "unpaid",
  PENDING: "pending",
  PAID: "paid",
  VOID: "void",
} as const;

export type InvoiceStatusType = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
