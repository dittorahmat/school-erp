import React, { useState, useEffect } from "react";
import { School, Plus, CheckCircle2, Calendar } from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  gradeLevel: number;
  academicYearId: string;
}

export function AcademicManager() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [gradeLevel, setGradeLevel] = useState(10);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/academic/classrooms");
        if (res.ok) {
          const json = await res.json();
          setClassrooms(json.data || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;

    const newClass: Classroom = {
      id: `cls_${Date.now()}`,
      name: newClassName,
      gradeLevel,
      academicYearId: "ay_2025_2026",
    };

    setClassrooms([...classrooms, newClass]);
    setNewClassName("");
  };

  return (
    <div className="space-y-6" data-ui>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <School className="w-4 h-4 text-[#b8336a]" /> Manajemen Rombongan Belajar (Rombel)
          </h3>
          <p className="text-xs text-[#5f6672] mt-0.5">
            Tahun Ajaran Aktif: <strong className="text-[#b8336a]">2025/2026 (Semester Ganjil)</strong>
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded bg-[#dcfce7] text-[#14532d]">
          <CheckCircle2 className="w-3.5 h-3.5" /> Kalender Aktif
        </span>
      </div>

      <form onSubmit={handleAddClass} className="p-4 bg-white rounded-lg flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="Nama Rombel (misal: X-MIPA-2)"
          className="px-3 py-1.5 bg-[#f9fafb] rounded text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
          required
        />
        <select
          value={gradeLevel}
          onChange={(e) => setGradeLevel(Number(e.target.value))}
          className="px-3 py-1.5 bg-[#f9fafb] rounded text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
        >
          <option value={7}>Kelas 7</option>
          <option value={8}>Kelas 8</option>
          <option value={9}>Kelas 9</option>
          <option value={10}>Kelas 10</option>
          <option value={11}>Kelas 11</option>
          <option value={12}>Kelas 12</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 bg-[#b8336a] hover:bg-[#a12b5b] text-white text-xs font-medium px-3.5 py-1.5 rounded transition"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Rombel
        </button>
      </form>

      {loading ? (
        <div className="p-8 text-center text-xs text-[#5f6672]">Memuat data rombel...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cls) => (
            <div key={cls.id} className="p-4 bg-white rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-[#111827]">{cls.name}</h4>
                <p className="text-[11px] text-[#5f6672] mt-0.5">Tingkat {cls.gradeLevel} &bull; 32 Siswa</p>
              </div>
              <span className="p-2 bg-[#fdf2f7] rounded text-[#b8336a]">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
