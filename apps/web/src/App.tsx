import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { GraduationCap, BookOpen, CreditCard, ShieldCheck, LogOut, UserCheck } from "lucide-react";

function MainDashboard() {
  const { user, logout } = useAuth();

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

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              <UserCheck className="w-3.5 h-3.5" /> {user?.fullName} ({user?.role.toUpperCase()})
            </span>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded-md hover:bg-rose-50 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Selamat datang, {user?.fullName}!</h2>
            <p className="text-sm text-slate-600 mt-1">
              Anda masuk dengan hak akses peran <strong>{user?.role}</strong> di lingkungan Cloudflare Edge.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Edge Authenticated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition">
            <BookOpen className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-lg text-slate-800">Struktur Akademik</h3>
            <p className="text-sm text-slate-600 mt-2">
              Kelola Rombel, penempatan siswa, mata pelajaran, dan jadwal belajar tahun aktif.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition">
            <CreditCard className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-lg text-slate-800">Keuangan & SPP</h3>
            <p className="text-sm text-slate-600 mt-2">
              Penerbitan tagihan batch bulanan dan verifikasi bukti transfer via Cloudflare R2.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition">
            <GraduationCap className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-lg text-slate-800">Buku Nilai & Presensi</h3>
            <p className="text-sm text-slate-600 mt-2">
              Pencatatan kehadiran harian siswa dan kalkulasi nilai rapor Kurikulum Merdeka.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} School ERP. Powered by Cloudflare Workers, D1 & R2.
      </footer>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <MainDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
