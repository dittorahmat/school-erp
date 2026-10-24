import React, { useEffect, useState } from "react";
import {
  CreditCard,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    loadInvoices();
  }, []);

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

  return (
    <div className="space-y-6" data-ui>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#b8336a]" /> Keuangan & Tagihan SPP
          </h3>
          <p className="text-xs text-[#5f6672] mt-0.5">
            Tagihan dari D1 dan bukti transfer tersimpan di Cloudflare R2
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-[#dcfce7] text-[#14532d] text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4" /> {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#ffedea] text-[#831c1e] text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-[#5f6672]">Memuat tagihan...</div>
      ) : invoices.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#5f6672]">Belum ada tagihan.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="p-5 bg-white rounded-lg flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-[#5f6672]">{invoice.id}</span>
                  <h4 className="font-semibold text-sm text-[#111827] mt-0.5">
                    {invoice.componentName}
                  </h4>
                  <p className="text-xs text-[#5f6672] mt-1">
                    Siswa: {invoice.studentName}
                    {invoice.classroom ? ` (${invoice.classroom})` : ""} &bull; Jatuh Tempo:{" "}
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>

                <div>
                  {invoice.status === "paid" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#dcfce7] text-[#14532d]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                    </span>
                  )}
                  {invoice.status === "pending" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#fffbeb] text-[#92400e]">
                      <Clock className="w-3.5 h-3.5" /> Menunggu Verifikasi
                    </span>
                  )}
                  {invoice.status === "unpaid" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#ffedea] text-[#831c1e]">
                      <AlertCircle className="w-3.5 h-3.5" /> Belum Dibayar
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-[#5f6672]">Nominal Tagihan:</span>
                  <p className="text-lg font-bold text-[#111827] tabular-nums">
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
                      className="inline-flex items-center gap-1.5 bg-[#b8336a] hover:bg-[#a12b5b] text-white text-xs font-medium px-3.5 py-1.5 rounded transition"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Unggah Bukti
                    </button>
                  )}
                  {invoice.status === "pending" && user?.role === "admin" && (
                    <button
                      onClick={() => handleVerify(invoice)}
                      className="inline-flex items-center gap-1.5 bg-[#247b50] hover:bg-[#1d6340] text-white text-xs font-medium px-3.5 py-1.5 rounded transition"
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

      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-base text-[#111827]">Unggah Bukti Pembayaran</h4>
            <p className="text-xs text-[#5f6672]">
              Tagihan: <strong>{selectedInvoice.componentName}</strong> (Rp{" "}
              {selectedInvoice.amount.toLocaleString("id-ID")})
            </p>

            <form onSubmit={handleUploadProof} className="space-y-4">
              <label
                htmlFor="proof-upload"
                className="block p-6 bg-[#f9fafb] rounded text-center cursor-pointer"
              >
                <UploadCloud className="w-6 h-6 text-[#9ca3af] mx-auto mb-2" />
                <p className="text-xs text-[#111827] font-medium">
                  {file ? file.name : "Klik untuk memilih gambar struk/bukti transfer"}
                </p>
                <p className="text-[11px] text-[#5f6672] mt-0.5">PNG, JPG atau PDF maks 5MB</p>
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
                  className="px-3 py-1.5 text-xs font-medium text-[#4b5563] hover:bg-[#f3f4f6] rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="px-3.5 py-1.5 text-xs font-medium bg-[#b8336a] hover:bg-[#a12b5b] text-white rounded transition disabled:opacity-50"
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
