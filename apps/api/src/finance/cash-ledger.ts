export interface CashTransactionItem {
  id: string;
  date: string;
  type: "debit" | "credit";
  category: string;
  amount: number;
  description: string;
  invoiceId?: string | null;
  createdBy?: string | null;
  createdAt: Date | string | number;
}

export interface CashTransactionWithBalance extends CashTransactionItem {
  runningBalance: number;
}

export interface CashLedgerSummary {
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface CashLedgerResult {
  transactions: CashTransactionWithBalance[];
  summary: CashLedgerSummary;
}

/**
 * Calculates summary metrics (totalDebit, totalCredit, balance) for cash transactions.
 */
export function calculateCashSummary(transactions: CashTransactionItem[]): CashLedgerSummary {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const tx of transactions) {
    if (tx.type === "debit") {
      totalDebit += tx.amount;
    } else if (tx.type === "credit") {
      totalCredit += tx.amount;
    }
  }

  return {
    totalDebit,
    totalCredit,
    balance: totalDebit - totalCredit,
  };
}

/**
 * Calculates running balance for chronological transactions, sorted ascending by date/createdAt,
 * then returns the transactions with running balance.
 *
 * Running balance formula:
 * - Start balance = 0
 * - Debit increases balance (+ amount)
 * - Credit decreases balance (- amount)
 */
export function calculateRunningBalances<T extends CashTransactionItem>(
  transactions: T[]
): (T & { runningBalance: number })[] {
  // Sort chronologically ascending (oldest first) to compute running balance
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeA - timeB;
  });

  let currentBalance = 0;
  const withBalance = sorted.map((tx) => {
    if (tx.type === "debit") {
      currentBalance += tx.amount;
    } else if (tx.type === "credit") {
      currentBalance -= tx.amount;
    }
    return {
      ...tx,
      runningBalance: currentBalance,
    };
  });

  return withBalance;
}

/**
 * Processes a list of transactions to return both transactions with running balance
 * and the ledger summary.
 * If reverseForDisplay is true, returns transactions in reverse chronological order (newest first)
 * while preserving the correct running balance each transaction had at its point in time.
 */
export function processCashLedger<T extends CashTransactionItem>(
  transactions: T[],
  options?: { reverseForDisplay?: boolean }
): { transactions: (T & { runningBalance: number })[]; summary: CashLedgerSummary } {
  const summary = calculateCashSummary(transactions);
  const withBalances = calculateRunningBalances(transactions);

  if (options?.reverseForDisplay) {
    withBalances.reverse();
  }

  return {
    transactions: withBalances,
    summary,
  };
}
