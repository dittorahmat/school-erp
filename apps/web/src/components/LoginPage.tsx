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

  const handleQuickSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-ground" data-ui>
      <div className="max-w-[420px] w-full bg-white rounded-lg p-8 space-y-6 shadow-xs">
        <div>
          <div className="w-10 h-10 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-ink tracking-tight">Masuk ke School ERP</h2>
          <p className="text-xs text-muted mt-1">Platform administrasi sekolah berbasis Cloudflare Edge</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-danger-soft text-danger-ink text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-soft">
              Nama Pengguna
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-faint" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full pl-9 pr-3 py-2 bg-ground rounded-md text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-soft">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-faint" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-9 pr-3 py-2 bg-ground rounded-md text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent transition"
                required
              />
            </div>
          </div>

          {/* Quick Demo Selector */}
          <div className="p-3 bg-ground rounded text-[11px] text-ink-muted space-y-1.5">
            <p className="font-semibold text-ink">Pilih Akun Demo (Klik untuk isi cepat):</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSelect("admin", "admin123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Admin TU (admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("guru_budi", "guru123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Guru Wali (guru_budi)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("guru_siti", "guru123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Guru Mapel (guru_siti)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("siswa_ahmad", "siswa123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Siswa (siswa_ahmad)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("siswa_dewi", "siswa123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Siswa (siswa_dewi)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("siswa_budi", "siswa123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Siswa (siswa_budi)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("siswa_citra", "siswa123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Siswa (siswa_citra)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("siswa_eka", "siswa123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Siswa (siswa_eka)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("siswa_fajar", "siswa123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Siswa (siswa_fajar)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("wali_subagyo", "wali123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Wali Multi (wali_subagyo)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("wali_hartono", "wali123")}
                className="text-left px-2 py-1 rounded hover:bg-white text-slate-700 hover:text-accent transition"
              >
                &bull; Wali Tunggal (wali_hartono)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-9 flex items-center justify-center gap-2 bg-accent hover:bg-accent-strong text-white text-xs font-medium rounded-md transition disabled:opacity-50"
          >
            {submitting ? "Memproses..." : "Masuk"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
