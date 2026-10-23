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
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[#f9fafb]" data-ui>
      <div className="max-w-[380px] w-full bg-white rounded-lg p-8 space-y-6 shadow-xs">
        <div>
          <div className="w-10 h-10 rounded-md bg-[#fdf2f7] text-[#b8336a] flex items-center justify-center mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#111827] tracking-tight">Masuk ke School ERP</h2>
          <p className="text-xs text-[#5f6672] mt-1">Platform administrasi sekolah berbasis Cloudflare Edge</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-[#ffedea] text-[#831c1e] text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#374151]">
              Nama Pengguna
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-[#9ca3af]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full pl-9 pr-3 py-2 bg-[#f9fafb] rounded-md text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a] transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#374151]">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#9ca3af]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-9 pr-3 py-2 bg-[#f9fafb] rounded-md text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a] transition"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-[#f9fafb] rounded text-[11px] text-[#4b5563] space-y-1">
            <p className="font-semibold text-[#111827]">Akun Demo:</p>
            <div className="grid grid-cols-2 gap-1 text-slate-600">
              <div>admin / admin123</div>
              <div>guru_budi / guru123</div>
              <div>siswa_ahmad / siswa123</div>
              <div>wali_subagyo / wali123</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-9 flex items-center justify-center gap-2 bg-[#b8336a] hover:bg-[#a12b5b] text-white text-xs font-medium rounded-md transition disabled:opacity-50"
          >
            {submitting ? "Memproses..." : "Masuk"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
