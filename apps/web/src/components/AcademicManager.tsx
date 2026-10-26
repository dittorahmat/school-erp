import React, { useEffect, useState } from "react";
import {
  School,
  Plus,
  CheckCircle2,
  Calendar,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  X,
  Search,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
  homeroomTeacherId?: string | null;
  studentCount?: number;
  homeroomTeacher?: string;
}

interface TeacherStaff {
  id: string;
  fullName: string;
  role: string;
}

interface ClassroomStudent {
  id: string;
  name: string;
  username: string;
}

interface AvailableStudent {
  id: string;
  fullName: string;
  username: string;
  currentClassroom: string | null;
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
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [teachers, setTeachers] = useState<TeacherStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New classroom form
  const [newClassName, setNewClassName] = useState("");
  const [gradeLevel, setGradeLevel] = useState(10);
  const [saving, setSaving] = useState(false);

  // Rombel detail / students modal
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [classroomStudents, setClassroomStudents] = useState<ClassroomStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  // Student enrollment form in modal
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);

  // Homeroom assignment in card/modal
  const [updatingHomeroomClassId, setUpdatingHomeroomClassId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [yearRes, classRes, staffRes] = await Promise.all([
        fetch("/api/academic/years?active=true"),
        fetch("/api/academic/classrooms"),
        fetch("/api/staff"),
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
      if (staffRes.ok) {
        const json = await staffRes.json();
        const staffList: TeacherStaff[] = json.data || [];
        setTeachers(staffList.filter((s) => s.role === "teacher" || s.role === "admin"));
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

  const loadClassroomStudents = async (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const [studRes, allStudRes] = await Promise.all([
        fetch(`/api/academic/classrooms/${classroom.id}/students`),
        fetch("/api/academic/students"),
      ]);

      if (studRes.ok) {
        const json = await studRes.json();
        setClassroomStudents(json.data || []);
      } else {
        setStudentsError("Gagal memuat daftar siswa rombel");
      }

      if (allStudRes.ok) {
        const json = await allStudRes.json();
        setAvailableStudents(json.data || []);
      }
    } catch {
      setStudentsError("Terjadi kesalahan memuat data siswa");
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);
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
      setSuccessMessage("Rombel baru berhasil ditambahkan");
      await loadData();
    } catch {
      setError("Gagal menambahkan rombel");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignHomeroom = async (classroomId: string, teacherId: string | null) => {
    setUpdatingHomeroomClassId(classroomId);
    setError(null);
    try {
      const res = await fetch(`/api/academic/classrooms/${classroomId}/homeroom`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeroomTeacherId: teacherId || null }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal memperbarui wali kelas");
        return;
      }

      setSuccessMessage("Wali kelas berhasil diperbarui");
      await loadData();
      if (selectedClassroom && selectedClassroom.id === classroomId) {
        const updatedTeacher = teachers.find((t) => t.id === teacherId);
        setSelectedClassroom({
          ...selectedClassroom,
          homeroomTeacherId: teacherId,
          homeroomTeacher: updatedTeacher ? updatedTeacher.fullName : "Belum ditentukan",
        });
      }
    } catch {
      setError("Gagal memperbarui wali kelas");
    } finally {
      setUpdatingHomeroomClassId(null);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom || !selectedStudentToEnroll) return;

    setEnrolling(true);
    setStudentsError(null);
    try {
      const res = await fetch(`/api/academic/classrooms/${selectedClassroom.id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentToEnroll }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setStudentsError(json?.error || "Gagal mendaftarkan siswa ke rombel");
        return;
      }

      setSelectedStudentToEnroll("");
      setStudentSearchQuery("");
      await loadClassroomStudents(selectedClassroom);
      await loadData();
    } catch {
      setStudentsError("Gagal mendaftarkan siswa");
    } finally {
      setEnrolling(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClassroom) return;
    setRemovingStudentId(studentId);
    setStudentsError(null);
    try {
      const res = await fetch(
        `/api/academic/classrooms/${selectedClassroom.id}/enroll/${studentId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setStudentsError(json?.error || "Gagal mengeluarkan siswa");
        return;
      }

      await loadClassroomStudents(selectedClassroom);
      await loadData();
    } catch {
      setStudentsError("Gagal mengeluarkan siswa");
    } finally {
      setRemovingStudentId(null);
    }
  };

  // Candidates for enrollment (students not yet in this classroom)
  const enrolledStudentIds = new Set(classroomStudents.map((s) => s.id));
  const candidateStudents = availableStudents
    .filter((s) => !enrolledStudentIds.has(s.id))
    .filter(
      (s) =>
        s.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        s.username.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );

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
        <div className="p-3 bg-danger-soft text-danger-ink text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-success-soft text-success-ink text-xs rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMessage}
        </div>
      )}

      {isAdmin && (
        <form
          onSubmit={handleAddClass}
          className="p-4 bg-white rounded-lg flex flex-wrap items-center gap-3"
        >
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
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-muted">Memuat data rombel...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cls) => (
            <div
              key={cls.id}
              className="p-4 bg-white rounded-lg flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-ink">{cls.name}</h4>
                  <p className="text-[11px] text-muted mt-0.5">
                    Tingkat {cls.gradeLevel} &bull;{" "}
                    <span className="tabular-nums font-medium text-ink">
                      {cls.studentCount ?? 0}
                    </span>{" "}
                    Siswa
                  </p>
                </div>
                <span className="p-2 bg-accent-soft rounded text-accent">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>

              {/* Wali Kelas Selector / Display */}
              <div className="pt-2 flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-accent" /> Wali Kelas
                </span>
                {isAdmin ? (
                  <select
                    value={cls.homeroomTeacherId || ""}
                    onChange={(e) => handleAssignHomeroom(cls.id, e.target.value || null)}
                    disabled={updatingHomeroomClassId === cls.id}
                    className="w-full px-2 py-1 bg-ground rounded text-[11px] text-ink focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                  >
                    <option value="">-- Belum Ditentukan --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-ink flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted" />{" "}
                    {cls.homeroomTeacher || "Belum ditentukan"}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => loadClassroomStudents(cls)}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-ground hover:bg-subtle text-ink-soft text-xs font-medium px-3 py-1.5 rounded transition"
                >
                  <Users className="w-3.5 h-3.5 text-accent" /> Kelola Anggota Siswa (
                  <span className="tabular-nums">{cls.studentCount ?? 0}</span>)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Classroom Students & Enrollment Modal */}
      {selectedClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 flex items-center justify-between bg-ground">
              <div>
                <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                  <School className="w-4 h-4 text-accent" /> Anggota Rombel: {selectedClassroom.name}
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Tingkat {selectedClassroom.gradeLevel} &bull; Wali Kelas:{" "}
                  <strong className="text-ink">
                    {selectedClassroom.homeroomTeacher || "Belum ditentukan"}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClassroom(null)}
                className="p-1 text-muted hover:text-ink rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {studentsError && (
                <div className="p-3 bg-danger-soft text-danger-ink text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {studentsError}
                </div>
              )}

              {/* Add Student Section (Admin only) */}
              {isAdmin && (
                <div className="p-4 bg-ground rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-accent" /> Tambah Siswa ke Rombel Ini
                    </span>
                    <span className="text-[11px] text-muted">
                      Tersedia:{" "}
                      <span className="tabular-nums font-semibold text-ink">
                        {candidateStudents.length}
                      </span>{" "}
                      siswa
                    </span>
                  </div>

                  <form onSubmit={handleEnrollStudent} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        placeholder="Cari nama atau username siswa..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <select
                      value={selectedStudentToEnroll}
                      onChange={(e) => setSelectedStudentToEnroll(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                      required
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {candidateStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.username})
                          {s.currentClassroom ? ` · Rombel saat ini: ${s.currentClassroom}` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={enrolling || !selectedStudentToEnroll}
                      className="inline-flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-4 py-1.5 rounded transition disabled:opacity-50 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" /> {enrolling ? "Menambahkan..." : "Masukkan"}
                    </button>
                  </form>
                </div>
              )}

              {/* Student List in Classroom */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-ink">
                    Daftar Siswa Terdaftar (
                    <span className="tabular-nums">{classroomStudents.length}</span>)
                  </h5>
                </div>

                {studentsLoading ? (
                  <div className="p-8 text-center text-xs text-muted">
                    Memuat daftar siswa rombel...
                  </div>
                ) : classroomStudents.length === 0 ? (
                  <div className="p-8 text-center bg-ground rounded text-xs text-muted">
                    Belum ada siswa yang ditempatkan di rombel ini.
                  </div>
                ) : (
                  <div className="bg-white rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-ground text-muted text-[11px] font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Nama Siswa</th>
                          <th className="py-2.5 px-3">Username</th>
                          {isAdmin && <th className="py-2.5 px-3 text-right">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {classroomStudents.map((student, idx) => (
                          <tr key={student.id} className="hover:bg-ground transition">
                            <td className="py-2.5 px-3 text-center text-muted tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-ink">{student.name}</td>
                            <td className="py-2.5 px-3 text-muted tabular-nums text-[11px]">
                              {student.username}
                            </td>
                            {isAdmin && (
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudent(student.id)}
                                  disabled={removingStudentId === student.id}
                                  className="inline-flex items-center gap-1 text-danger-ink hover:text-danger-strong text-[11px] font-medium transition disabled:opacity-50"
                                  title="Keluarkan siswa dari rombel"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />{" "}
                                  {removingStudentId === student.id ? "Mengeluarkan..." : "Keluarkan"}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-ground flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedClassroom(null)}
                className="px-4 py-1.5 bg-white rounded text-xs font-medium text-ink hover:bg-subtle transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
