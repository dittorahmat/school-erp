import React, { useEffect, useState } from "react";
import { UserCheck, Check, Save, AlertCircle } from "lucide-react";

type Status = "present" | "sick" | "permit" | "absent";

interface StudentAttendance {
  id: string;
  name: string;
  status: Status;
}

interface Classroom {
  id: string;
  name: string;
}

const statusLabels: Array<{ value: Status; label: string; active: string }> = [
  { value: "present", label: "Hadir", active: "bg-[#247b50] text-white" },
  { value: "sick", label: "Sakit", active: "bg-[#92400e] text-white" },
  { value: "permit", label: "Izin", active: "bg-[#b8336a] text-white" },
  { value: "absent", label: "Alpa", active: "bg-[#c4242a] text-white" },
];

const defaultSchoolDate = () => {
  const cursor = new Date();
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor.setDate(cursor.getDate() - 1);
  }
  const year = cursor.getFullYear();
  const month = String(cursor.getMonth() + 1).padStart(2, "0"); // taste-skill-ignore
  const day = String(cursor.getDate()).padStart(2, "0"); // taste-skill-ignore
  return `${year}-${month}-${day}`;
};

export function AttendanceChecklist() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomId, setClassroomId] = useState("cls_10_mipa_1");
  const [date, setDate] = useState(defaultSchoolDate);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/academic/classrooms")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list: Classroom[] = json?.data ?? [];
        setClassrooms(list);
        if (list.length > 0 && !list.some((item) => item.id === classroomId)) {
          setClassroomId(list[0].id);
        }
      })
      .catch(() => setError("Gagal memuat daftar rombel"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSaved(false);
    setError(null);

    Promise.all([
      fetch(`/api/academic/classrooms/${classroomId}/students`),
      fetch(`/api/attendance/sessions?classroomId=${encodeURIComponent(classroomId)}&date=${date}`),
    ])
      .then(async ([studentsRes, sessionRes]) => {
        const studentsJson = studentsRes.ok ? await studentsRes.json() : { data: [] };
        const sessionJson = sessionRes.ok ? await sessionRes.json() : { data: null };
        if (cancelled) return;

        const statusByStudent = new Map<string, Status>(
          (sessionJson.data?.records ?? []).map((record: { studentId: string; status: Status }) => [
            record.studentId,
            record.status,
          ])
        );

        setStudents(
          (studentsJson.data ?? []).map((student: { id: string; name: string }) => ({
            id: student.id,
            name: student.name,
            status: statusByStudent.get(student.id) ?? "present",
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat data presensi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [classroomId, date]);

  const handleStatusChange = (id: string, status: Status) => {
    setStudents((current) => current.map((student) => (student.id === id ? { ...student, status } : student)));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          date,
          records: students.map((student) => ({ studentId: student.id, status: student.status })),
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal menyimpan presensi");
        return;
      }

      setSaved(true);
    } catch {
      setError("Gagal menyimpan presensi");
    } finally {
      setSaving(false);
    }
  };

  const activeClassroom = classrooms.find((item) => item.id === classroomId);

  return (
    <div className="space-y-6" data-ui>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#b8336a]" /> Presensi Harian Siswa
          </h3>
          <p className="text-xs text-[#5f6672] mt-0.5">
            Kelas: <strong>{activeClassroom?.name ?? "..."}</strong> &bull; Tanggal:{" "}
            <strong>
              {new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", { dateStyle: "long" })}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={classroomId}
            onChange={(event) => setClassroomId(event.target.value)}
            className="px-3 py-1.5 bg-white rounded text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
          >
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="px-3 py-1.5 bg-white rounded text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
          />
          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="inline-flex items-center gap-1.5 bg-[#247b50] hover:bg-[#1d6340] text-white text-xs font-medium px-3.5 py-1.5 rounded transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? "Menyimpan..." : "Simpan Presensi"}
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-[#dcfce7] text-[#14532d] text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4" /> Presensi berhasil disimpan ke D1.
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#ffedea] text-[#831c1e] text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
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
            {loading ? (
              <tr>
                <td colSpan={2} className="px-5 py-8 text-center text-[#5f6672]">
                  Memuat data siswa...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-5 py-8 text-center text-[#5f6672]">
                  Belum ada siswa pada rombel ini.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-[#f9fafb]">
                  <td className="px-5 py-3.5 font-medium text-[#111827]">{student.name}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      {statusLabels.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => handleStatusChange(student.id, status.value)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                            student.status === status.value
                              ? status.active
                              : "bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]"
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
