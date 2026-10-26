import { createDb, users } from "@school-erp/db";

type Db = ReturnType<typeof createDb>;

/**
 * The demo dataset may stand in for a database that was never seeded, and only
 * for that. A populated database that happens to return no rows for one query
 * (a student with no attendance yet, a month without invoices) must report the
 * emptiness instead of borrowing demo numbers.
 */
export async function isEmptyDatabase(db: Db): Promise<boolean> {
  const rows = await db.select({ id: users.id }).from(users).limit(1);
  return rows.length === 0;
}
