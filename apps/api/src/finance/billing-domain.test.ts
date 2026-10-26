import { describe, expect, it } from "vitest";
import { BillingSettlement, BillingDomainError } from "./billing";

class InMemoryBillingAdapter {
  academicYears: any[] = [];
  feeComponents: any[] = [];
  studentEnrollments: any[] = [];
  invoices: any[] = [];
  cashTransactions: any[] = [];
  users: any[] = [];

  select(fields?: any) {
    const self = this;
    return {
      from(table: any) {
        return {
          leftJoin(otherTable: any, clause: any) {
            return this;
          },
          where(clause: any) {
            return {
              async limit(n: number) {
                const tableName = table?.[Symbol.for("drizzle:Name")] || "";
                if (tableName.includes("academic_years")) return self.academicYears.slice(0, n);
                if (tableName.includes("fee_components")) return self.feeComponents.slice(0, n);
                if (tableName.includes("invoices")) {
                  return self.invoices.map((inv) => {
                    const u = self.users.find((user) => user.id === inv.studentId);
                    return { ...inv, studentName: u?.fullName ?? null };
                  }).slice(0, n);
                }
                return [];
              },
              then(resolve: any) {
                const tableName = table?.[Symbol.for("drizzle:Name")] || "";
                if (tableName.includes("student_enrollments")) {
                  return Promise.resolve(self.studentEnrollments).then(resolve);
                }
                if (tableName.includes("invoices")) {
                  return Promise.resolve(self.invoices).then(resolve);
                }
                return Promise.resolve([]).then(resolve);
              },
            };
          },
        };
      },
    };
  }

  insert(table: any) {
    const self = this;
    return {
      async values(val: any) {
        const tableName = table?.[Symbol.for("drizzle:Name")] || "";
        const items = Array.isArray(val) ? val : [val];
        if (tableName.includes("invoices")) {
          self.invoices.push(...items);
        } else if (tableName.includes("cash_transactions")) {
          self.cashTransactions.push(...items);
        }
        return val;
      },
    };
  }

  update(table: any) {
    const self = this;
    return {
      set(val: any) {
        return {
          async where(clause: any) {
            const tableName = table?.[Symbol.for("drizzle:Name")] || "";
            if (tableName.includes("invoices")) {
              for (const inv of self.invoices) {
                Object.assign(inv, val);
              }
            }
            return [];
          },
        };
      },
    };
  }

  delete(table: any) {
    const self = this;
    return {
      async where(clause: any) {
        const tableName = table?.[Symbol.for("drizzle:Name")] || "";
        if (tableName.includes("cash_transactions")) {
          self.cashTransactions = [];
        }
        return [];
      },
    };
  }
}

describe("BillingSettlement Domain Module (Unit Tests)", () => {
  it("settles invoice and auto-creates debit cash transaction", async () => {
    const adapter = new InMemoryBillingAdapter();
    adapter.invoices = [{ id: "inv_1", studentId: "usr_student_1", amount: 250000, month: "2026-10", status: "unpaid" }];
    adapter.users = [{ id: "usr_student_1", fullName: "Budi Santoso" }];

    const billing = new BillingSettlement(adapter as any);
    const result = await billing.settleInvoice({
      invoiceId: "inv_1",
      status: "paid",
      verifiedBy: "usr_admin",
    });

    expect(result.status).toBe("paid");
    expect(adapter.invoices[0].status).toBe("paid");
    expect(adapter.cashTransactions.length).toBe(1);
    expect(adapter.cashTransactions[0].type).toBe("debit");
    expect(adapter.cashTransactions[0].amount).toBe(250000);
    expect(adapter.cashTransactions[0].category).toBe("SPP");
  });

  it("removes cash transaction when status changes back to unpaid", async () => {
    const adapter = new InMemoryBillingAdapter();
    adapter.invoices = [{ id: "inv_1", studentId: "usr_student_1", amount: 250000, month: "2026-10", status: "paid" }];
    adapter.cashTransactions = [{ id: "ctx_1", invoiceId: "inv_1", amount: 250000 }];

    const billing = new BillingSettlement(adapter as any);
    const result = await billing.settleInvoice({
      invoiceId: "inv_1",
      status: "unpaid",
    });

    expect(result.status).toBe("unpaid");
    expect(adapter.cashTransactions.length).toBe(0);
  });

  it("generates batch invoices for enrolled students without duplicates", async () => {
    const adapter = new InMemoryBillingAdapter();
    adapter.academicYears = [{ id: "ay_2026", isActive: true }];
    adapter.feeComponents = [{ id: "fee_spp", amount: 300000 }];
    adapter.studentEnrollments = [
      { studentId: "usr_student_1", academicYearId: "ay_2026" },
      { studentId: "usr_student_2", academicYearId: "ay_2026" },
    ];
    adapter.invoices = [
      { id: "inv_old", studentId: "usr_student_1", academicYearId: "ay_2026", feeComponentId: "fee_spp", month: "2026-11" },
    ];

    const billing = new BillingSettlement(adapter as any);
    const result = await billing.generateBatchInvoices({
      month: "2026-11",
      componentId: "fee_spp",
    });

    expect(result.generatedCount).toBe(1);
    expect(adapter.invoices.length).toBe(2);
    expect(adapter.invoices[1].studentId).toBe("usr_student_2");
  });
});
