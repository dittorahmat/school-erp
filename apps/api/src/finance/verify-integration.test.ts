import { describe, expect, it } from "vitest";
import { app } from "../index";
import { signJwt } from "../auth/crypto";
import { createFakeD1 } from "../testing/fake-d1";

const SECRET = "finance-test-secret";

async function adminToken() {
  return signJwt(
    {
      sub: "usr_admin_1",
      username: "admin",
      fullName: "Admin TU",
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    SECRET
  );
}

describe("POST /api/finance/verify cash ledger integration", () => {
  it("creates a cash transaction on verify status paid, and deletes it on verify unpaid", async () => {
    const executedSqls: string[] = [];
    const insertedRows: Array<Record<string, unknown>> = [];
    let invoiceStatus = "unpaid";

    const fakeD1 = createFakeD1((sql) => {
      executedSqls.push(sql);

      // User exists check for isEmptyDatabase
      if (sql.includes('"users"')) {
        return [{ id: "usr_admin_1" }];
      }

      // Invoice lookup
      if (sql.includes('"invoices"')) {
        return [
          {
            id: "INV-2026-10-001",
            status: invoiceStatus,
            amount: 350000,
            month: "2026-10",
            studentId: "usr_student_1",
            studentName: "Ahmad Fauzi",
          },
        ];
      }

      return [];
    });

    const token = await adminToken();
    const env = {
      DB: fakeD1,
      STORAGE: undefined,
      JWT_SECRET: SECRET,
      ENVIRONMENT: "test",
    };

    // 1. Verify payment to paid
    const verifyPaidRes = await app.request(
      "/api/finance/verify",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: "INV-2026-10-001",
          status: "paid",
        }),
      },
      env
    );

    expect(verifyPaidRes.status).toBe(200);
    const paidBody = (await verifyPaidRes.json()) as { status: string; invoiceId: string };
    expect(paidBody.status).toBe("paid");
    expect(paidBody.invoiceId).toBe("INV-2026-10-001");

    // Proves insert into cash_transactions was executed
    const hasCashInsert = executedSqls.some(
      (sql) => sql.includes("insert into `cash_transactions`") || sql.includes('"cash_transactions"')
    );
    expect(hasCashInsert).toBe(true);

    // 2. Verify payment back to unpaid (rollback)
    invoiceStatus = "paid";
    executedSqls.length = 0;

    const verifyUnpaidRes = await app.request(
      "/api/finance/verify",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: "INV-2026-10-001",
          status: "unpaid",
        }),
      },
      env
    );

    expect(verifyUnpaidRes.status).toBe(200);
    const unpaidBody = (await verifyUnpaidRes.json()) as { status: string; invoiceId: string };
    expect(unpaidBody.status).toBe("unpaid");

    // Proves delete from cash_transactions was executed
    const hasCashDelete = executedSqls.some(
      (sql) => sql.includes("delete from `cash_transactions`") || (sql.includes("delete") && sql.includes("cash_transactions"))
    );
    expect(hasCashDelete).toBe(true);
  });
});
