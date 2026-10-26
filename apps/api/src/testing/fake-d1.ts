/**
 * Minimal D1 stand-in for route tests.
 *
 * Drizzle reads projected columns through `raw()`, not `all()`: `raw` returns
 * one array per row, ordered like the selected columns. Supply row objects whose
 * key order matches that projection.
 */
export function createFakeD1(
  rowsFor: (sql: string) => Array<Record<string, unknown>> = () => []
): D1Database {
  const prepare = (sql: string) => {
    const rows = rowsFor(sql);
    const statement = {
      bind: () => statement,
      all: async () => ({ results: rows }),
      first: async () => rows[0] ?? null,
      raw: async () => rows.map((row) => Object.values(row)),
      run: async () => ({ results: rows }),
    };
    return statement;
  };

  return {
    prepare,
    batch: async () => [],
    exec: async () => ({ count: 0 }),
  } as unknown as D1Database;
}

/** A database that fails on first use, for tests that own error semantics. */
export const throwingD1 = new Proxy(
  {},
  {
    get() {
      throw new Error("test: database is unavailable");
    },
  }
) as unknown as D1Database;
