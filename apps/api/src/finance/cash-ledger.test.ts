import { describe, expect, it } from "vitest";
import {
  calculateCashSummary,
  calculateRunningBalances,
  processCashLedger,
  type CashTransactionItem,
} from "./cash-ledger";

describe("Cash Ledger Domain Module", () => {
  const sampleTransactions: CashTransactionItem[] = [
    {
      id: "tx-1",
      date: "2026-10-01",
      type: "debit",
      category: "SPP",
      amount: 1000000,
      description: "Kas masuk SPP",
      createdAt: new Date("2026-10-01T08:00:00Z"),
    },
    {
      id: "tx-2",
      date: "2026-10-02",
      type: "credit",
      category: "ATK",
      amount: 200000,
      description: "Beli kertas",
      createdAt: new Date("2026-10-02T09:00:00Z"),
    },
    {
      id: "tx-3",
      date: "2026-10-03",
      type: "debit",
      category: "Donasi",
      amount: 500000,
      description: "Donasi alumni",
      createdAt: new Date("2026-10-03T10:00:00Z"),
    },
    {
      id: "tx-4",
      date: "2026-10-04",
      type: "credit",
      category: "Listrik",
      amount: 300000,
      description: "Bayar listrik",
      createdAt: new Date("2026-10-04T11:00:00Z"),
    },
  ];

  describe("calculateCashSummary", () => {
    it("returns zero metrics for empty transactions list", () => {
      const summary = calculateCashSummary([]);
      expect(summary).toEqual({
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
      });
    });

    it("correctly sums debit and credit amounts and calculates net balance", () => {
      const summary = calculateCashSummary(sampleTransactions);
      expect(summary.totalDebit).toBe(1500000);
      expect(summary.totalCredit).toBe(500000);
      expect(summary.balance).toBe(1000000);
    });

    it("handles only credit transactions (negative balance)", () => {
      const creditOnly: CashTransactionItem[] = [
        {
          id: "tx-c1",
          date: "2026-10-01",
          type: "credit",
          category: "Operasional",
          amount: 50000,
          description: "Biaya materai",
          createdAt: new Date("2026-10-01T08:00:00Z"),
        },
      ];
      const summary = calculateCashSummary(creditOnly);
      expect(summary.totalDebit).toBe(0);
      expect(summary.totalCredit).toBe(50000);
      expect(summary.balance).toBe(-50000);
    });
  });

  describe("calculateRunningBalances", () => {
    it("computes accurate running balance in chronological order", () => {
      const result = calculateRunningBalances(sampleTransactions);
      expect(result).toHaveLength(4);
      expect(result[0].id).toBe("tx-1");
      expect(result[0].runningBalance).toBe(1000000);

      expect(result[1].id).toBe("tx-2");
      expect(result[1].runningBalance).toBe(800000); // 1000000 - 200000

      expect(result[2].id).toBe("tx-3");
      expect(result[2].runningBalance).toBe(1300000); // 800000 + 500000

      expect(result[3].id).toBe("tx-4");
      expect(result[3].runningBalance).toBe(1000000); // 1300000 - 300000
    });

    it("sorts correctly even if given unordered transactions", () => {
      const unordered: CashTransactionItem[] = [
        sampleTransactions[3],
        sampleTransactions[0],
        sampleTransactions[2],
        sampleTransactions[1],
      ];
      const result = calculateRunningBalances(unordered);
      expect(result.map((r) => r.id)).toEqual(["tx-1", "tx-2", "tx-3", "tx-4"]);
      expect(result.map((r) => r.runningBalance)).toEqual([1000000, 800000, 1300000, 1000000]);
    });

    it("sorts by createdAt when date is identical", () => {
      const sameDate: CashTransactionItem[] = [
        {
          id: "tx-b",
          date: "2026-10-01",
          type: "credit",
          category: "Konsumsi",
          amount: 50000,
          description: "Snack sore",
          createdAt: new Date("2026-10-01T15:00:00Z"),
        },
        {
          id: "tx-a",
          date: "2026-10-01",
          type: "debit",
          category: "SPP",
          amount: 200000,
          description: "SPP pagi",
          createdAt: new Date("2026-10-01T08:00:00Z"),
        },
      ];
      const result = calculateRunningBalances(sameDate);
      expect(result[0].id).toBe("tx-a");
      expect(result[0].runningBalance).toBe(200000);
      expect(result[1].id).toBe("tx-b");
      expect(result[1].runningBalance).toBe(150000);
    });
  });

  describe("processCashLedger", () => {
    it("returns summary and transactions", () => {
      const { summary, transactions } = processCashLedger(sampleTransactions);
      expect(summary.balance).toBe(1000000);
      expect(transactions).toHaveLength(4);
      expect(transactions[0].id).toBe("tx-1");
    });

    it("reverses order for display when requested (newest first) but keeps original running balances", () => {
      const { transactions } = processCashLedger(sampleTransactions, { reverseForDisplay: true });
      expect(transactions[0].id).toBe("tx-4");
      expect(transactions[0].runningBalance).toBe(1000000);

      expect(transactions[1].id).toBe("tx-3");
      expect(transactions[1].runningBalance).toBe(1300000);

      expect(transactions[2].id).toBe("tx-2");
      expect(transactions[2].runningBalance).toBe(800000);

      expect(transactions[3].id).toBe("tx-1");
      expect(transactions[3].runningBalance).toBe(1000000);
    });
  });
});
