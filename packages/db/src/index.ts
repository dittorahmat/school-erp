import * as schema from "./schema";
import { drizzle } from "drizzle-orm/d1";

export * from "./schema";
export * from "./seed/data";
export { eq, ne, desc, asc, and, or, isNull, inArray, sql } from "drizzle-orm";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
