import { GraduationCap, BookOpen, CreditCard, ShieldCheck } from "lucide-react";
import { UserRole } from "@school-erp/shared";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <header className="border-b bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <span className="font-bold text-xl tracking-tight text-slate-800">
              School ERP Cloudflare
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Edge Ready
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 flex-1">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Sistem Informasi Sekolah Terpadu
          </h1>
          <p className="text-lg text-slate-600">
            Platform modern serverless berbasis Cloudflare Workers, D1 Database, dan R2 Storage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition">
            <BookOpen className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-lg text-slate-800">Akademik & Nilai</h3>
            <p className="text-sm text-slate-600 mt-2">
              Kelola Rombel, penempatan siswa, buku nilai guru, dan rapor semester secara akurat.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition">
            <CreditCard className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-lg text-slate-800">Keuangan & SPP</h3>
            <p className="text-sm text-slate-600 mt-2">
              Penerbitan tagihan batch otomatis dan verifikasi bukti transfer via Cloudflare R2.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition">
            <GraduationCap className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-lg text-slate-800">Multi-Role Portal</h3>
            <p className="text-sm text-slate-600 mt-2">
              Hak akses fleksibel untuk {UserRole.ADMIN}, {UserRole.TEACHER}, {UserRole.STUDENT}, dan {UserRole.GUARDIAN}.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} School ERP. Powered by Cloudflare Serverless Stack.
      </footer>
    </div>
  );
}
