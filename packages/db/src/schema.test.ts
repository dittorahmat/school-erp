import { describe, it, expect } from "vitest";
import {
  users,
  academicYears,
  classrooms,
  subjects,
  feeComponents,
  cashTransactions,
  inventoryCategories,
  inventoryItems,
  inventoryLocations,
  inventoryAssetUnits,
  inventoryLoans,
  inventoryStockMovements,
  inventoryRequisitions,
} from "./schema";

describe("Database Schema Entities", () => {
  it("should have all tables defined properly", () => {
    expect(users).toBeDefined();
    expect(academicYears).toBeDefined();
    expect(academicYears.startDate).toBeDefined();
    expect(academicYears.endDate).toBeDefined();
    expect(classrooms).toBeDefined();
    expect(subjects).toBeDefined();
    expect(feeComponents).toBeDefined();
    expect(cashTransactions).toBeDefined();
    expect(inventoryCategories).toBeDefined();
    expect(inventoryItems).toBeDefined();
    expect(inventoryLocations).toBeDefined();
    expect(inventoryAssetUnits).toBeDefined();
    expect(inventoryLoans).toBeDefined();
    expect(inventoryStockMovements).toBeDefined();
    expect(inventoryRequisitions).toBeDefined();
  });
});
