import React, { useState } from "react";
import { CreditCard, UploadCloud, CheckCircle2, AlertCircle, Clock, Check } from "lucide-react";

interface Invoice {
  id: string;
  studentName: string;
  componentName: string;
  amount: number;
  month: string;
  status: "unpaid" | "pending" | "paid";
  dueDate: string;
  paymentProofUrl: string | null;
}

const initialInvoices: Invoice[] = [
  {
    id: "inv_2026_10",
    studentName: "Ahmad Dahlan",
    componentName: "SPP Bulanan Oktober 2026",
    amount: 350000,
    month: "2026-10",
    status: "unpaid",
    dueDate: "15 Oktober 2026",
    paymentProofUrl: null,
  },
  {
    id: "inv_2026_09",
    studentName: "Ahmad Dahlan",
    componentName: "SPP Bulanan September 2026",
    amount: 350000,
    month: "2026-09",
    status: "paid",
    dueDate: "15 September 2026",
    paymentProofUrl: "proofs/inv_2026_09.jpg",
  },
];

export function FinanceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUploadProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setUploading(true);
    setTimeout(() => {
      setInvoices(
        invoices.map((inv) =>
          inv.id === selectedInvoice.id
            ? { ...inv, status: "pending", paymentProofUrl: "uploaded-r2-proof.png" }
            : inv
        )
      );
      setUploading(false);
      setUploadSuccess(true);
      setSelectedInvoice(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" /> Keuangan & Tagihan SPP
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Pantau dan lakukan pelunasan tagihan sekolah via transfer dan upload bukti bayar ke Cloudflare R2.
          </p>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Bukti transfer berhasil diunggah ke Cloudflare R2 dan menunggu verifikasi Admin TU!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {invoices.map((inv) => (
          <div key={inv.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{inv.id}</span>
                <h4 className="font-semibold text-slate-900 text-base mt-0.5">{inv.componentName}</h4>
                <p className="text-xs text-slate-500 mt-1">Siswa: {inv.studentName} &bull; Jatuh Tempo: {inv.dueDate}</p>
              </div>

              <div>
                {inv.status === "paid" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                  </span>
                )}
                {inv.status === "pending" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" /> Menunggu Verifikasi
                  </span>
                )}
                {inv.status === "unpaid" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5" /> Belum Dibayar
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Nominal Tagihan:</span>
                <p className="text-lg font-bold text-slate-900">Rp {inv.amount.toLocaleString("id-ID")}</p>
              </div>

              {inv.status === "unpaid" && (
                <button
                  onClick={() => setSelectedInvoice(inv)}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition"
                >
                  <UploadCloud className="w-4 h-4" /> Unggah Bukti Bayar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-lg text-slate-900">Unggah Bukti Pembayaran</h4>
            <p className="text-sm text-slate-600">
              Tagihan: <strong>{selectedInvoice.componentName}</strong> (Rp {selectedInvoice.amount.toLocaleString("id-ID")})
            </p>

            <form onSubmit={handleUploadProof} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition cursor-pointer">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">Klik untuk memilih gambar struk/bukti transfer</p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG atau PDF maks 5MB</p>
                <input type="file" className="hidden" id="proof-upload" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {uploading ? "Mengunggah ke R2..." : "Kirim Bukti Bayar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
