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
    <div className="space-y-6" data-ui>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#b8336a]" /> Keuangan & Tagihan SPP
          </h3>
          <p className="text-xs text-[#5f6672] mt-0.5">
            Pantau dan verifikasi pembayaran berkas Cloudflare R2
          </p>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-3 bg-[#dcfce7] text-[#14532d] text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4" /> Bukti transfer berhasil diunggah ke Cloudflare R2 dan menunggu verifikasi Admin TU!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {invoices.map((inv) => (
          <div key={inv.id} className="p-5 bg-white rounded-lg flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-[#5f6672]">{inv.id}</span>
                <h4 className="font-semibold text-sm text-[#111827] mt-0.5">{inv.componentName}</h4>
                <p className="text-xs text-[#5f6672] mt-1">Siswa: {inv.studentName} &bull; Jatuh Tempo: {inv.dueDate}</p>
              </div>

              <div>
                {inv.status === "paid" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#dcfce7] text-[#14532d]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                  </span>
                )}
                {inv.status === "pending" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#fffbeb] text-[#92400e]">
                    <Clock className="w-3.5 h-3.5" /> Menunggu Verifikasi
                  </span>
                )}
                {inv.status === "unpaid" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#ffedea] text-[#831c1e]">
                    <AlertCircle className="w-3.5 h-3.5" /> Belum Dibayar
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#5f6672]">Nominal Tagihan:</span>
                <p className="text-lg font-bold text-[#111827] tabular-nums">Rp {inv.amount.toLocaleString("id-ID")}</p>
              </div>

              {inv.status === "unpaid" && (
                <button
                  onClick={() => setSelectedInvoice(inv)}
                  className="inline-flex items-center gap-1.5 bg-[#b8336a] hover:bg-[#a12b5b] text-white text-xs font-medium px-3.5 py-1.5 rounded transition"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Unggah Bukti Bayar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-base text-[#111827]">Unggah Bukti Pembayaran</h4>
            <p className="text-xs text-[#5f6672]">
              Tagihan: <strong>{selectedInvoice.componentName}</strong> (Rp {selectedInvoice.amount.toLocaleString("id-ID")})
            </p>

            <form onSubmit={handleUploadProof} className="space-y-4">
              <div className="p-6 bg-[#f9fafb] rounded text-center cursor-pointer">
                <UploadCloud className="w-6 h-6 text-[#9ca3af] mx-auto mb-2" />
                <p className="text-xs text-[#111827] font-medium">Klik untuk memilih gambar struk/bukti transfer</p>
                <p className="text-[11px] text-[#5f6672] mt-0.5">PNG, JPG atau PDF maks 5MB</p>
                <input type="file" className="hidden" id="proof-upload" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 text-xs font-medium text-[#4b5563] hover:bg-[#f3f4f6] rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
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
