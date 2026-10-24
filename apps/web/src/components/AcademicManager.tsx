import React, { useEffect, useState } from "react";
import { School, Plus, CheckCircle2, Calendar, Users } from "lucide-react";

interface AcademicYear {
  id: string;
  name: string;
  semester: "odd" | "even";
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

interface Classroom {
  id: string;
  name: string;
  gradeLevel: number;
  academicYearId: string;
  studentCount?: number;
  homeroomTeacher?: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
};

export function AcademicManager() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [gradeLevel, setGradeLevel] = useState(10);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [yearRes, classRes] = await Promise.all([
        fetch("/api/academic/years?active=true"),
        fetch("/api/academic/classrooms"),
      ]);

      if (yearRes.ok) {
        const json = await yearRes.json();
        setActiveYear(json.data ?? null);
      }
      if (classRes.ok) {
        const json = await classRes.json();
        setClassrooms(json.data || []);
      } else {
        setError("Gagal memuat data rombel");
      }
    } catch {
      setError("Gagal memuat data akademik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/academic/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassName.trim(),
          gradeLevel,
          academicYearId: activeYear?.id,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal menambahkan rombel");
        return;
      }

      setNewClassName("");
      await loadData();
    } catch {
      setError("Gagal menambahkan rombel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-ui>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <School className="w-4 h-4 text-accent" /> Manajemen Rombongan Belajar (Rombel)
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Tahun Ajaran Aktif:{" "}
            <strong className="text-accent">
              {activeYear
                ? `${activeYear.name} (Semester ${activeYear.semester === "odd" ? "Ganjil" : "Genap"})`
                : "Memuat..."}
            </strong>
            {activeYear?.startDate && activeYear?.endDate
              ? ` · ${formatDate(activeYear.startDate)} - ${formatDate(activeYear.endDate)}`
              : ""}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded bg-success-soft text-success-ink">
          <CheckCircle2 className="w-3.5 h-3.5" /> Kalender Aktif
        </span>
      </div>

      {error && (
        <div className="p-3 bg-danger-soft text-danger-ink text-xs rounded">{error}</div>
      )}

      <form onSubmit={handleAddClass} className="p-4 bg-white rounded-lg flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="Nama Rombel (misal: X-MIPA-3)"
          className="px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          required
        />
        <select
          value={gradeLevel}
          onChange={(e) => setGradeLevel(Number(e.target.value))}
          className="px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
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
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-3.5 py-1.5 rounded transition disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" /> {saving ? "Menyimpan..." : "Tambah Rombel"}
        </button>
      </form>

      {loading ? (
        <div className="p-8 text-center text-xs text-muted">Memuat data rombel...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cls) => (
            <div key={cls.id} className="p-4 bg-white rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-ink">{cls.name}</h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Tingkat {cls.gradeLevel} &bull; {cls.studentCount ?? 0} Siswa
                </p>
                <p className="text-[11px] text-muted mt-0.5 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {cls.homeroomTeacher || "Belum ditentukan"}
                </p>
              </div>
              <span className="p-2 bg-accent-soft rounded text-accent">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
