import React, { useState } from "react";
import { Users, Award, CreditCard, CalendarCheck, ChevronRight, User } from "lucide-react";

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

const mockChildren: ChildProfile[] = [
  {
    id: "std_1",
    name: "Ahmad Dahlan",
    nisn: "0081293812",
    classroom: "X-MIPA-1",
    gradeLevel: 10,
    attendancePercentage: "93.3%",
    unpaidInvoicesCount: 1,
    totalUnpaidAmount: 350000,
    gpa: 86.25,
  },
  {
    id: "std_4",
    name: "Dewi Sartika",
    nisn: "0081293844",
    classroom: "VII-B",
    gradeLevel: 7,
    attendancePercentage: "97.5%",
    unpaidInvoicesCount: 0,
    totalUnpaidAmount: 0,
    gpa: 88.5,
  },
];

export function ParentPortal() {
  const [children] = useState<ChildProfile[]>(mockChildren);
  const [selectedChildId, setSelectedChildId] = useState<string>("std_1");

  const activeChild = children.find((c) => c.id === selectedChildId) || children[0];

  return (
    <div className="space-y-6">
      <div className="p-6 bg-linear-to-r from-indigo-700 to-indigo-900 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Portal Orang Tua / Wali</span>
          <h3 className="text-2xl font-bold mt-1">Pemantauan Terpadu Siswa</h3>
          <p className="text-sm text-indigo-100 mt-1">
            Pilih anak Anda untuk melihat kemajuan belajar, presensi harian, dan kewajiban SPP.
          </p>
        </div>

        {/* Child Profile Switcher */}
        <div className="flex items-center gap-2 bg-indigo-800/80 p-1.5 rounded-xl border border-indigo-500/40">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                selectedChildId === child.id
                  ? "bg-white text-indigo-900 shadow-sm"
                  : "text-indigo-200 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{child.name} ({child.classroom})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rata-rata Akademik</span>
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{activeChild.gpa}</p>
          <p className="text-xs text-slate-500 mt-1">Predikat Sangat Memuaskan (A)</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tingkat Kehadiran</span>
            <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CalendarCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{activeChild.attendancePercentage}</p>
          <p className="text-xs text-slate-500 mt-1">42 hari hadir dari 45 hari efektif</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tagihan SPP Belum Lunas</span>
            <span className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">
            {activeChild.unpaidInvoicesCount > 0
              ? `Rp ${activeChild.totalUnpaidAmount.toLocaleString("id-ID")}`
              : "Semua Lunas"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {activeChild.unpaidInvoicesCount > 0
              ? `${activeChild.unpaidInvoicesCount} tagihan perlu diselesaikan`
              : "Tidak ada tagihan tertunggak"}
          </p>
        </div>
      </div>
    </div>
  );
}
