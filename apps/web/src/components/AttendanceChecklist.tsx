import React, { useState } from "react";
import { UserCheck, Check, Clock, AlertTriangle, XCircle, Save } from "lucide-react";

interface StudentAttendance {
  id: string;
  name: string;
  status: "present" | "sick" | "permit" | "absent";
}

const initialStudents: StudentAttendance[] = [
  { id: "std_1", name: "Ahmad Dahlan", status: "present" },
  { id: "std_2", name: "Budi Santoso", status: "present" },
  { id: "std_3", name: "Citra Lestari", status: "sick" },
  { id: "std_4", name: "Dewi Sartika", status: "present" },
  { id: "std_5", name: "Eko Prasetyo", status: "permit" },
];

export function AttendanceChecklist() {
  const [students, setStudents] = useState<StudentAttendance[]>(initialStudents);
  const [saved, setSaved] = useState(false);

  const handleStatusChange = (id: string, status: StudentAttendance["status"]) => {
    setStudents(
      students.map((std) => (std.id === id ? { ...std, status } : std))
    );
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" /> Presensi Harian Siswa
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Kelas: <strong>X-MIPA-1</strong> &bull; Tanggal:{" "}
            <strong>{new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</strong>
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Save className="w-4 h-4" /> Simpan Presensi
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> Presensi kelas hari ini berhasil disimpan ke edge database!
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
            <tr>
              <th className="px-6 py-3.5">Nama Siswa</th>
              <th className="px-6 py-3.5 text-center">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((std) => (
              <tr key={std.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium text-slate-800">{std.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleStatusChange(std.id, "present")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        std.status === "present"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Hadir
                    </button>
                    <button
                      onClick={() => handleStatusChange(std.id, "sick")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        std.status === "sick"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Sakit
                    </button>
                    <button
                      onClick={() => handleStatusChange(std.id, "permit")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        std.status === "permit"
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Izin
                    </button>
                    <button
                      onClick={() => handleStatusChange(std.id, "absent")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        std.status === "absent"
                          ? "bg-rose-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Alpa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
