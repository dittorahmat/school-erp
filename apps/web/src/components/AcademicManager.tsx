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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" /> Manajemen Rombongan Belajar (Rombel)
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Tahun Ajaran Aktif: <strong className="text-indigo-600">2025/2026 (Semester Ganjil)</strong>
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Kalender Aktif
        </span>
      </div>

      <form onSubmit={handleAddClass} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="Nama Rombel (misal: X-MIPA-2)"
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <select
          value={gradeLevel}
          onChange={(e) => setGradeLevel(Number(e.target.value))}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Tambah Rombel
        </button>
      </form>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Memuat data rombel...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cls) => (
            <div key={cls.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900">{cls.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Tingkat {cls.gradeLevel} &bull; 32 Siswa</p>
              </div>
              <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
