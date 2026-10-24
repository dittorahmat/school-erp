import { describe, expect, it } from "vitest";
import { sessionInputSchema } from "./schema";

const validPayload = {
  classroomId: "cls_10_mipa_1",
  date: "2026-10-23",
  records: [{ studentId: "usr_student_1", status: "present" }],
};

describe("attendance session payload", () => {
  it("accepts a minimal daily session", () => {
    expect(sessionInputSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects a missing classroom, malformed date, or unknown status", () => {
    expect(sessionInputSchema.safeParse({ ...validPayload, classroomId: "" }).success).toBe(false);
    expect(sessionInputSchema.safeParse({ ...validPayload, date: "23-10-2026" }).success).toBe(false);
    expect(
      sessionInputSchema.safeParse({
        ...validPayload,
        records: [{ studentId: "usr_student_1", status: "late" }],
      }).success
    ).toBe(false);
  });

  it("rejects an empty record list", () => {
    expect(sessionInputSchema.safeParse({ ...validPayload, records: [] }).success).toBe(false);
  });
});
