import { describe, it, expect } from "vitest";
import {
  users,
  academicYears,
  classrooms,
  subjects,
  feeComponents,
  inventoryCategories,
  inventoryItems,
} from "./schema";

describe("Database Schema Entities", () => {
  it("should have tables defined properly", () => {
    expect(users).toBeDefined();
    expect(academicYears).toBeDefined();
    expect(classrooms).toBeDefined();
    expect(subjects).toBeDefined();
    expect(feeComponents).toBeDefined();
    expect(inventoryCategories).toBeDefined();
    expect(inventoryItems).toBeDefined();
  });
});
