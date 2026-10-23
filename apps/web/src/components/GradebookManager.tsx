import React, { useState } from "react";
import { BookOpen, Award, FileText, CheckCircle2 } from "lucide-react";

export function GradebookManager() {
  const [activeSubTab, setActiveSubTab] = useState<"gradebook" | "report">("gradebook");

  const students = [
    { id: "std_1", name: "Ahmad Dahlan", tugas: 88, uts: 85, sas: 90, final: 87.9, grade: "A" },
    { id: "std_2", name: "Citra Lestari", tugas: 92, uts: 90, sas: 94, final: 92.2, grade: "A" },
    { id: "std_3", name: "Dewi Sartika", tugas: 78, uts: 80, sas: 82, final: 80.2, grade: "B" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Penilaian & Buku Nilai (Gradebook)
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Mata Pelajaran: <strong>Matematika (Kelas X-MIPA-1)</strong> &bull; Kurikulum Merdeka
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab("gradebook")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === "gradebook"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Buku Nilai Guru
          </button>
          <button
            onClick={() => setActiveSubTab("report")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === "report"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Preview Rapor Siswa
          </button>
        </div>
      </div>

      {activeSubTab === "gradebook" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Bobot Penilaian: Tugas Harian (30%) &bull; UTS/Sumatif Tengah (30%) &bull; SAS/Sumatif Akhir (40%)</span>
            <span className="font-semibold text-indigo-600">Skala 0 - 100</span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-6 py-3.5">Nama Siswa</th>
                <th className="px-4 py-3.5 text-center">Tugas (30%)</th>
                <th className="px-4 py-3.5 text-center">UTS (30%)</th>
                <th className="px-4 py-3.5 text-center">SAS (40%)</th>
                <th className="px-4 py-3.5 text-center">Nilai Akhir</th>
                <th className="px-4 py-3.5 text-center">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800">{std.name}</td>
                  <td className="px-4 py-4 text-center">{std.tugas}</td>
                  <td className="px-4 py-4 text-center">{std.uts}</td>
                  <td className="px-4 py-4 text-center">{std.sas}</td>
                  <td className="px-4 py-4 text-center font-bold text-indigo-600">{std.final}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {std.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Kartu Laporan Hasil Belajar (Rapor)</span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-1">Ahmad Dahlan</h4>
              <p className="text-xs text-slate-500">NISN: 0081293812 &bull; Kelas: X-MIPA-1 &bull; Semester Ganjil 2025/2026</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Rata-rata Semester:</span>
              <p className="text-2xl font-black text-slate-900">86.25</p>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold text-sm text-slate-800">Capaian Kompetensi Akademik:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-slate-800">Matematika</strong>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Nilai: 88 (A)</span>
                </div>
                <p className="text-xs text-slate-600">Menunjukkan penguasaan sangat baik dalam aljabar dan geometri analitik.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-slate-800">Bahasa Indonesia</strong>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Nilai: 85 (A)</span>
                </div>
                <p className="text-xs text-slate-600">Sangat terampil dan kritis dalam menyusun teks argumentasi faktual.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
            <span>Rekap Kehadiran: Hadir 42 hari &bull; Sakit 2 hari &bull; Izin 1 hari &bull; Alpa 0 hari</span>
            <span className="font-bold">Kehadiran 93.3%</span>
          </div>
        </div>
      )}
    </div>
  );
}
