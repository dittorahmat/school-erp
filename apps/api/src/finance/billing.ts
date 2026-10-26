import {
  academicYears,
  cashTransactions,
  eq,
  feeComponents,
  invoices,
  studentEnrollments,
  users,
} from "@school-erp/db";

export interface BillingDatabaseAdapter {
  select(fields?: any): any;
  insert(table: any): { values(val: any): Promise<any> };
  update(table: any): { set(val: any): { where(clause: any): Promise<any> } };
  delete(table: any): { where(clause: any): Promise<any> };
}

export interface BatchGenerateInput {
  month: string;
  componentId?: string;
  amount?: number;
}

export interface BatchGenerateResult {
  generatedCount: number;
  message: string;
}

export interface SettleInvoiceInput {
  invoiceId: string;
  status: "paid" | "unpaid";
  verifiedBy?: string | null;
}

export interface SettleInvoiceResult {
  invoiceId: string;
  status: "paid" | "unpaid";
  message: string;
}

export class BillingDomainError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "BillingDomainError";
  }
}

/**
 * Deep domain module: BillingSettlement
 * Encapsulates invoice batch generation and payment settlement with
 * automated double-entry cash ledger posting.
 */
export class BillingSettlement {
  constructor(private db: BillingDatabaseAdapter) {}

  /**
   * Generates batch invoices for all enrolled students in the active academic year.
   */
  async generateBatchInvoices(input: BatchGenerateInput): Promise<BatchGenerateResult> {
    const componentId = input.componentId ?? "fee_spp";
    const { month, amount } = input;

    const activeYears = await this.db
      .select()
      .from(academicYears)
      .where(eq(academicYears.isActive, true))
      .limit(1);

    const yearId = activeYears[0]?.id;
    if (!yearId) {
      throw new BillingDomainError("Tahun ajaran aktif belum ditetapkan", 400);
    }

    const components = await this.db
      .select()
      .from(feeComponents)
      .where(eq(feeComponents.id, componentId))
      .limit(1);

    const component = components[0];
    if (!component) {
      throw new BillingDomainError(`Komponen biaya ${componentId} tidak ditemukan`, 404);
    }

    const enrolledStudents = await this.db
      .select({
        studentId: studentEnrollments.studentId,
      })
      .from(studentEnrollments)
      .where(eq(studentEnrollments.academicYearId, yearId));

    const studentIds = [...new Set(enrolledStudents.map((s: { studentId: string }) => s.studentId))] as string[];
    if (studentIds.length === 0) {
      throw new BillingDomainError("Tidak ada siswa terdaftar pada tahun ajaran aktif", 400);
    }

    const existingInvoices = await this.db
      .select({
        studentId: invoices.studentId,
      })
      .from(invoices)
      .where(eq(invoices.academicYearId, yearId));

    const billedStudentIds = new Set(
      existingInvoices
        .filter((inv: any) => (!inv.feeComponentId || inv.feeComponentId === componentId) && inv.month === month)
        .map((inv: any) => inv.studentId)
    );

    const targetStudentIds = studentIds.filter((id) => !billedStudentIds.has(id));

    if (targetStudentIds.length === 0) {
      return {
        message: "Semua siswa sudah memiliki tagihan untuk periode dan komponen ini",
        generatedCount: 0,
      };
    }

    const newInvoices = targetStudentIds.map((studentId) => {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const id = `inv_${month.replace("-", "")}_${studentId.replace("usr_", "")}_${randomSuffix}`;
      return {
        id,
        studentId,
        academicYearId: yearId,
        feeComponentId: componentId,
        month,
        amount: amount ?? component.amount,
        status: "unpaid" as const,
        createdAt: new Date(),
      };
    });

    await this.db.insert(invoices).values(newInvoices);

    return {
      message: `Berhasil membuat ${newInvoices.length} tagihan untuk periode ${month}`,
      generatedCount: newInvoices.length,
    };
  }

  /**
   * Settles an invoice as paid or marks as unpaid, keeping cash transactions synchronized.
   */
  async settleInvoice(input: SettleInvoiceInput): Promise<SettleInvoiceResult> {
    const existing = await this.db
      .select({
        id: invoices.id,
        amount: invoices.amount,
        month: invoices.month,
        studentId: invoices.studentId,
        studentName: users.fullName,
      })
      .from(invoices)
      .leftJoin(users, eq(invoices.studentId, users.id))
      .where(eq(invoices.id, input.invoiceId))
      .limit(1);

    const inv = existing[0];
    if (!inv) {
      throw new BillingDomainError("Tagihan tidak ditemukan", 404);
    }

    await this.db
      .update(invoices)
      .set({
        status: input.status,
        paidAt: input.status === "paid" ? new Date() : null,
      })
      .where(eq(invoices.id, input.invoiceId));

    if (input.status === "paid") {
      // Clean up previous cash transaction to avoid duplicate double entries
      await this.db.delete(cashTransactions).where(eq(cashTransactions.invoiceId, inv.id));

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const studentName = inv.studentName || inv.studentId;
      const description = `Pembayaran SPP - ${inv.month ?? "Tagihan"} (${studentName})`;

      await this.db.insert(cashTransactions).values({
        id: `ctx_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
        date: dateStr,
        type: "debit",
        category: "SPP",
        amount: inv.amount,
        description,
        invoiceId: inv.id,
        createdBy: input.verifiedBy ?? null,
        createdAt: now,
      });
    } else if (input.status === "unpaid") {
      // Revert associated cash transaction
      await this.db.delete(cashTransactions).where(eq(cashTransactions.invoiceId, inv.id));
    }

    return {
      invoiceId: input.invoiceId,
      status: input.status,
      message: `Status tagihan ${input.invoiceId} berhasil diubah menjadi ${input.status}`,
    };
  }
}
