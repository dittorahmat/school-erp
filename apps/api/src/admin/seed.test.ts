import { describe, expect, it } from "vitest";
import { chunkRows, D1_MAX_PARAMETERS } from "./seed";

const rows = (count: number) => Array.from({ length: count }, (_, index) => index);

describe("chunkRows", () => {
  it("keeps every statement under the D1 parameter cap", () => {
    // users: 9 columns, 17 rows — the shape that broke the first seeder run
    const chunks = chunkRows(rows(17), 9);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length * 9).toBeLessThanOrEqual(D1_MAX_PARAMETERS);
    }
  });

  it("does not split records or reorder them", () => {
    const input = rows(45);
    const chunks = chunkRows(input, 5);
    expect(chunks.flat()).toEqual(input);
  });

  it("uses a single statement when the payload fits", () => {
    expect(chunkRows(rows(3), 6)).toHaveLength(1);
  });

  it("returns no chunks for an empty table", () => {
    expect(chunkRows([], 9)).toEqual([]);
  });

  it("still makes progress when one row already exceeds the cap", () => {
    const chunks = chunkRows(rows(2), 400);
    expect(chunks).toEqual([[0], [1]]);
  });
});
