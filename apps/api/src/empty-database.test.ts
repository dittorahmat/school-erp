import { describe, expect, it } from "vitest";
import { isEmptyDatabase } from "./empty-database";

type Db = Parameters<typeof isEmptyDatabase>[0];

const stubDb = (rows: Array<{ id: string }>) =>
  ({
    select: () => ({ from: () => ({ limit: async () => rows }) }),
  }) as unknown as Db;

describe("isEmptyDatabase", () => {
  it("treats a database without users as unseeded", async () => {
    expect(await isEmptyDatabase(stubDb([]))).toBe(true);
  });

  it("treats a database with any user as seeded", async () => {
    expect(await isEmptyDatabase(stubDb([{ id: "usr_admin" }]))).toBe(false);
  });
});
