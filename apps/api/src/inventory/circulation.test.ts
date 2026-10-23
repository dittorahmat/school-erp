import { describe, it, expect, vi } from "vitest";
import { AssetCirculation } from "./circulation";
import { StockLedger } from "./ledger";

describe("AssetCirculation Deep Module", () => {
  it("should create a pending loan request through the interface", async () => {
    const mockDb = {
      select: vi.fn(),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(true) }),
      update: vi.fn(),
    };

    const circulation = new AssetCirculation(mockDb);
    const result = await circulation.requestLoan({
      unitId: "unit_123",
      borrowerId: "user_456",
      expectedReturnDate: new Date("2026-10-30"),
      purpose: "Praktikum Lab",
    });

    expect(result.status).toBe("pending");
    expect(result.id).toMatch(/^loan_/);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("should approve loan and transition unit to loaned atomically", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "loan_1", unitId: "unit_1", status: "pending" }]),
          }),
        }),
      }),
      insert: vi.fn(),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(true),
        }),
      }),
    };

    const circulation = new AssetCirculation(mockDb);
    const result = await circulation.processApproval("loan_1", "admin_1", "approve");

    expect(result.status).toBe("borrowed");
    expect(result.unitId).toBe("unit_1");
    expect(mockDb.update).toHaveBeenCalledTimes(2); // updates loan + asset unit
  });

  it("should complete return inspection and transition unit back to available", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "loan_1", unitId: "unit_1", status: "borrowed" }]),
          }),
        }),
      }),
      insert: vi.fn(),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(true),
        }),
      }),
    };

    const circulation = new AssetCirculation(mockDb);
    const result = await circulation.processReturn({
      loanId: "loan_1",
      returnCondition: "good",
      inspectionNotes: "Semua komponen lengkap",
    });

    expect(result.status).toBe("returned");
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });
});

describe("StockLedger Deep Module", () => {
  it("should record movement with validated quantity", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ balanceAfter: 10 }]),
            }),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(true) }),
      update: vi.fn(),
    };

    const ledger = new StockLedger(mockDb);
    const result = await ledger.recordMovement({
      itemId: "item_1",
      type: "in",
      quantity: 50,
      notes: "Restock kertas HVS",
    });

    expect(result.id).toMatch(/^sm_/);
    expect(result.balanceAfter).toBe(60);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("should throw error if quantity is zero or negative", async () => {
    const mockDb = { select: vi.fn(), insert: vi.fn(), update: vi.fn() };
    const ledger = new StockLedger(mockDb);

    await expect(
      ledger.recordMovement({
        itemId: "item_1",
        type: "in",
        quantity: 0,
      })
    ).rejects.toThrow("Jumlah kuantitas mutasi harus lebih besar dari 0");
  });

  it("should deduct stock movement automatically upon requisition approval", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ balanceAfter: 20 }]),
            }),
            limit: vi.fn().mockResolvedValue([
              { id: "req_1", itemId: "item_spidol", quantity: 5, purpose: "Ujian Semester" },
            ]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(true) }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(true),
        }),
      }),
    };

    const ledger = new StockLedger(mockDb);
    const result = await ledger.fulfillRequisition({
      requisitionId: "req_1",
      approverId: "admin_tu",
      decision: "approve",
    });

    expect(result.status).toBe("approved");
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled(); // automatically recorded out-movement
  });
});
