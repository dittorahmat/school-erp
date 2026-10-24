import { describe, expect, it } from "vitest";
import { calculateFinalScore, predicateFor } from "./score";

describe("gradebook scoring", () => {
  it("calculates the weighted final score", () => {
    expect(
      calculateFinalScore([
        { weight: 30, score: 88 },
        { weight: 30, score: 85 },
        { weight: 40, score: 90 },
      ])
    ).toBe(87.9);
  });

  it("ignores missing scores and normalizes the remaining weights", () => {
    expect(
      calculateFinalScore([
        { weight: 30, score: 80 },
        { weight: 30, score: null },
        { weight: 40, score: 90 },
      ])
    ).toBe(85.7);
  });

  it("maps scores to predicates", () => {
    expect(predicateFor(87.9)).toBe("A");
    expect(predicateFor(80.2)).toBe("B");
    expect(predicateFor(65)).toBe("C");
    expect(predicateFor(50)).toBe("D");
  });
});
