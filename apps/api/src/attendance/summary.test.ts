import { describe, expect, it } from "vitest";
import { summarizeAttendance } from "./summary";

describe("summarizeAttendance", () => {
  it("returns the documented Ahmad Dahlan recap", () => {
    const records = [
      ...Array.from({ length: 42 }, () => ({ status: "present" })),
      ...Array.from({ length: 2 }, () => ({ status: "sick" })),
      ...Array.from({ length: 1 }, () => ({ status: "permit" })),
    ];

    expect(summarizeAttendance(records)).toEqual({
      present: 42,
      sick: 2,
      permit: 1,
      absent: 0,
      total: 45,
      percentage: 93.3,
    });
  });

  it("handles an empty history", () => {
    expect(summarizeAttendance([])).toEqual({
      present: 0,
      sick: 0,
      permit: 0,
      absent: 0,
      total: 0,
      percentage: 0,
    });
  });
});
