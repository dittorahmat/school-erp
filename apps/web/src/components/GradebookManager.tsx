import React, { useState } from "react";
import { BookOpen } from "lucide-react";

export function GradebookManager() {
  const [activeSubTab, setActiveSubTab] = useState<"gradebook" | "report">("gradebook");

  const students = [
    { id: "std_1", name: "Ahmad Dahlan", tugas: 88, uts: 85, sas: 90, final: 87.9, grade: "A" },
    { id: "std_2", name: "Citra Lestari", tugas: 92, uts: 90, sas: 94, final: 92.2, grade: "A" },
    { id: "std_3", name: "Dewi Sartika", tugas: 78, uts: 80, sas: 82, final: 80.2, grade: "B" },
  ];

  return (
    <div className="space-y-6" data-ui>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#b8336a]" /> Penilaian & Buku Nilai (Gradebook)
          </h3>
          <p className="text-xs text-[#5f6672] mt-0.5">
            Mata Pelajaran: <strong>Matematika (Kelas X-MIPA-1)</strong> &bull; Kurikulum Merdeka
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#f3f4f6] p-1 rounded-md">
          <button
            onClick={() => setActiveSubTab("gradebook")}
            className={`px-3 py-1 text-xs font-semibold rounded transition ${
              activeSubTab === "gradebook"
                ? "bg-white text-[#b8336a]"
                : "text-[#5f6672] hover:text-[#111827]"
            }`}
          >
            Buku Nilai Guru
          </button>
          <button
            onClick={() => setActiveSubTab("report")}
            className={`px-3 py-1 text-xs font-semibold rounded transition ${
              activeSubTab === "report"
                ? "bg-white text-[#b8336a]"
                : "text-[#5f6672] hover:text-[#111827]"
            }`}
          >
            Preview Rapor Siswa
          </button>
        </div>
      </div>

      {activeSubTab === "gradebook" ? (
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-4 bg-[#f9fafb] flex items-center justify-between text-xs text-[#5f6672]">
            <span>Bobot Penilaian: Tugas Harian (30%) &bull; UTS/Sumatif Tengah (30%) &bull; SAS/Sumatif Akhir (40%)</span>
            <span className="font-semibold text-[#b8336a]">Skala 0 - 100</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-[#f9fafb] text-[11px] font-semibold text-[#5f6672]">
              <tr>
                <th className="px-5 py-3">Nama Siswa</th>
                <th className="px-4 py-3 text-center">Tugas (30%)</th>
                <th className="px-4 py-3 text-center">UTS (30%)</th>
                <th className="px-4 py-3 text-center">SAS (40%)</th>
                <th className="px-4 py-3 text-center">Nilai Akhir</th>
                <th className="px-4 py-3 text-center">Predikat</th>
              </tr>
            </thead>
            <tbody>
              {students.map((std) => (
                <tr key={std.id} className="hover:bg-[#f9fafb]">
                  <td className="px-5 py-3.5 font-medium text-[#111827]">{std.name}</td>
                  <td className="px-4 py-3.5 text-center tabular-nums">{std.tugas}</td>
                  <td className="px-4 py-3.5 text-center tabular-nums">{std.uts}</td>
                  <td className="px-4 py-3.5 text-center tabular-nums">{std.sas}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-[#b8336a] tabular-nums">{std.final}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-[#dcfce7] text-[#14532d]">
                      {std.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 bg-white rounded-lg space-y-6">
          <div className="pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#b8336a]">Kartu Laporan Hasil Belajar (Rapor)</span>
              <h4 className="text-xl font-bold text-[#111827] mt-0.5">Ahmad Dahlan</h4>
              <p className="text-xs text-[#5f6672]">NISN: 0081293812 &bull; Kelas: X-MIPA-1 &bull; Semester Ganjil 2025/2026</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#5f6672]">Rata-rata Semester:</span>
              <p className="text-2xl font-bold text-[#111827] tabular-nums">86.25</p>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold text-xs text-[#111827]">Capaian Kompetensi Akademik:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-[#f9fafb] rounded text-xs">
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-[#111827]">Matematika</strong>
                  <span className="text-[11px] font-bold text-[#14532d] bg-[#dcfce7] px-2 py-0.5 rounded">Nilai: 88 (A)</span>
                </div>
                <p className="text-xs text-[#5f6672]">Menunjukkan penguasaan sangat baik dalam aljabar dan geometri analitik.</p>
              </div>

              <div className="p-4 bg-[#f9fafb] rounded text-xs">
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-[#111827]">Bahasa Indonesia</strong>
                  <span className="text-[11px] font-bold text-[#14532d] bg-[#dcfce7] px-2 py-0.5 rounded">Nilai: 85 (A)</span>
                </div>
                <p className="text-xs text-[#5f6672]">Sangat terampil dan kritis dalam menyusun teks argumentasi faktual.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#fdf2f7] rounded text-xs text-[#6b1d3e] flex items-center justify-between">
            <span>Rekap Kehadiran: Hadir 42 hari &bull; Sakit 2 hari &bull; Izin 1 hari &bull; Alpa 0 hari</span>
            <span className="font-bold tabular-nums">Kehadiran 93.3%</span>
          </div>
        </div>
      )}
    </div>
  );
}
