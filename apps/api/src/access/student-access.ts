import {
  academicYears,
  createDb,
  demoAcademicYears,
  demoGuardianStudents,
  demoUsers,
  eq,
  guardianStudents,
} from "@school-erp/db";
import { isEmptyDatabase } from "../empty-database";

type Db = ReturnType<typeof createDb>;
export type AccessUser = { sub: string; username: string; role: string };

const demoActiveYearId = demoAcademicYears.find((year) => year.isActive)?.id ?? "ay_2026_2027";

/**
 * The demo year answers only while the database is unseeded. A seeded database
 * without an active year is a configuration error, not a reason to invent one.
 */
export async function activeYearId(db: Db): Promise<string> {
  const rows = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(eq(academicYears.isActive, true))
    .limit(1);
  if (rows[0]) return rows[0].id;
  if (await isEmptyDatabase(db)) return demoActiveYearId;
  throw new Error("Tahun ajaran aktif belum ditetapkan");
}

/**
 * Demo guardian links for bootstrap tokens. On an unseeded database the login
 * fallback signs `sub = usr_demo_<username>`, which matches no seeded row, so
 * both the token subject and the demo user id are candidates.
 */
function demoStudentIdsFor(user: AccessUser): string[] {
  const guardianIds = new Set([user.sub]);
  const demoUser = demoUsers.find((candidate) => candidate.username === user.username);
  if (demoUser) guardianIds.add(demoUser.id);

  return demoGuardianStudents
    .filter((link) => guardianIds.has(link.guardianId))
    .map((link) => link.studentId);
}

async function seededLinksFor(db: Db, user: AccessUser) {
  return db
    .select({ studentId: guardianStudents.studentId })
    .from(guardianStudents)
    .where(eq(guardianStudents.guardianId, user.sub));
}

/**
 * Can this user read this student's attendance, grades, and invoices?
 *
 * Database failures propagate: the route turns them into 500. The demo links
 * answer only on a never-seeded database.
 */
export async function canReadStudent(
  db: Db,
  user: AccessUser,
  studentId: string
): Promise<boolean> {
  if (user.role === "admin" || user.role === "teacher") return true;
  if (user.role === "student") return user.sub === studentId;
  if (user.role !== "guardian") return false;

  const links = await seededLinksFor(db, user);
  if (links.length > 0) return links.some((link) => link.studentId === studentId);
  if (!(await isEmptyDatabase(db))) return false;
  return demoStudentIdsFor(user).includes(studentId);
}

/**
 * Students a guardian may see, `null` for staff who may see everyone, `[]` when
 * the link is genuinely absent. Demo links apply only on an unseeded database.
 */
export async function visibleStudentIds(
  db: Db,
  user: AccessUser
): Promise<string[] | null> {
  if (user.role === "admin" || user.role === "teacher") return null;
  if (user.role === "student") return [user.sub];
  if (user.role !== "guardian") return [];

  const links = await seededLinksFor(db, user);
  if (links.length > 0) return links.map((link) => link.studentId);
  if (!(await isEmptyDatabase(db))) return [];
  return demoStudentIdsFor(user);
}
