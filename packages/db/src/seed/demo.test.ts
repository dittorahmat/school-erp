import { describe, expect, it } from "vitest";
import {
  demoAcademicYears,
  demoAssessmentComponents,
  demoAttendanceRecords,
  demoAttendanceSessions,
  demoClassrooms,
  demoEnrollments,
  demoGuardianStudents,
  demoInventoryAssetUnits,
  demoInventoryItems,
  demoInventoryLoans,
  demoInventoryRequisitions,
  demoInventoryStockMovements,
  demoInvoices,
  demoStudentGrades,
  demoSubjects,
  demoUsers,
} from "./demo";

const ids = (rows: Array<{ id: string }>) => rows.map((row) => row.id);

describe("Demo dataset integrity", () => {
  it("has unique user ids and usernames", () => {
    expect(new Set(ids(demoUsers)).size).toBe(demoUsers.length);
    expect(new Set(demoUsers.map((user) => user.username)).size).toBe(demoUsers.length);
  });

  it("has exactly one active academic year", () => {
    expect(demoAcademicYears.filter((year) => year.isActive)).toHaveLength(1);
    expect(demoAcademicYears.find((year) => year.isActive)?.name).toBe("2026/2027");

    const history = demoAcademicYears.find((year) => !year.isActive);
    expect(history?.name).toBe("2026/2027");
    expect(history?.semester).toBe("even");
    expect(history?.startDate).toBe("2027-01-05");
    expect(history?.endDate).toBe("2027-06-26");
  });

  it("keeps enrollments and guardian links referentially valid", () => {
    const userIds = new Set(ids(demoUsers));
    const classroomIds = new Set(ids(demoClassrooms));
    const yearIds = new Set(ids(demoAcademicYears));
    const studentIds = new Set(
      demoUsers.filter((user) => user.role === "student").map((user) => user.id)
    );

    for (const enrollment of demoEnrollments) {
      expect(studentIds.has(enrollment.studentId)).toBe(true);
      expect(classroomIds.has(enrollment.classroomId)).toBe(true);
      expect(yearIds.has(enrollment.academicYearId)).toBe(true);
    }

    for (const link of demoGuardianStudents) {
      expect(userIds.has(link.guardianId)).toBe(true);
      expect(studentIds.has(link.studentId)).toBe(true);
    }
  });

  it("provides 45 attendance days and the documented Ahmad summary", () => {
    expect(demoAttendanceSessions).toHaveLength(90);
    expect(demoAttendanceRecords).toHaveLength(90 * 4);

    const ahmad = demoAttendanceRecords.filter((record) => record.studentId === "usr_student_1");
    const count = (status: string) => ahmad.filter((record) => record.status === status).length;

    expect(count("present")).toBe(42);
    expect(count("sick")).toBe(2);
    expect(count("permit")).toBe(1);
    expect(count("absent")).toBe(0);
  });

  it("uses assessment weights that sum to 100 per subject", () => {
    for (const subject of demoSubjects) {
      const components = demoAssessmentComponents.filter(
        (component) => component.subjectId === subject.id
      );
      if (components.length === 0) continue;
      expect(components.reduce((total, component) => total + component.weightPercentage, 0)).toBe(100);
    }
  });

  it("keeps grades and invoices referentially valid", () => {
    const componentIds = new Set(ids(demoAssessmentComponents));
    const studentIds = new Set(demoUsers.filter((user) => user.role === "student").map((user) => user.id));

    for (const grade of demoStudentGrades) {
      expect(componentIds.has(grade.componentId)).toBe(true);
      expect(studentIds.has(grade.studentId)).toBe(true);
      expect(grade.score).toBeGreaterThanOrEqual(0);
      expect(grade.score).toBeLessThanOrEqual(100);
    }

    expect(new Set(ids(demoInvoices)).size).toBe(demoInvoices.length);
    for (const invoice of demoInvoices) {
      expect(studentIds.has(invoice.studentId)).toBe(true);
      expect(invoice.amount).toBeGreaterThan(0);
    }
  });

  it("keeps asset circulation and stock ledger consistent", () => {
    const unitIds = new Set(ids(demoInventoryAssetUnits));
    const itemIds = new Set(ids(demoInventoryItems));
    const userIds = new Set(ids(demoUsers));

    for (const unit of demoInventoryAssetUnits) {
      expect(itemIds.has(unit.itemId)).toBe(true);
    }
    expect(new Set(demoInventoryAssetUnits.map((unit) => unit.assetTag)).size).toBe(
      demoInventoryAssetUnits.length
    );

    for (const loan of demoInventoryLoans) {
      expect(unitIds.has(loan.unitId)).toBe(true);
      expect(userIds.has(loan.borrowerId)).toBe(true);
      if (loan.status === "borrowed") {
        expect(demoInventoryAssetUnits.find((unit) => unit.id === loan.unitId)?.status).toBe("loaned");
      }
      if (loan.status === "returned") {
        expect(demoInventoryAssetUnits.find((unit) => unit.id === loan.unitId)?.status).toBe("available");
      }
    }

    for (const item of demoInventoryItems) {
      const movements = demoInventoryStockMovements
        .filter((movement) => movement.itemId === item.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      if (movements.length === 0) continue;
      expect(movements[movements.length - 1].balanceAfter).toBeGreaterThanOrEqual(0);
      const expected = movements[movements.length - 1].balanceAfter;
      const recomputed = movements.reduce((balance, movement) => {
        if (movement.type === "in") return balance + movement.quantity;
        if (movement.type === "out") return balance - movement.quantity;
        return movement.quantity;
      }, 0);
      expect(recomputed).toBe(expected);
    }

    for (const requisition of demoInventoryRequisitions) {
      expect(itemIds.has(requisition.itemId)).toBe(true);
      expect(userIds.has(requisition.requesterId)).toBe(true);
    }
  });
});
