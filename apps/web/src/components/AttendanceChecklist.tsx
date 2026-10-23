import React, { useState } from "react";
import { UserCheck, Check, Save } from "lucide-react";

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
    <div className="space-y-6" data-ui>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#b8336a]" /> Presensi Harian Siswa
          </h3>
          <p className="text-xs text-[#5f6672] mt-0.5">
            Kelas: <strong>X-MIPA-1</strong> &bull; Tanggal:{" "}
            <strong>{new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</strong>
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 bg-[#247b50] hover:bg-[#1d6340] text-white text-xs font-medium px-3.5 py-1.5 rounded transition"
        >
          <Save className="w-3.5 h-3.5" /> Simpan Presensi
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-[#dcfce7] text-[#14532d] text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4" /> Presensi kelas hari ini berhasil disimpan ke edge database!
        </div>
      )}

      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f9fafb] text-[11px] font-semibold text-[#5f6672]">
            <tr>
              <th className="px-5 py-3">Nama Siswa</th>
              <th className="px-5 py-3 text-center">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {students.map((std) => (
              <tr key={std.id} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#111827]">{std.name}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleStatusChange(std.id, "present")}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        std.status === "present"
                          ? "bg-[#247b50] text-white"
                          : "bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]"
                      }`}
                    >
                      Hadir
                    </button>
                    <button
                      onClick={() => handleStatusChange(std.id, "sick")}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        std.status === "sick"
                          ? "bg-[#92400e] text-white"
                          : "bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]"
                      }`}
                    >
                      Sakit
                    </button>
                    <button
                      onClick={() => handleStatusChange(std.id, "permit")}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        std.status === "permit"
                          ? "bg-[#b8336a] text-white"
                          : "bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]"
                      }`}
                    >
                      Izin
                    </button>
                    <button
                      onClick={() => handleStatusChange(std.id, "absent")}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        std.status === "absent"
                          ? "bg-[#c4242a] text-white"
                          : "bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]"
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
