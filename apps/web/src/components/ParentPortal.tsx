import React, { useState } from "react";
import { Award, CreditCard, CalendarCheck, User } from "lucide-react";

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
    <div className="space-y-6" data-ui>
      <div className="p-6 bg-[#fdf2f7] rounded-lg text-[#6b1d3e] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#b8336a]">Portal Orang Tua / Wali</span>
          <h3 className="text-xl font-bold text-[#111827] mt-0.5">Pemantauan Terpadu Siswa</h3>
          <p className="text-xs text-[#5f6672] mt-0.5">
            Pilih anak Anda untuk melihat kemajuan belajar, presensi harian, dan kewajiban SPP.
          </p>
        </div>

        {/* Child Profile Switcher */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-md">
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
              <span>{child.name} ({child.classroom})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-white rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5f6672]">Rata-rata Akademik</span>
            <span className="p-2 bg-[#fdf2f7] rounded text-[#b8336a]">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-3 tabular-nums">{activeChild.gpa}</p>
          <p className="text-[11px] text-[#5f6672] mt-0.5">Predikat Sangat Memuaskan (A)</p>
        </div>

        <div className="p-5 bg-white rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5f6672]">Tingkat Kehadiran</span>
            <span className="p-2 bg-[#dcfce7] rounded text-[#247b50]">
              <CalendarCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-3 tabular-nums">{activeChild.attendancePercentage}</p>
          <p className="text-[11px] text-[#5f6672] mt-0.5">42 hari hadir dari 45 hari efektif</p>
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
    </div>
  );
}
