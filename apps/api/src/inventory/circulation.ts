import {
  inventoryLoans,
  inventoryAssetUnits,
  eq,
} from "@school-erp/db";

export interface LoanRequestInput {
  unitId: string;
  borrowerId: string;
  expectedReturnDate: Date;
  purpose: string;
  outCondition?: "good" | "light_damage" | "heavy_damage" | "lost";
}

export interface ReturnInspectionInput {
  loanId: string;
  returnCondition: "good" | "light_damage" | "heavy_damage" | "lost";
  inspectionNotes?: string | null;
}

export interface DatabaseAdapter {
  select(): any;
  insert(table: any): { values(val: any): Promise<any> };
  update(table: any): { set(val: any): { where(clause: any): Promise<any> } };
}

/**
 * Deep domain module: AssetCirculation
 * Encapsulates the lifecycle, state machine transitions, and invariants
 * for fixed asset loans, approvals, and return inspections.
 */
export class AssetCirculation {
  constructor(private db: DatabaseAdapter) {}

  /**
   * Creates a pending loan request for a designated asset unit.
   */
  async requestLoan(input: LoanRequestInput): Promise<{ id: string; status: "pending" }> {
    if (!input.unitId || !input.borrowerId) {
      throw new Error("Unit aset dan peminjam wajib ditentukan");
    }
    const id = `loan_${Date.now()}`;
    const loan = {
      id,
      unitId: input.unitId,
      borrowerId: input.borrowerId,
      loanDate: new Date(),
      expectedReturnDate: input.expectedReturnDate,
      purpose: input.purpose,
      outCondition: input.outCondition ?? ("good" as const),
      status: "pending" as const,
      createdAt: new Date(),
    };

    await this.db.insert(inventoryLoans).values(loan);
    return { id, status: "pending" };
  }

  /**
   * Approves or rejects a loan request, updating the underlying asset unit status.
   */
  async processApproval(
    loanId: string,
    approverId: string,
    decision: "approve" | "reject"
  ): Promise<{ status: "borrowed" | "rejected"; unitId: string }> {
    const loanRecords = await this.db
      .select()
      .from(inventoryLoans)
      .where(eq(inventoryLoans.id, loanId))
      .limit(1);

    if (!loanRecords || loanRecords.length === 0) {
      throw new Error("Peminjaman tidak ditemukan");
    }

    const loan = loanRecords[0];
    const isApprove = decision === "approve";
    const nextStatus = isApprove ? ("borrowed" as const) : ("rejected" as const);

    await this.db
      .update(inventoryLoans)
      .set({
        status: nextStatus,
        approverId,
      })
      .where(eq(inventoryLoans.id, loanId));

    if (isApprove) {
      await this.db
        .update(inventoryAssetUnits)
        .set({ status: "loaned" })
        .where(eq(inventoryAssetUnits.id, loan.unitId));
    }

    return { status: nextStatus, unitId: loan.unitId };
  }

  /**
   * Completes a return inspection, updating actual return date, condition, and freeing the asset unit.
   */
  async processReturn(
    input: ReturnInspectionInput
  ): Promise<{ status: "returned"; unitId: string }> {
    const loanRecords = await this.db
      .select()
      .from(inventoryLoans)
      .where(eq(inventoryLoans.id, input.loanId))
      .limit(1);

    if (!loanRecords || loanRecords.length === 0) {
      throw new Error("Peminjaman tidak ditemukan");
    }

    const loan = loanRecords[0];
    await this.db
      .update(inventoryLoans)
      .set({
        status: "returned",
        actualReturnDate: new Date(),
        returnCondition: input.returnCondition,
        inspectionNotes: input.inspectionNotes ?? null,
      })
      .where(eq(inventoryLoans.id, input.loanId));

    await this.db
      .update(inventoryAssetUnits)
      .set({
        status: "available",
        condition: input.returnCondition,
      })
      .where(eq(inventoryAssetUnits.id, loan.unitId));

    return { status: "returned", unitId: loan.unitId };
  }
}
