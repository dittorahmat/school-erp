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

  const [activeTab, setActiveTab] = useState<"invoices" | "tariffs">("invoices");

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
      // silent
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
      // silent
    }
  };

  useEffect(() => {
    loadInvoices();
    loadFeeComponents();
    if (isAdmin) {
      loadStudents();
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

  // Batch generate
  const handleBatchGenerate = async () => {
    setError(null);
    setMessage(null);
    setGeneratingBatch(true);
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
        `${json.message || "Berhasil menerbitkan tagihan"} (${json.generatedCount ?? 0} tagihan baru dibuat, ${json.skippedCount ?? 0} dilewati/sudah ada).`
      );
      await loadInvoices();
    } catch {
      setError("Gagal menerbitkan tagihan massal");
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Open modal fee component
  const openComponentModal = (comp?: FeeComponent) => {
    if (comp) {
      setEditingComponent(comp);
      setCompName(comp.name);
      setCompAmount(String(comp.amount));
      setCompGradeLevel(comp.gradeLevel ? String(comp.gradeLevel) : "all");
    } else {
      setEditingComponent(null);
      setCompName("");
      setCompAmount("");
      setCompGradeLevel("all");
    }
    setIsComponentModalOpen(true);
  };

  // Save fee component
  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const amountNum = parseInt(compAmount, 10);
    if (!compName.trim()) {
      setError("Nama komponen biaya wajib diisi");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Nominal tarif harus berupa angka lebih besar dari 0");
      return;
    }

    const gradeLevel = compGradeLevel === "all" ? null : parseInt(compGradeLevel, 10);
    setSubmittingComponent(true);

    try {
      if (editingComponent) {
        const res = await fetch(`/api/finance/fee-components/${editingComponent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: compName.trim(),
            amount: amountNum,
            gradeLevel,
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error || "Gagal memperbarui tarif komponen biaya");
          return;
        }
        setMessage(`Komponen biaya ${compName.trim()} berhasil diperbarui`);
      } else {
        const res = await fetch("/api/finance/fee-components", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: compName.trim(),
            amount: amountNum,
            gradeLevel,
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error || "Gagal menambahkan komponen biaya");
          return;
        }
        setMessage(`Komponen biaya ${compName.trim()} berhasil ditambahkan`);
      }
      setIsComponentModalOpen(false);
      await loadFeeComponents();
    } catch {
      setError("Gagal menyimpan komponen biaya");
    } finally {
      setSubmittingComponent(false);
    }
  };

  // Delete component
  const handleDeleteComponent = async () => {
    if (!deletingComponent) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/finance/fee-components/${deletingComponent.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal menghapus komponen biaya");
        return;
      }
      setMessage(`Komponen biaya "${deletingComponent.name}" berhasil dihapus`);
      setDeletingComponent(null);
      await loadFeeComponents();
    } catch {
      setError("Gagal menghapus komponen biaya");
    }
  };

  // Open manual invoice modal
  const openManualInvoiceModal = () => {
    setSelectedStudentId(students[0]?.id || "");
    const defaultComp = feeComponents[0];
    if (defaultComp) {
      setSelectedFeeCompId(defaultComp.id);
      setInvoiceAmount(String(defaultComp.amount));
    } else {
      setSelectedFeeCompId("");
      setInvoiceAmount("");
    }
    const currentMonth = new Date().toISOString().slice(0, 7);
    setInvoiceMonth(currentMonth);
    setInvoiceDueDate(`${currentMonth}-15`);
    setIsManualInvoiceModalOpen(true);
  };

  // Handle fee component select in manual invoice modal
  const handleSelectCompInInvoice = (compId: string) => {
    setSelectedFeeCompId(compId);
    const found = feeComponents.find((c) => c.id === compId);
    if (found) {
      setInvoiceAmount(String(found.amount));
    }
  };

  // Save manual invoice
  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const amountNum = parseInt(invoiceAmount, 10);
    if (!selectedStudentId) {
      setError("Pilih siswa tujuan tagihan");
      return;
    }
    if (!selectedFeeCompId) {
      setError("Pilih komponen tarif tagihan");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Nominal tagihan harus berupa angka lebih besar dari 0");
      return;
    }

    setSubmittingInvoice(true);
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          feeComponentId: selectedFeeCompId,
          amount: amountNum,
          month: invoiceMonth || null,
          dueDate: invoiceDueDate || null,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal membuat tagihan manual");
        return;
      }
      setMessage(`Tagihan ${json.data?.id || ""} berhasil dibuat untuk siswa.`);
      setIsManualInvoiceModalOpen(false);
      await loadInvoices();
    } catch {
      setError("Gagal membuat tagihan manual");
    } finally {
      setSubmittingInvoice(false);
    }
  };

  return (
    <div className="space-y-6" data-ui>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" /> Keuangan & Tagihan SPP
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Kelola tagihan pembayaran siswa, tarif komponen biaya, dan verifikasi bukti transfer
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-subtle p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "invoices"
                ? "bg-surface text-ink font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Daftar Tagihan & Pembayaran
          </button>
          <button
            onClick={() => setActiveTab("tariffs")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "tariffs"
                ? "bg-surface text-ink font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Komponen Biaya / Tarif
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-success-soft text-success-ink text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" /> {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger-soft text-danger-ink text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-ink">Semua Tagihan Siswa</h4>
            {isAdmin && (
              <button
                onClick={openManualInvoiceModal}
                className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-3.5 py-1.5 rounded transition"
              >
                <Plus className="w-3.5 h-3.5" /> Buat Tagihan Manual
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-muted">Memuat tagihan...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted bg-surface rounded-lg">
              Belum ada tagihan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-5 bg-surface rounded-lg flex flex-col justify-between">
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
                            setMessage(null);
                            setError(null);
                          }}
                          className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-3.5 py-1.5 rounded transition"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> Unggah Bukti
                        </button>
                      )}
                      {invoice.status === "pending" && isAdmin && (
                        <button
                          onClick={() => handleVerify(invoice)}
                          className="inline-flex items-center gap-1.5 bg-success hover:bg-success-strong text-white text-xs font-medium px-3.5 py-1.5 rounded transition"
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
        </div>
      )}

      {activeTab === "tariffs" && (
        <div className="space-y-6">
          {/* Pemicu tagihan bulanan batch */}
          {isAdmin && (
            <div className="p-4 bg-surface rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-accent" /> Generate Tagihan Otomatis
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Terbitkan tagihan SPP bulanan ke seluruh siswa aktif yang terdaftar untuk periode bulan yang dipilih
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={batchMonth}
                  onChange={(e) => setBatchMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-subtle rounded text-ink focus:outline-none"
                />
                <button
                  onClick={handleBatchGenerate}
                  disabled={generatingBatch || !batchMonth}
                  className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-3.5 py-1.5 rounded transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generatingBatch ? "animate-spin" : ""}`} />
                  {generatingBatch ? "Menerbitkan..." : "Generate Tagihan"}
                </button>
              </div>
            </div>
          )}

          {/* Tabel Komponen Biaya */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-ink">Master Komponen Tarif & Biaya</h4>
                <p className="text-xs text-muted">
                  Konfigurasi jenis tarif (SPP, Kegiatan, Ujian) beserta nominal standar rupiah
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => openComponentModal()}
                  className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-3.5 py-1.5 rounded transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Komponen Tarif
                </button>
              )}
            </div>

            {loadingComponents ? (
              <div className="p-8 text-center text-xs text-muted">Memuat komponen biaya...</div>
            ) : feeComponents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted bg-surface rounded-lg">
                Belum ada komponen biaya yang terdaftar.
              </div>
            ) : (
              <div className="bg-surface rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-ink">
                    <thead className="bg-subtle text-ink-muted uppercase">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Nama Komponen Tarif</th>
                        <th className="px-4 py-3 font-semibold">Target Tingkat</th>
                        <th className="px-4 py-3 font-semibold">Nominal Standar</th>
                        {isAdmin && (
                          <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {feeComponents.map((comp) => (
                        <tr key={comp.id} className="hover:bg-subtle-warm transition">
                          <td className="px-4 py-3 font-medium text-ink">
                            <div>{comp.name}</div>
                            <span className="text-[11px] text-muted">{comp.id}</span>
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {comp.gradeLevel ? `Kelas ${comp.gradeLevel}` : "Semua Tingkat"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-ink tabular-nums">
                            Rp {comp.amount.toLocaleString("id-ID")}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openComponentModal(comp)}
                                  className="p-1.5 text-ink-muted hover:text-accent hover:bg-subtle rounded transition"
                                  title="Sunting Tarif"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingComponent(comp)}
                                  className="p-1.5 text-danger hover:bg-danger-soft rounded transition"
                                  title="Hapus Tarif"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Unggah Bukti Bayar */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-base text-ink">Unggah Bukti Pembayaran</h4>
            <p className="text-xs text-muted">
              Tagihan: <strong>{selectedInvoice.componentName}</strong> (Rp{" "}
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

      {/* Modal Tambah / Sunting Komponen Biaya */}
      {isComponentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-ink">
                {editingComponent ? "Sunting Komponen Tarif" : "Tambah Komponen Tarif"}
              </h4>
              <button
                onClick={() => setIsComponentModalOpen(false)}
                className="p-1 text-muted hover:text-ink rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveComponent} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">
                  Nama Komponen Biaya <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: SPP Bulanan, Uang Praktikum"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full px-3 py-2 bg-ground rounded text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">
                  Nominal Standar (Rp) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="350000"
                  value={compAmount}
                  onChange={(e) => setCompAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-ground rounded text-ink tabular-nums focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Target Tingkat Kelas</label>
                <select
                  value={compGradeLevel}
                  onChange={(e) => setCompGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-ground rounded text-ink focus:outline-none"
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

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComponentModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingComponent}
                  className="px-3.5 py-1.5 text-xs font-medium bg-accent hover:bg-accent-strong text-white rounded transition disabled:opacity-50"
                >
                  {submittingComponent ? "Menyimpan..." : "Simpan Tarif"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Komponen Biaya */}
      {deletingComponent && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg max-w-sm w-full p-6 space-y-4">
            <h4 className="font-bold text-base text-ink">Hapus Komponen Tarif</h4>
            <p className="text-xs text-muted">
              Apakah Anda yakin ingin menghapus komponen tarif{" "}
              <strong>{deletingComponent.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingComponent(null)}
                className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-subtle rounded transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteComponent}
                className="px-3.5 py-1.5 text-xs font-medium bg-danger hover:bg-danger-ink text-white rounded transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Tagihan Manual */}
      {isManualInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-ink">Buat Tagihan Manual Per Siswa</h4>
              <button
                onClick={() => setIsManualInvoiceModalOpen(false)}
                className="p-1 text-muted hover:text-ink rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">
                  Pilih Siswa <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-ground rounded text-ink focus:outline-none"
                >
                  <option value="" disabled>
                    -- Pilih Siswa --
                  </option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.username}) {st.currentClassroom ? `- ${st.currentClassroom}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">
                  Komponen Tarif <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={selectedFeeCompId}
                  onChange={(e) => handleSelectCompInInvoice(e.target.value)}
                  className="w-full px-3 py-2 bg-ground rounded text-ink focus:outline-none"
                >
                  <option value="" disabled>
                    -- Pilih Komponen Biaya --
                  </option>
                  {feeComponents.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} - Rp {comp.amount.toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">
                  Nominal Tagihan (Rp) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-ground rounded text-ink tabular-nums focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-ink mb-1">Bulan Periode</label>
                  <input
                    type="month"
                    value={invoiceMonth}
                    onChange={(e) => {
                      setInvoiceMonth(e.target.value);
                      if (e.target.value) {
                        setInvoiceDueDate(`${e.target.value}-15`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-ground rounded text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-ink mb-1">Tanggal Jatuh Tempo</label>
                  <input
                    type="date"
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-ground rounded text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualInvoiceModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="px-3.5 py-1.5 text-xs font-medium bg-accent hover:bg-accent-strong text-white rounded transition disabled:opacity-50"
                >
                  {submittingInvoice ? "Menerbitkan..." : "Terbitkan Tagihan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
