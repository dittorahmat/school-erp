import React, { useEffect, useState } from "react";
import {
  CreditCard,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  FileText,
  DollarSign,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
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

interface FeeComponent {
  id: string;
  name: string;
  amount: number;
  gradeLevel?: number | null;
  academicYearId?: string | null;
  isRecurring?: boolean;
}

interface StudentOption {
  id: string;
  fullName: string;
  username: string;
  currentClassroom?: string | null;
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
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"invoices" | "tariffs" | "ledger">("invoices");

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fee components state
  const [feeComponents, setFeeComponents] = useState<FeeComponent[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);

  // Modal Component Create / Edit
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<FeeComponent | null>(null);
  const [compName, setCompName] = useState("");
  const [compAmount, setCompAmount] = useState("");
  const [compGradeLevel, setCompGradeLevel] = useState<string>("all");
  const [submittingComponent, setSubmittingComponent] = useState(false);

  // Delete Component Modal
  const [deletingComponent, setDeletingComponent] = useState<FeeComponent | null>(null);

  // Modal Manual Invoice
  const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedFeeCompId, setSelectedFeeCompId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceMonth, setInvoiceMonth] = useState(new Date().toISOString().slice(0, 7));
  const [invoiceDueDate, setInvoiceDueDate] = useState(`${new Date().toISOString().slice(0, 7)}-15`);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Batch generate state
  const [batchMonth, setBatchMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generatingBatch, setGeneratingBatch] = useState(false);

  // Cash Ledger state
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [cashSummary, setCashSummary] = useState<CashSummary>({
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
  });
  const [loadingCash, setLoadingCash] = useState(false);
  const [submittingCash, setSubmittingCash] = useState(false);
  const [deletingCashId, setDeletingCashId] = useState<string | null>(null);
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
      if (res.ok) {
        const json = await res.json();
        setInvoices(json.data || []);
      } else {
        setError("Gagal memuat tagihan");
      }
    } catch {
      setError("Gagal memuat tagihan");
    } finally {
      setLoading(false);
    }
  };

  const loadFeeComponents = async () => {
    setLoadingComponents(true);
    try {
      const res = await fetch("/api/finance/fee-components");
      if (res.ok) {
        const json = await res.json();
        setFeeComponents(json.data || []);
      }
    } catch {
      // fallback silent
    } finally {
      setLoadingComponents(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await fetch("/api/academic/students");
      if (res.ok) {
        const json = await res.json();
        setStudents(json.data || []);
      }
    } catch {
      // fallback silent
    }
  };

  const loadCashTransactions = async () => {
    if (!isAdmin) return;
    setLoadingCash(true);
    try {
      const res = await fetch("/api/finance/cash-transactions");
      if (res.ok) {
        const json = await res.json();
        setCashTransactions(json.data || []);
        setCashSummary(json.summary || { totalDebit: 0, totalCredit: 0, balance: 0 });
      }
    } catch {
      // silent
    } finally {
      setLoadingCash(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    if (isAdmin) {
      loadFeeComponents();
      loadStudents();
      loadCashTransactions();
    }
  }, [isAdmin]);

  const handleUploadProof = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedInvoice || !file) {
      setError("Pilih berkas bukti transfer terlebih dahulu");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("invoiceId", selectedInvoice.id);
      formData.append("proof", file);

      const res = await fetch("/api/finance/upload-proof", {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal mengunggah bukti bayar");
        return;
      }

      setMessage("Bukti transfer berhasil diunggah dan menunggu verifikasi Admin TU.");
      setSelectedInvoice(null);
      setFile(null);
      await loadInvoices();
    } catch {
      setError("Gagal mengunggah bukti bayar");
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (invoice: Invoice, status: "paid" | "unpaid") => {
    setError(null);
    try {
      const res = await fetch("/api/finance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, status }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal memverifikasi tagihan");
        return;
      }

      setMessage(`Status tagihan ${invoice.id} berhasil diubah menjadi ${status === "paid" ? "Lunas" : "Belum Bayar"}.`);
      await loadInvoices();
      if (isAdmin) {
        await loadCashTransactions();
      }
    } catch {
      setError("Gagal memverifikasi tagihan");
    }
  };

  const handleOpenCreateComponent = () => {
    setEditingComponent(null);
    setCompName("");
    setCompAmount("");
    setCompGradeLevel("all");
    setIsComponentModalOpen(true);
  };

  const handleOpenEditComponent = (comp: FeeComponent) => {
    setEditingComponent(comp);
    setCompName(comp.name);
    setCompAmount(String(comp.amount));
    setCompGradeLevel(comp.gradeLevel ? String(comp.gradeLevel) : "all");
    setIsComponentModalOpen(true);
  };

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(compAmount);
    if (!compName.trim() || isNaN(amountNum) || amountNum <= 0) {
      setError("Nama komponen dan nominal tarif (> 0) wajib diisi");
      return;
    }

    setSubmittingComponent(true);
    setError(null);
    try {
      const payload = {
        name: compName.trim(),
        amount: amountNum,
        gradeLevel: compGradeLevel === "all" ? null : Number(compGradeLevel),
      };

      const res = editingComponent
        ? await fetch(`/api/finance/fee-components/${editingComponent.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/finance/fee-components", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal menyimpan komponen biaya");
        return;
      }

      setMessage(editingComponent ? "Komponen biaya berhasil diperbarui." : "Komponen biaya baru berhasil ditambahkan.");
      setIsComponentModalOpen(false);
      await loadFeeComponents();
    } catch {
      setError("Gagal menyimpan komponen biaya");
    } finally {
      setSubmittingComponent(false);
    }
  };

  const handleDeleteComponent = async () => {
    if (!deletingComponent) return;
    setError(null);
    try {
      const res = await fetch(`/api/finance/fee-components/${deletingComponent.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal menghapus komponen biaya");
        return;
      }

      setMessage("Komponen biaya berhasil dihapus.");
      setDeletingComponent(null);
      await loadFeeComponents();
    } catch {
      setError("Gagal menghapus komponen biaya");
    }
  };

  const handleOpenManualInvoice = () => {
    setSelectedStudentId(students[0]?.id || "");
    const defaultFee = feeComponents[0];
    setSelectedFeeCompId(defaultFee?.id || "");
    setInvoiceAmount(defaultFee ? String(defaultFee.amount) : "");
    setIsManualInvoiceModalOpen(true);
  };

  const handleFeeComponentChange = (feeId: string) => {
    setSelectedFeeCompId(feeId);
    const comp = feeComponents.find((c) => c.id === feeId);
    if (comp) {
      setInvoiceAmount(String(comp.amount));
    }
  };

  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(invoiceAmount);
    if (!selectedStudentId || !selectedFeeCompId || isNaN(amountNum) || amountNum <= 0) {
      setError("Mohon lengkapi data siswa, komponen biaya, dan nominal valid");
      return;
    }

    setSubmittingInvoice(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          feeComponentId: selectedFeeCompId,
          amount: amountNum,
          month: invoiceMonth,
          dueDate: invoiceDueDate,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal membuat tagihan");
        return;
      }

      setMessage("Tagihan perseorangan berhasil dibuat.");
      setIsManualInvoiceModalOpen(false);
      await loadInvoices();
    } catch {
      setError("Gagal membuat tagihan manual");
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!batchMonth) return;
    setGeneratingBatch(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: batchMonth }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal memproses tagihan otomatis");
        return;
      }

      setMessage(json?.message || `Tagihan periode ${batchMonth} berhasil digenerate.`);
      await loadInvoices();
    } catch {
      setError("Gagal memproses tagihan otomatis");
    } finally {
      setGeneratingBatch(false);
    }
  };

  const handleCreateCashTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(newCashTx.amount);
    if (!newCashTx.date || !newCashTx.category || !newCashTx.description || isNaN(amountNum) || amountNum <= 0) {
      setError("Harap isi semua field transaksi kas dengan benar");
      return;
    }

    setSubmittingCash(true);
    setError(null);
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
      setError("Gagal mencatat transaksi kas");
    } finally {
      setSubmittingCash(false);
    }
  };

  const handleDeleteCashTransaction = async (id: string) => {
    setDeletingCashId(id);
    setError(null);
    try {
      const res = await fetch(`/api/finance/cash-transactions/${id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal menghapus transaksi kas");
        return;
      }

      setMessage("Transaksi kas berhasil dihapus.");
      await loadCashTransactions();
    } catch {
      setError("Gagal menghapus transaksi kas");
    } finally {
      setDeletingCashId(null);
    }
  };

  return (
    <div className="space-y-6" data-ui>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" /> Keuangan, Tagihan SPP & Buku Kas
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Kelola tagihan pembayaran siswa, tarif komponen biaya, dan mutasi kas operasional sekolah
          </p>
        </div>

        {/* Tab Switcher */}
        {isAdmin && (
          <div className="flex items-center gap-1 p-1 bg-subtle rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("invoices")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === "invoices"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Daftar Tagihan
            </button>
            <button
              onClick={() => setActiveTab("tariffs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === "tariffs"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Komponen Biaya / Tarif
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === "ledger"
                  ? "bg-white text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Buku Kas & Mutasi
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {message && (
        <div className="p-3 bg-success-soft text-success-ink text-xs rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" /> {message}
          </div>
          <button onClick={() => setMessage(null)} className="p-1 text-success-ink/70 hover:text-success-ink">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger-soft text-danger-ink text-xs rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
          <button onClick={() => setError(null)} className="p-1 text-danger-ink/70 hover:text-danger-ink">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: INVOICES */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-lg">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenManualInvoice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-strong transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Buat Tagihan Manual
                </button>
              </div>

              {/* Batch billing controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Generate Massal:</span>
                <input
                  type="month"
                  value={batchMonth}
                  onChange={(e) => setBatchMonth(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  onClick={handleBatchGenerate}
                  disabled={generatingBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-subtle text-ink hover:bg-ground transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generatingBatch ? "animate-spin" : ""}`} />
                  {generatingBatch ? "Memproses..." : "Terbitkan Tagihan Massal"}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-xs text-muted">Memuat tagihan...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted bg-white rounded-lg">
              Belum ada tagihan pada sistem.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-5 bg-white rounded-lg flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-muted">{invoice.id}</span>
                      <h4 className="font-semibold text-sm text-ink mt-0.5">{invoice.componentName}</h4>
                      <p className="text-xs text-muted mt-1">
                        Siswa: <strong className="text-ink">{invoice.studentName}</strong>
                        {invoice.classroom ? ` (${invoice.classroom})` : ""} &bull; Periode: {invoice.month || "-"}
                      </p>
                      <p className="text-[11px] text-muted-soft mt-0.5">
                        Jatuh Tempo: {formatDate(invoice.dueDate)}
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
                      {invoice.paymentProofUrl && (
                        <a
                          href={invoice.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent-soft rounded transition"
                        >
                          Lihat Bukti
                        </a>
                      )}

                      {/* User upload proof */}
                      {invoice.status === "unpaid" && !isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setFile(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-strong transition"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> Unggah Bukti
                        </button>
                      )}

                      {/* Admin verify action */}
                      {isAdmin && invoice.status === "pending" && (
                        <button
                          onClick={() => handleVerify(invoice, "paid")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-success-soft text-success-ink hover:bg-success hover:text-white transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Verifikasi Lunas
                        </button>
                      )}

                      {isAdmin && invoice.status === "unpaid" && (
                        <button
                          onClick={() => handleVerify(invoice, "paid")}
                          className="px-2.5 py-1 text-xs font-medium text-muted hover:text-success hover:bg-success-soft rounded transition"
                          title="Tandai langsung lunas"
                        >
                          Tandai Lunas
                        </button>
                      )}

                      {isAdmin && invoice.status === "paid" && (
                        <button
                          onClick={() => handleVerify(invoice, "unpaid")}
                          className="px-2.5 py-1 text-xs font-medium text-muted hover:text-danger hover:bg-danger-soft rounded transition"
                          title="Batalkan status lunas"
                        >
                          Batalkan Lunas
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TARIFFS & FEE COMPONENTS */}
      {activeTab === "tariffs" && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg">
            <div>
              <h4 className="text-sm font-bold text-ink">Master Tarif & Komponen Biaya</h4>
              <p className="text-xs text-muted mt-0.5">
                Konfigurasi besaran tagihan reguler seperti SPP, Uang Kegiatan, dan komponen lainnya
              </p>
            </div>
            <button
              onClick={handleOpenCreateComponent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-strong transition"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Komponen Tarif
            </button>
          </div>

          {loadingComponents ? (
            <div className="p-8 text-center text-xs text-muted">Memuat komponen tarif...</div>
          ) : feeComponents.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted bg-white rounded-lg">
              Belum ada komponen biaya/tarif yang dikonfigurasi.
            </div>
          ) : (
            <div className="bg-white rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-ink">
                <thead className="bg-subtle text-[11px] font-semibold text-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Nama Komponen</th>
                    <th className="px-4 py-3">ID Komponen</th>
                    <th className="px-4 py-3 text-right">Nominal Tarif</th>
                    <th className="px-4 py-3">Tingkat Kelas</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {feeComponents.map((comp) => (
                    <tr key={comp.id} className="hover:bg-ground transition">
                      <td className="px-4 py-3 font-semibold text-ink">{comp.name}</td>
                      <td className="px-4 py-3 text-muted">{comp.id}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-ink">
                        Rp {comp.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {comp.gradeLevel ? `Kelas ${comp.gradeLevel}` : "Semua Tingkat"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditComponent(comp)}
                            className="p-1 text-muted hover:text-accent hover:bg-accent-soft rounded transition"
                            title="Sunting Tarif"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingComponent(comp)}
                            className="p-1 text-muted hover:text-danger hover:bg-danger-soft rounded transition"
                            title="Hapus Komponen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CASH LEDGER */}
      {activeTab === "ledger" && isAdmin && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase text-muted">Total Pemasukan (Debit)</span>
                <p className="text-lg font-bold text-success tabular-nums mt-0.5">
                  Rp {cashSummary.totalDebit.toLocaleString("id-ID")}
                </p>
              </div>
              <span className="p-2.5 bg-success-soft text-success rounded-lg">
                <ArrowDownLeft className="w-5 h-5" />
              </span>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase text-muted">Total Pengeluaran (Kredit)</span>
                <p className="text-lg font-bold text-danger tabular-nums mt-0.5">
                  Rp {cashSummary.totalCredit.toLocaleString("id-ID")}
                </p>
              </div>
              <span className="p-2.5 bg-danger-soft text-danger rounded-lg">
                <ArrowUpRight className="w-5 h-5" />
              </span>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase text-muted">Saldo Kas Akhir</span>
                <p className="text-lg font-bold text-ink tabular-nums mt-0.5">
                  Rp {cashSummary.balance.toLocaleString("id-ID")}
                </p>
              </div>
              <span className="p-2.5 bg-accent-soft text-accent rounded-lg">
                <Wallet className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Form Tambah Transaksi Kas */}
          <div className="p-5 bg-white rounded-lg space-y-4">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <Plus className="w-4 h-4 text-accent" /> Catat Transaksi Kas Manual
            </h4>

            <form onSubmit={handleCreateCashTransaction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Tanggal</label>
                <input
                  type="date"
                  value={newCashTx.date}
                  onChange={(e) => setNewCashTx({ ...newCashTx, date: e.target.value })}
                  className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Jenis Arus</label>
                <select
                  value={newCashTx.type}
                  onChange={(e) => setNewCashTx({ ...newCashTx, type: e.target.value as "debit" | "credit" })}
                  className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="debit">Pemasukan (Debit)</option>
                  <option value="credit">Pengeluaran (Kredit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Kategori</label>
                <input
                  type="text"
                  placeholder="e.g. ATK, Donasi, Listrik"
                  value={newCashTx.category}
                  onChange={(e) => setNewCashTx({ ...newCashTx, category: e.target.value })}
                  className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  min={1}
                  value={newCashTx.amount}
                  onChange={(e) => setNewCashTx({ ...newCashTx, amount: e.target.value })}
                  className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submittingCash}
                  className="w-full px-4 py-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-semibold rounded transition disabled:opacity-50"
                >
                  {submittingCash ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>

              <div className="sm:col-span-2 lg:col-span-5">
                <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Deskripsi / Keterangan</label>
                <input
                  type="text"
                  placeholder="e.g. Pembelian spidol whiteboard untuk ruang guru"
                  value={newCashTx.description}
                  onChange={(e) => setNewCashTx({ ...newCashTx, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>
            </form>
          </div>

          {/* Tabel Buku Kas */}
          <div className="bg-white rounded-lg overflow-hidden space-y-3">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <h4 className="text-sm font-bold text-ink">Buku Kas & Riwayat Mutasi</h4>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted">Filter:</span>
                <select
                  value={ledgerFilter}
                  onChange={(e) => setLedgerFilter(e.target.value as "all" | "manual" | "spp")}
                  className="px-2.5 py-1 bg-ground rounded text-ink text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="all">Semua Transaksi</option>
                  <option value="spp">Otomatis SPP Saja</option>
                  <option value="manual">Manual / Operasional</option>
                </select>
              </div>
            </div>

            {loadingCash ? (
              <div className="p-8 text-center text-xs text-muted">Memuat mutasi buku kas...</div>
            ) : cashTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">Belum ada transaksi kas yang dicatat.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-ink">
                  <thead className="bg-subtle text-[11px] font-semibold text-muted uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Tipe</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Keterangan</th>
                      <th className="px-4 py-3 text-right">Debit (Masuk)</th>
                      <th className="px-4 py-3 text-right">Kredit (Keluar)</th>
                      <th className="px-4 py-3 text-right">Saldo Kas</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
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
                          <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(tx.date)}</td>
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
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-soft text-accent-ink">
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
                              disabled={deletingCashId === tx.id}
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

      {/* MODAL 1: Unggah Bukti Bayar */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-ink">Upload Bukti Transfer</h4>
            <p className="text-xs text-muted">
              Tagihan: {selectedInvoice.componentName} &bull; Periode: {selectedInvoice.month} (Rp{" "}
              {selectedInvoice.amount.toLocaleString("id-ID")})
            </p>

            <form onSubmit={handleUploadProof} className="space-y-4">
              <label htmlFor="proof-upload" className="block p-6 bg-ground rounded text-center cursor-pointer">
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

      {/* MODAL 2: Tambah/Edit Fee Component */}
      {isComponentModalOpen && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-ink">
              {editingComponent ? "Sunting Komponen Tarif" : "Tambah Komponen Tarif Baru"}
            </h4>

            <form onSubmit={handleSaveComponent} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Nama Komponen Biaya
                </label>
                <input
                  type="text"
                  placeholder="e.g. SPP Bulanan Kelas 10"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Nominal Tarif (Rp)
                </label>
                <input
                  type="number"
                  placeholder="350000"
                  min={1}
                  value={compAmount}
                  onChange={(e) => setCompAmount(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Target Tingkat Kelas
                </label>
                <select
                  value={compGradeLevel}
                  onChange={(e) => setCompGradeLevel(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="all">Semua Tingkat</option>
                  <option value="7">Kelas 7</option>
                  <option value="8">Kelas 8</option>
                  <option value="9">Kelas 9</option>
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsComponentModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingComponent}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-accent text-white hover:bg-accent-strong rounded transition disabled:opacity-50"
                >
                  {submittingComponent ? "Menyimpan..." : "Simpan Tarif"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Hapus Fee Component Confirmation */}
      {deletingComponent && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-ink flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-danger" /> Hapus Komponen Tarif?
            </h4>
            <p className="text-xs text-muted">
              Apakah Anda yakin ingin menghapus komponen biaya <strong className="text-ink">{deletingComponent.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingComponent(null)}
                className="px-3 py-1.5 text-xs text-muted hover:bg-subtle rounded transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteComponent}
                className="px-3.5 py-1.5 text-xs font-semibold bg-danger text-white hover:bg-danger-ink rounded transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Buat Tagihan Perseorangan Manual */}
      {isManualInvoiceModalOpen && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-ink">Buat Tagihan Siswa Manual</h4>

            <form onSubmit={handleCreateManualInvoice} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Pilih Siswa
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                >
                  <option value="">Pilih Siswa...</option>
                  {students.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.fullName} ({std.username}) {std.currentClassroom ? `- ${std.currentClassroom}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Komponen Biaya
                </label>
                <select
                  value={selectedFeeCompId}
                  onChange={(e) => handleFeeComponentChange(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                >
                  <option value="">Pilih Komponen...</option>
                  {feeComponents.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} (Rp {comp.amount.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Nominal Tagihan (Rp)
                </label>
                <input
                  type="number"
                  min={1}
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent tabular-nums"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                    Bulan Periode
                  </label>
                  <input
                    type="month"
                    value={invoiceMonth}
                    onChange={(e) => setInvoiceMonth(e.target.value)}
                    className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsManualInvoiceModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-accent text-white hover:bg-accent-strong rounded transition disabled:opacity-50"
                >
                  {submittingInvoice ? "Membuat..." : "Buat Tagihan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
