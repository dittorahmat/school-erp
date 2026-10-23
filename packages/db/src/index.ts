import * as schema from "./schema";
import { drizzle } from "drizzle-orm/d1";

export * from "./schema";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
