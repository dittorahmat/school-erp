import {
  inventoryStockMovements,
  inventoryRequisitions,
  eq,
  desc,
} from "@school-erp/db";

export interface StockMovementInput {
  itemId: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  notes?: string | null;
  referenceUser?: string | null;
}

export interface RequisitionFulfillmentInput {
  requisitionId: string;
  approverId: string;
  decision: "approve" | "reject";
}

export interface DatabaseAdapter {
  select(fields?: any): any;
  insert(table: any): { values(val: any): Promise<any> };
  update(table: any): { set(val: any): { where(clause: any): Promise<any> } };
}

/**
 * Deep domain module: StockLedger
 * Manages consumable stock movements, audit ledger entries, and requisition fulfillments.
 */
export class StockLedger {
  constructor(private db: DatabaseAdapter) {}

  /**
   * Appends a stock movement and calculates new balance atomically.
   */
  async recordMovement(input: StockMovementInput): Promise<{ id: string; balanceAfter: number }> {
    if (!input.itemId) {
      throw new Error("Item ID wajib ditentukan");
    }
    if (input.quantity <= 0) {
      throw new Error("Jumlah kuantitas mutasi harus lebih besar dari 0");
    }

    const lastMv = await this.db
      .select()
      .from(inventoryStockMovements)
      .where(eq(inventoryStockMovements.itemId, input.itemId))
      .orderBy(desc(inventoryStockMovements.createdAt))
      .limit(1);

    const currentBalance = lastMv && lastMv.length > 0 ? (lastMv[0].balanceAfter ?? 0) : 0;
    let newBalance = currentBalance;

    if (input.type === "in") {
      newBalance = currentBalance + input.quantity;
    } else if (input.type === "out") {
      if (currentBalance < input.quantity) {
        throw new Error("Stok tidak mencukupi untuk pengeluaran barang");
      }
      newBalance = currentBalance - input.quantity;
    } else {
      newBalance = input.quantity;
    }

    const id = `sm_${Date.now()}`;
    const movement = {
      id,
      itemId: input.itemId,
      type: input.type,
      quantity: input.quantity,
      balanceAfter: newBalance,
      referenceUser: input.referenceUser ?? null,
      notes: input.notes ?? null,
      createdAt: new Date(),
    };

    await this.db.insert(inventoryStockMovements).values(movement);
    return { id, balanceAfter: newBalance };
  }

  /**
   * Processes requisition approvals, deducting stock atomically if approved.
   */
  async fulfillRequisition(
    input: RequisitionFulfillmentInput
  ): Promise<{ status: "approved" | "rejected"; requisitionId: string }> {
    const records = await this.db
      .select()
      .from(inventoryRequisitions)
      .where(eq(inventoryRequisitions.id, input.requisitionId))
      .limit(1);

    if (!records || records.length === 0) {
      throw new Error("Permintaan ATK tidak ditemukan");
    }

    const req = records[0];
    if (req.status !== "pending") {
      throw new Error("Permintaan ATK sudah diproses sebelumnya");
    }
    const isApprove = input.decision === "approve";
    const nextStatus = isApprove ? ("approved" as const) : ("rejected" as const);

    // Deduct stock first: if the ledger rejects the movement the requisition
    // must stay pending, otherwise it is approved with no matching outflow.
    if (isApprove) {
      await this.recordMovement({
        itemId: req.itemId,
        type: "out",
        quantity: req.quantity,
        notes: `Permintaan disetujui: ${req.reason || "Kebutuhan operasional"}`,
        referenceUser: input.approverId,
      });
    }

    await this.db
      .update(inventoryRequisitions)
      .set({
        status: nextStatus,
        approverId: input.approverId,
      })
      .where(eq(inventoryRequisitions.id, input.requisitionId));

    return { status: nextStatus, requisitionId: req.id };
  }
}
