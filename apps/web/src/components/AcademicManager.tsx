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
  Edit2,
  Check,
  RotateCw,
  BookOpen,
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

interface Subject {
  id: string;
  code: string;
  name: string;
  gradeLevel: number;
  createdAt?: string;
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

  const [activeTab, setActiveTab] = useState<"classrooms" | "years" | "subjects">("classrooms");

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [teachers, setTeachers] = useState<TeacherStaff[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectGradeFilter, setSubjectGradeFilter] = useState<number | "all">("all");
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");

  // New subject form
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectGrade, setNewSubjectGrade] = useState(10);
  const [savingSubject, setSavingSubject] = useState(false);

  // Edit subject modal
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editSubjectCode, setEditSubjectCode] = useState("");
  const [editSubjectName, setEditSubjectName] = useState("");
  const [editSubjectGrade, setEditSubjectGrade] = useState(10);
  const [updatingSubject, setUpdatingSubject] = useState(false);

  // Delete subject
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New classroom form
  const [newClassName, setNewClassName] = useState("");
  const [gradeLevel, setGradeLevel] = useState(10);
  const [savingClass, setSavingClass] = useState(false);

  // Academic year forms & modals
  const [savingYear, setSavingYear] = useState(false);
  const [activatingYearId, setActivatingYearId] = useState<string | null>(null);
  const [newYearName, setNewYearName] = useState("");
  const [newYearSemester, setNewYearSemester] = useState<"odd" | "even">("odd");
  const [newYearStartDate, setNewYearStartDate] = useState("");
  const [newYearEndDate, setNewYearEndDate] = useState("");
  const [newYearIsActive, setNewYearIsActive] = useState(false);

  // Editing academic year modal
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editYearName, setEditYearName] = useState("");
  const [editYearSemester, setEditYearSemester] = useState<"odd" | "even">("odd");
  const [editYearStartDate, setEditYearStartDate] = useState("");
  const [editYearEndDate, setEditYearEndDate] = useState("");
  const [updatingYear, setUpdatingYear] = useState(false);

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
      const [allYearsRes, classRes, staffRes, subRes] = await Promise.all([
        fetch("/api/academic/years"),
        fetch("/api/academic/classrooms"),
        fetch("/api/staff"),
        fetch("/api/academic/subjects"),
      ]);

      if (allYearsRes.ok) {
        const json = await allYearsRes.json();
        const yearsList: AcademicYear[] = json.data || [];
        setYears(yearsList);
        const currentActive = yearsList.find((y) => y.isActive) ?? yearsList[0] ?? null;
        setActiveYear(currentActive);
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
      if (subRes.ok) {
        const json = await subRes.json();
        setSubjects(json.data || []);
      }
    } catch {
      setError("Gagal memuat data akademik");
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const res = await fetch("/api/academic/subjects");
      if (res.ok) {
        const json = await res.json();
        setSubjects(json.data || []);
      }
    } catch {
      setError("Gagal memuat data mata pelajaran");
    } finally {
      setSubjectsLoading(false);
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

    setSavingClass(true);
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
      setSavingClass(false);
    }
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim()) return;

    setSavingYear(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/academic/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newYearName.trim(),
          semester: newYearSemester,
          isActive: newYearIsActive,
          startDate: newYearStartDate || undefined,
          endDate: newYearEndDate || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal menambahkan tahun ajaran");
        return;
      }

      setNewYearName("");
      setNewYearSemester("odd");
      setNewYearStartDate("");
      setNewYearEndDate("");
      setNewYearIsActive(false);
      setSuccessMessage("Tahun ajaran baru berhasil dibuat");
      await loadData();
    } catch {
      setError("Gagal menambahkan tahun ajaran");
    } finally {
      setSavingYear(false);
    }
  };

  const handleActivateYear = async (yearId: string) => {
    setActivatingYearId(yearId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/academic/years/${yearId}/activate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal mengaktifkan tahun ajaran");
        return;
      }

      setSuccessMessage("Tahun ajaran berhasil diaktifkan sebagai kalender berjalan");
      await loadData();
    } catch {
      setError("Gagal mengaktifkan tahun ajaran");
    } finally {
      setActivatingYearId(null);
    }
  };

  const openEditYearModal = (year: AcademicYear) => {
    setEditingYear(year);
    setEditYearName(year.name);
    setEditYearSemester(year.semester);
    setEditYearStartDate(year.startDate || "");
    setEditYearEndDate(year.endDate || "");
  };

  const handleUpdateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear || !editYearName.trim()) return;

    setUpdatingYear(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/academic/years/${editingYear.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editYearName.trim(),
          semester: editYearSemester,
          startDate: editYearStartDate || null,
          endDate: editYearEndDate || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal memperbarui tahun ajaran");
        return;
      }

      setEditingYear(null);
      setSuccessMessage("Data tahun ajaran berhasil diperbarui");
      await loadData();
    } catch {
      setError("Gagal memperbarui tahun ajaran");
    } finally {
      setUpdatingYear(false);
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

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectCode.trim() || !newSubjectName.trim()) return;

    setSavingSubject(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/academic/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newSubjectCode.trim(),
          name: newSubjectName.trim(),
          gradeLevel: Number(newSubjectGrade),
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal menambahkan mata pelajaran");
        return;
      }

      setNewSubjectCode("");
      setNewSubjectName("");
      setNewSubjectGrade(10);
      setSuccessMessage("Mata pelajaran berhasil ditambahkan");
      await loadSubjects();
    } catch {
      setError("Terjadi kesalahan saat menambahkan mata pelajaran");
    } finally {
      setSavingSubject(false);
    }
  };

  const openEditSubjectModal = (subj: Subject) => {
    setEditingSubject(subj);
    setEditSubjectCode(subj.code);
    setEditSubjectName(subj.name);
    setEditSubjectGrade(subj.gradeLevel);
    setError(null);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    setUpdatingSubject(true);
    setError(null);

    try {
      const res = await fetch(`/api/academic/subjects/${editingSubject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editSubjectCode.trim(),
          name: editSubjectName.trim(),
          gradeLevel: Number(editSubjectGrade),
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal memperbarui mata pelajaran");
        return;
      }

      setEditingSubject(null);
      setSuccessMessage("Mata pelajaran berhasil diperbarui");
      await loadSubjects();
    } catch {
      setError("Terjadi kesalahan saat memperbarui mata pelajaran");
    } finally {
      setUpdatingSubject(false);
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus mata pelajaran "${name}"?`)) {
      return;
    }

    setDeletingSubjectId(id);
    setError(null);

    try {
      const res = await fetch(`/api/academic/subjects/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal menghapus mata pelajaran");
        return;
      }

      setSuccessMessage("Mata pelajaran berhasil dihapus");
      await loadSubjects();
    } catch {
      setError("Terjadi kesalahan saat menghapus mata pelajaran");
    } finally {
      setDeletingSubjectId(null);
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
      {/* Header and Active Year Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <School className="w-4 h-4 text-accent" /> Struktur & Kalender Akademik
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

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded bg-success-soft text-success-ink">
            <CheckCircle2 className="w-3.5 h-3.5" /> Kalender Aktif
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("classrooms")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
            activeTab === "classrooms"
              ? "bg-accent-soft text-accent-ink"
              : "text-muted hover:bg-ground"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Rombongan Belajar (Rombel)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("years")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
            activeTab === "years"
              ? "bg-accent-soft text-accent-ink"
              : "text-muted hover:bg-ground"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Tahun Ajaran & Semester
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
            activeTab === "subjects"
              ? "bg-accent-soft text-accent-ink"
              : "text-muted hover:bg-ground"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Mata Pelajaran
        </button>
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

      {/* TAB 1: CLASSROOMS (ROMBEL) */}
      {activeTab === "classrooms" && (
        <div className="space-y-6">
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
                disabled={savingClass}
                className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-3.5 py-1.5 rounded transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> {savingClass ? "Menyimpan..." : "Tambah Rombel"}
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
        </div>
      )}

      {/* TAB 2: ACADEMIC YEARS & SEMESTERS */}
      {activeTab === "years" && (
        <div className="space-y-6">
          {/* Form Create New Academic Year */}
          {isAdmin && (
            <div className="p-4 bg-white rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-accent" /> Tambah Tahun Ajaran Baru
              </h4>
              <form onSubmit={handleAddYear} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">
                    Nama Tahun Ajaran
                  </label>
                  <input
                    type="text"
                    value={newYearName}
                    onChange={(e) => setNewYearName(e.target.value)}
                    placeholder="misal: 2027/2028"
                    className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">
                    Semester
                  </label>
                  <select
                    value={newYearSemester}
                    onChange={(e) => setNewYearSemester(e.target.value as "odd" | "even")}
                    className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="odd">Ganjil</option>
                    <option value="even">Genap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={newYearStartDate}
                    onChange={(e) => setNewYearStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={newYearEndDate}
                    onChange={(e) => setNewYearEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newYearIsActive}
                      onChange={(e) => setNewYearIsActive(e.target.checked)}
                      className="rounded text-accent focus:ring-accent"
                    />
                    <span>Langsung Aktif</span>
                  </label>
                  <button
                    type="submit"
                    disabled={savingYear}
                    className="inline-flex items-center gap-1 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-3.5 py-1.5 rounded transition disabled:opacity-50 whitespace-nowrap ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> {savingYear ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Academic Years Table */}
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4 flex items-center justify-between bg-raised">
              <h4 className="text-xs font-bold text-ink flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-accent" /> Daftar Kalender & Tahun Ajaran
              </h4>
              <span className="text-[11px] text-muted">
                Total: <span className="tabular-nums font-semibold text-ink">{years.length}</span> Periode
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-muted">Memuat data tahun ajaran...</div>
            ) : years.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                Belum ada data tahun ajaran yang tercatat.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-ground text-muted text-[11px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Tahun Ajaran</th>
                    <th className="py-2.5 px-3">Semester</th>
                    <th className="py-2.5 px-3">Rentang Waktu</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    {isAdmin && <th className="py-2.5 px-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {years.map((year) => (
                    <tr key={year.id} className="hover:bg-ground transition">
                      <td className="py-2.5 px-3 font-medium text-ink">
                        {year.name}
                        {year.isActive && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-accent-soft text-accent">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-ink-soft">
                        Semester {year.semester === "odd" ? "Ganjil" : "Genap"}
                      </td>
                      <td className="py-2.5 px-3 text-muted tabular-nums text-[11px]">
                        {year.startDate && year.endDate
                          ? `${formatDate(year.startDate)} - ${formatDate(year.endDate)}`
                          : "Belum disetel"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {year.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-success-soft text-success-ink">
                            <Check className="w-3 h-3" /> Berjalan
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded bg-subtle text-muted">
                            Non-aktif
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {!year.isActive && (
                              <button
                                type="button"
                                onClick={() => handleActivateYear(year.id)}
                                disabled={activatingYearId === year.id}
                                className="inline-flex items-center gap-1 text-accent hover:text-accent-strong text-[11px] font-medium transition disabled:opacity-50"
                                title="Aktifkan sebagai tahun ajaran berjalan"
                              >
                                <RotateCw className={`w-3.5 h-3.5 ${activatingYearId === year.id ? "animate-spin" : ""}`} />
                                {activatingYearId === year.id ? "Mengaktifkan..." : "Aktifkan"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditYearModal(year)}
                              className="inline-flex items-center gap-1 text-ink-soft hover:text-ink text-[11px] font-medium transition ml-2"
                              title="Sunting data tahun ajaran"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-muted" /> Sunting
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECTS (MATA PELAJARAN) */}
      {activeTab === "subjects" && (
        <div className="space-y-6">
          {isAdmin && (
            <form
              onSubmit={handleAddSubject}
              className="p-4 bg-white rounded-lg flex flex-wrap items-center gap-3"
            >
              <input
                type="text"
                value={newSubjectCode}
                onChange={(e) => setNewSubjectCode(e.target.value)}
                placeholder="Kode Mapel (misal: MAT-10)"
                className="px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Nama Mata Pelajaran"
                className="px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent flex-1 min-w-[200px]"
                required
              />
              <select
                value={newSubjectGrade}
                onChange={(e) => setNewSubjectGrade(Number(e.target.value))}
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
                disabled={savingSubject}
                className="px-4 py-1.5 bg-accent text-white rounded text-xs font-semibold hover:bg-accent-strong transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {savingSubject ? "Menyimpan..." : "Tambah Mapel"}
              </button>
            </form>
          )}

          {/* Subjects Table with Filter */}
          <div className="bg-white rounded-lg overflow-hidden space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink">Filter Tingkat:</span>
                <select
                  value={subjectGradeFilter}
                  onChange={(e) =>
                    setSubjectGradeFilter(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                  className="px-2.5 py-1 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="all">Semua Tingkat</option>
                  <option value={7}>Kelas 7</option>
                  <option value={8}>Kelas 8</option>
                  <option value={9}>Kelas 9</option>
                  <option value={10}>Kelas 10</option>
                  <option value={11}>Kelas 11</option>
                  <option value={12}>Kelas 12</option>
                </select>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={subjectSearchQuery}
                  onChange={(e) => setSubjectSearchQuery(e.target.value)}
                  placeholder="Cari kode atau nama mapel..."
                  className="pl-8 pr-3 py-1 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent w-full sm:w-64"
                />
                <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {(() => {
              const filteredSubjects = subjects
                .filter((s) =>
                  subjectGradeFilter === "all" ? true : s.gradeLevel === subjectGradeFilter
                )
                .filter((s) => {
                  const q = subjectSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    s.name.toLowerCase().includes(q) ||
                    s.code.toLowerCase().includes(q)
                  );
                });

              if (subjectsLoading) {
                return (
                  <div className="p-8 text-center text-xs text-muted">
                    Memuat daftar mata pelajaran...
                  </div>
                );
              }

              if (filteredSubjects.length === 0) {
                return (
                  <div className="p-8 text-center text-xs text-muted">
                    Tidak ada mata pelajaran yang sesuai filter.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ground text-muted text-[11px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Kode</th>
                        <th className="py-2.5 px-3">Nama Mapel</th>
                        <th className="py-2.5 px-3">Tingkat Kelas</th>
                        {isAdmin && <th className="py-2.5 px-3 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubjects.map((subj) => (
                        <tr key={subj.id} className="hover:bg-ground transition">
                          <td className="py-2.5 px-3 font-semibold text-accent tabular-nums">
                            {subj.code}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-ink">
                            {subj.name}
                          </td>
                          <td className="py-2.5 px-3 text-ink-soft">
                            Kelas <span className="tabular-nums font-semibold">{subj.gradeLevel}</span>
                          </td>
                          {isAdmin && (
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditSubjectModal(subj)}
                                  className="inline-flex items-center gap-1 text-ink-soft hover:text-ink text-[11px] font-medium transition"
                                  title="Sunting mata pelajaran"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-muted" /> Sunting
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubject(subj.id, subj.name)}
                                  disabled={deletingSubjectId === subj.id}
                                  className="inline-flex items-center gap-1 text-danger-ink hover:text-danger-strong text-[11px] font-medium transition ml-2 disabled:opacity-50"
                                  title="Hapus mata pelajaran"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  {deletingSubjectId === subj.id ? "Menghapus..." : "Hapus"}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between bg-ground">
              <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-accent" /> Sunting Mata Pelajaran
              </h4>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="p-1 text-muted hover:text-ink rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubject} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Kode Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={editSubjectCode}
                  onChange={(e) => setEditSubjectCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={editSubjectName}
                  onChange={(e) => setEditSubjectName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Tingkat Kelas
                </label>
                <select
                  value={editSubjectGrade}
                  onChange={(e) => setEditSubjectGrade(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value={7}>Kelas 7</option>
                  <option value={8}>Kelas 8</option>
                  <option value={9}>Kelas 9</option>
                  <option value={10}>Kelas 10</option>
                  <option value={11}>Kelas 11</option>
                  <option value={12}>Kelas 12</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-1.5 bg-ground rounded text-xs font-medium text-muted hover:text-ink transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updatingSubject}
                  className="px-4 py-1.5 bg-accent text-white rounded text-xs font-semibold hover:bg-accent-strong transition disabled:opacity-50"
                >
                  {updatingSubject ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Academic Year Modal */}
      {editingYear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between bg-ground">
              <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-accent" /> Sunting Tahun Ajaran
              </h4>
              <button
                type="button"
                onClick={() => setEditingYear(null)}
                className="p-1 text-muted hover:text-ink rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateYear} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Nama Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={editYearName}
                  onChange={(e) => setEditYearName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Semester
                </label>
                <select
                  value={editYearSemester}
                  onChange={(e) => setEditYearSemester(e.target.value as "odd" | "even")}
                  className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="odd">Ganjil</option>
                  <option value="even">Genap</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={editYearStartDate}
                    onChange={(e) => setEditYearStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={editYearEndDate}
                    onChange={(e) => setEditYearEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-ground rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 bg-ground -mx-5 -mb-5 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setEditingYear(null)}
                  className="px-4 py-1.5 bg-white text-xs font-medium text-muted hover:text-ink rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updatingYear}
                  className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-4 py-1.5 rounded transition disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> {updatingYear ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
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
