import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Lock, User, AlertCircle, ArrowRight } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await login(username, password);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error || "Gagal masuk");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/50 mb-3">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold">Portal Masuk</h2>
          <p className="text-indigo-100 text-sm mt-1">Sistem Informasi Manajemen Sekolah</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Nama Pengguna (Username)
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-slate-800">Akun Demo Tersedia:</p>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <div>&bull; Admin: <code>admin</code> / <code>admin123</code></div>
              <div>&bull; Guru: <code>guru_budi</code> / <code>guru123</code></div>
              <div>&bull; Siswa: <code>siswa_ahmad</code> / <code>siswa123</code></div>
              <div>&bull; Wali: <code>wali_subagyo</code> / <code>wali123</code></div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {submitting ? "Memproses..." : "Masuk ke Sistem"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
