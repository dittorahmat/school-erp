import React, { useEffect, useState } from "react";
import {
  CreditCard,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string | null;
  componentName: string;
  amount: number;
  month: string | null;
  status: "unpaid" | "pending" | "paid" | "void";
  dueDate: string | null;
  paymentProofUrl: string | null;
}

interface CashTransaction {
  id: string;
  date: string;
  type: "debit" | "credit";
  category: string;
  amount: number;
  description: string;
  invoiceId?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt: string;
  runningBalance: number;
}

interface CashSummary {
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const normalized = value.length === 7 ? `${value}-15` : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${normalized}T00:00:00+07:00`));
};

export function FinanceManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"invoices" | "ledger">("invoices");

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchMonth, setBatchMonth] = useState("2026-11");
  const [generating, setGenerating] = useState(false);

  // Cash Ledger state
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [cashSummary, setCashSummary] = useState<CashSummary>({
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
  });
  const [loadingCash, setLoadingCash] = useState(false);
  const [submittingCash, setSubmittingCash] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ledgerFilter, setLedgerFilter] = useState<"all" | "manual" | "spp">("all");
  const [newCashTx, setNewCashTx] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "debit" as "debit" | "credit",
    category: "Operasional",
    amount: "",
    description: "",
  });

  const loadInvoices = async () => {
    try {
      const res = await fetch("/api/finance/invoices");
      if (!res.ok) throw new Error("Gagal mengambil data tagihan");
      const json = await res.json();
      setInvoices(json.data ?? []);
    } catch {
      setError("Gagal memuat data tagihan");
    } finally {
      setLoading(false);
    }
  };

  const loadCashTransactions = async () => {
    if (user?.role !== "admin") return;
    setLoadingCash(true);
    try {
      const res = await fetch("/api/finance/cash-transactions");
      if (!res.ok) throw new Error("Gagal mengambil data transaksi kas");
      const json = await res.json();
      setCashTransactions(json.data ?? []);
      setCashSummary(json.summary ?? { totalDebit: 0, totalCredit: 0, balance: 0 });
    } catch {
      setError("Gagal memuat transaksi buku kas");
    } finally {
      setLoadingCash(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    if (user?.role === "admin") {
      loadCashTransactions();
    }
  }, [user?.role]);

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !file) return;

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invoiceId", selectedInvoice.id);

      const res = await fetch("/api/finance/upload-proof", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal mengunggah bukti");
        return;
      }

      setMessage("Bukti pembayaran berhasil diunggah! Status kini Menunggu Verifikasi.");
      setSelectedInvoice(null);
      setFile(null);
      await loadInvoices();
    } catch {
      setError("Terjadi kesalahan saat mengunggah berkas");
    } finally {
      setUploading(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!batchMonth) return;
    setGenerating(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/finance/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: batchMonth }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal menerbitkan tagihan massal");
        return;
      }

      setMessage(
        `Penerbitan tagihan selesai: ${json.created} tagihan baru dibuat (${json.skipped} dilewati) untuk periode ${batchMonth}.`
      );
      await loadInvoices();
    } catch {
      setError("Gagal menerbitkan tagihan massal");
    } finally {
      setGenerating(false);
    }
  };

  const handleVerify = async (invoice: Invoice) => {
    setError(null);
    try {
      const res = await fetch("/api/finance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, status: "paid" }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal memverifikasi tagihan");
        return;
      }

      setMessage(`Tagihan ${invoice.id} telah diverifikasi lunas.`);
      await loadInvoices();
    } catch {
      setError("Gagal memverifikasi tagihan");
    }
  };

  const handleCreateCashTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(newCashTx.amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Nominal harus berupa angka bulat positif");
      return;
    }

    setSubmittingCash(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/finance/cash-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newCashTx.date,
          type: newCashTx.type,
          category: newCashTx.category,
          amount: amountNum,
          description: newCashTx.description,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal mencatat transaksi kas");
        return;
      }

      setMessage("Transaksi kas berhasil dicatat.");
      setNewCashTx({
        date: new Date().toISOString().slice(0, 10),
        type: "debit",
        category: "Operasional",
        amount: "",
        description: "",
      });
      await loadCashTransactions();
    } catch {
      setError("Terjadi kesalahan saat mencatat transaksi kas");
    } finally {
      setSubmittingCash(false);
    }
  };

  const handleDeleteCashTransaction = async (id: string) => {
    if (!confirm(`Hapus transaksi ${id}?`)) return;

    setDeletingId(id);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/finance/cash-transactions/${id}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal menghapus transaksi kas");
        return;
      }

      setMessage(`Transaksi kas ${id} berhasil dihapus.`);
      await loadCashTransactions();
    } catch {
      setError("Terjadi kesalahan saat menghapus transaksi");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6" data-ui>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" /> Keuangan Sekolah
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Manajemen tagihan SPP siswa dan buku kas arus kas sekolah
          </p>
        </div>

        {user?.role === "admin" && activeTab === "invoices" && (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-border shadow-xs">
            <span className="text-[11px] font-medium text-muted pl-1.5">Periode:</span>
            <input
              type="month"
              value={batchMonth}
              onChange={(e) => setBatchMonth(e.target.value)}
              className="px-2 py-1 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleBatchGenerate}
              disabled={generating || !batchMonth}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-white text-xs font-semibold rounded hover:bg-accent-strong transition disabled:opacity-50"
            >
              {generating ? "Menerbitkan..." : "Terbitkan Tagihan Massal"}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-lg w-fit border border-border">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
            activeTab === "invoices"
              ? "bg-accent-soft text-accent-ink"
              : "text-muted hover:bg-ground"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" /> Tagihan Siswa
        </button>
        {user?.role === "admin" && (
          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
              activeTab === "ledger"
                ? "bg-accent-soft text-accent-ink"
                : "text-muted hover:bg-ground"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Buku Kas / Arus Kas
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 bg-success-soft text-success-ink text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4" /> {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger-soft text-danger-ink text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Tab: Tagihan Siswa */}
      {activeTab === "invoices" && (
        <>
          {loading ? (
            <div className="p-8 text-center text-xs text-muted">Memuat tagihan...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">Belum ada tagihan.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-5 bg-white rounded-lg flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-muted">{invoice.id}</span>
                      <h4 className="font-semibold text-sm text-ink mt-0.5">
                        {invoice.componentName}
                      </h4>
                      <p className="text-xs text-muted mt-1">
                        Siswa: {invoice.studentName}
                        {invoice.classroom ? ` (${invoice.classroom})` : ""} &bull; Jatuh Tempo:{" "}
                        {formatDate(invoice.dueDate)}
                      </p>
                    </div>

                    <div>
                      {invoice.status === "paid" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-success-soft text-success-ink">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                        </span>
                      )}
                      {invoice.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-warning-soft text-warning-ink">
                          <Clock className="w-3.5 h-3.5" /> Menunggu Verifikasi
                        </span>
                      )}
                      {invoice.status === "unpaid" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-danger-soft text-danger-ink">
                          <AlertCircle className="w-3.5 h-3.5" /> Belum Dibayar
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-muted">Nominal Tagihan:</span>
                      <p className="text-lg font-bold text-ink tabular-nums">
                        Rp {invoice.amount.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {invoice.status === "unpaid" && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setFile(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-strong transition"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> Upload Bukti
                        </button>
                      )}

                      {user?.role === "admin" && invoice.status === "pending" && (
                        <button
                          onClick={() => handleVerify(invoice)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-success text-white hover:bg-success-strong transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verifikasi Lunas
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Buku Kas / Arus Kas */}
      {activeTab === "ledger" && user?.role === "admin" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Total Kas Masuk (Debit)</span>
                <span className="p-2 rounded-lg bg-success-soft text-success-ink">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-success mt-2 tabular-nums">
                Rp {cashSummary.totalDebit.toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-muted mt-1">Akumulasi penerimaan kas sekolah</p>
            </div>

            <div className="bg-white rounded-lg p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Total Kas Keluar (Kredit)</span>
                <span className="p-2 rounded-lg bg-danger-soft text-danger-ink">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-danger mt-2 tabular-nums">
                Rp {cashSummary.totalCredit.toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-muted mt-1">Akumulasi pengeluaran kas sekolah</p>
            </div>

            <div className="bg-white rounded-lg p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Saldo Kas Saat Ini</span>
                <span className="p-2 rounded-lg bg-accent-soft text-accent-ink">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-ink mt-2 tabular-nums">
                Rp {cashSummary.balance.toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-muted mt-1">Selisih total debit dan kredit</p>
            </div>
          </div>

          {/* Form Tambah Transaksi */}
          <div className="bg-white rounded-lg p-5">
            <h4 className="text-sm font-bold text-ink mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-accent" /> Tambah Transaksi Kas Baru
            </h4>
            <form onSubmit={handleCreateCashTransaction} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={newCashTx.date}
                  onChange={(e) => setNewCashTx({ ...newCashTx, date: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Tipe Mutasi</label>
                <select
                  value={newCashTx.type}
                  onChange={(e) => setNewCashTx({ ...newCashTx, type: e.target.value as "debit" | "credit" })}
                  className="w-full px-2.5 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="debit">Debit (Kas Masuk)</option>
                  <option value="credit">Kredit (Kas Keluar)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operasional, ATK, SPP"
                  value={newCashTx.category}
                  onChange={(e) => setNewCashTx({ ...newCashTx, category: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 500000"
                  value={newCashTx.amount}
                  onChange={(e) => setNewCashTx({ ...newCashTx, amount: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-semibold text-muted mb-1">Deskripsi</label>
                <input
                  type="text"
                  required
                  placeholder="Keterangan lengkap transaksi..."
                  value={newCashTx.description}
                  onChange={(e) => setNewCashTx({ ...newCashTx, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submittingCash}
                  className="w-full py-1.5 px-3 bg-accent hover:bg-accent-strong text-white text-xs font-semibold rounded transition disabled:opacity-50"
                >
                  {submittingCash ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>

          {/* Tabel Buku Kas */}
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-ink">Catatan Transaksi Buku Kas</h4>
                <span className="text-xs text-muted tabular-nums">
                  Menampilkan {cashTransactions.filter((tx) => {
                    if (ledgerFilter === "spp") return Boolean(tx.invoiceId);
                    if (ledgerFilter === "manual") return !tx.invoiceId;
                    return true;
                  }).length} dari {cashTransactions.length} transaksi
                </span>
              </div>

              {/* Filter Sumber Transaksi */}
              <div className="flex items-center gap-1 bg-ground p-1 rounded-md text-xs font-medium text-muted">
                <button
                  type="button"
                  onClick={() => setLedgerFilter("all")}
                  className={`px-2.5 py-1 rounded transition ${
                    ledgerFilter === "all"
                      ? "bg-white text-ink font-semibold"
                      : "hover:text-ink"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerFilter("manual")}
                  className={`px-2.5 py-1 rounded transition ${
                    ledgerFilter === "manual"
                      ? "bg-white text-ink font-semibold"
                      : "hover:text-ink"
                  }`}
                >
                  Manual / Operasional
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerFilter("spp")}
                  className={`px-2.5 py-1 rounded transition ${
                    ledgerFilter === "spp"
                      ? "bg-white text-ink font-semibold"
                      : "hover:text-ink"
                  }`}
                >
                  Otomatis SPP
                </button>
              </div>
            </div>

            {loadingCash ? (
              <div className="p-8 text-center text-xs text-muted">Memuat data buku kas...</div>
            ) : cashTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">Belum ada catatan transaksi buku kas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-ink">
                  <thead className="bg-ground text-muted text-[11px] uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Tanggal</th>
                      <th className="px-4 py-2.5">Tipe</th>
                      <th className="px-4 py-2.5">Kategori</th>
                      <th className="px-4 py-2.5">Deskripsi</th>
                      <th className="px-4 py-2.5 text-right">Debit (Masuk)</th>
                      <th className="px-4 py-2.5 text-right">Kredit (Keluar)</th>
                      <th className="px-4 py-2.5 text-right">Saldo Berjalan</th>
                      <th className="px-4 py-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashTransactions
                      .filter((tx) => {
                        if (ledgerFilter === "spp") return Boolean(tx.invoiceId);
                        if (ledgerFilter === "manual") return !tx.invoiceId;
                        return true;
                      })
                      .map((tx) => (
                      <tr key={tx.id} className="hover:bg-ground transition">
                        <td className="px-4 py-3 whitespace-nowrap text-muted">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {tx.type === "debit" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-success-soft text-success-ink">
                              <ArrowDownLeft className="w-3 h-3" /> Debit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-danger-soft text-danger-ink">
                              <ArrowUpRight className="w-3 h-3" /> Kredit
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-ink-soft">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{tx.category}</span>
                            {tx.invoiceId && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-info-soft text-info-ink">
                                Otomatis SPP
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink max-w-xs truncate">
                          {tx.description}
                          {tx.createdByName && (
                            <span className="block text-[10px] text-muted">Oleh: {tx.createdByName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-success whitespace-nowrap">
                          {tx.type === "debit" ? `Rp ${tx.amount.toLocaleString("id-ID")}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-danger whitespace-nowrap">
                          {tx.type === "credit" ? `Rp ${tx.amount.toLocaleString("id-ID")}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-ink whitespace-nowrap">
                          Rp {tx.runningBalance.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteCashTransaction(tx.id)}
                            disabled={deletingId === tx.id}
                            title="Hapus Transaksi"
                            className="p-1 text-muted hover:text-danger hover:bg-danger-soft rounded transition disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Bukti Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-ink">Upload Bukti Transfer</h4>
            <p className="text-xs text-muted">
              Tagihan: {selectedInvoice.componentName} &bull; Periode: {selectedInvoice.month} (Rp{" "}
              {selectedInvoice.amount.toLocaleString("id-ID")})
            </p>

            <form onSubmit={handleUploadProof} className="space-y-4">
              <label
                htmlFor="proof-upload"
                className="block p-6 bg-ground rounded text-center cursor-pointer"
              >
                <UploadCloud className="w-6 h-6 text-faint mx-auto mb-2" />
                <p className="text-xs text-ink font-medium">
                  {file ? file.name : "Klik untuk memilih gambar struk/bukti transfer"}
                </p>
                <p className="text-[11px] text-muted mt-0.5">PNG, JPG atau PDF maks 5MB</p>
                <input
                  type="file"
                  className="hidden"
                  id="proof-upload"
                  accept="image/*,.pdf"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoice(null);
                    setFile(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="px-3.5 py-1.5 text-xs font-medium bg-accent hover:bg-accent-strong text-white rounded transition disabled:opacity-50"
                >
                  {uploading ? "Mengunggah..." : "Kirim Bukti Bayar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
