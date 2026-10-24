import React, { useEffect, useState } from "react";
import { Award, CreditCard, CalendarCheck, User, AlertCircle } from "lucide-react";

interface ChildProfile {
  id: string;
  name: string;
  nisn: string;
  classroom: string;
  gradeLevel: number;
  attendancePercentage: string;
  unpaidInvoicesCount: number;
  totalUnpaidAmount: number;
  gpa: number;
}

export function ParentPortal() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parent/children")
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error || "Gagal memuat data anak");
          return;
        }
        const list: ChildProfile[] = json?.data ?? [];
        setChildren(list);
        if (list[0]) setSelectedChildId(list[0].id);
      })
      .catch(() => setError("Gagal memuat data anak"))
      .finally(() => setLoading(false));
  }, []);

  const activeChild = children.find((child) => child.id === selectedChildId) || children[0];

  return (
    <div className="space-y-6" data-ui>
      <div className="p-6 bg-[#fdf2f7] rounded-lg text-[#6b1d3e] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#b8336a]">Portal Orang Tua / Wali</span>
          <h3 className="text-xl font-bold text-[#111827] mt-0.5">Pemantauan Terpadu Siswa</h3>
          <p className="text-xs text-[#5f6672] mt-0.5">
            Pilih anak Anda untuk melihat kemajuan belajar, presensi harian, dan kewajiban SPP.
          </p>
        </div>

        {children.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-md">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
                  selectedChildId === child.id
                    ? "bg-[#b8336a] text-white"
                    : "text-[#5f6672] hover:text-[#111827]"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>
                  {child.name} ({child.classroom})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#ffedea] text-[#831c1e] text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-[#5f6672]">Memuat data anak...</div>
      ) : !activeChild ? (
        <div className="p-8 text-center text-xs text-[#5f6672]">
          Belum ada siswa yang terhubung dengan akun wali ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-white rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5f6672]">Rata-rata Akademik</span>
              <span className="p-2 bg-[#fdf2f7] rounded text-[#b8336a]">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-[#111827] mt-3 tabular-nums">{activeChild.gpa}</p>
            <p className="text-[11px] text-[#5f6672] mt-0.5">
              Kelas {activeChild.classroom} &bull; Tingkat {activeChild.gradeLevel}
            </p>
          </div>

          <div className="p-5 bg-white rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5f6672]">Tingkat Kehadiran</span>
              <span className="p-2 bg-[#dcfce7] rounded text-[#247b50]">
                <CalendarCheck className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-[#111827] mt-3 tabular-nums">
              {activeChild.attendancePercentage}
            </p>
            <p className="text-[11px] text-[#5f6672] mt-0.5">Dihitung dari seluruh sesi presensi tersimpan</p>
          </div>

          <div className="p-5 bg-white rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5f6672]">Tagihan SPP Belum Lunas</span>
              <span className="p-2 bg-[#ffedea] rounded text-[#c4242a]">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-[#111827] mt-3 tabular-nums">
              {activeChild.unpaidInvoicesCount > 0
                ? `Rp ${activeChild.totalUnpaidAmount.toLocaleString("id-ID")}`
                : "Semua Lunas"}
            </p>
            <p className="text-[11px] text-[#5f6672] mt-0.5">
              {activeChild.unpaidInvoicesCount > 0
                ? `${activeChild.unpaidInvoicesCount} tagihan perlu diselesaikan`
                : "Tidak ada tagihan tertunggak"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
