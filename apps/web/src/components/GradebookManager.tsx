import React, { useEffect, useState } from "react";
import { BookOpen, AlertCircle, Check } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  gradeLevel: number;
}

interface Classroom {
  id: string;
  name: string;
  gradeLevel: number;
}

interface ScoreComponent {
  id: string;
  name: string;
  weight: number;
}

interface ScoreStudent {
  id: string;
  name: string;
  scores: Record<string, number>;
  finalScore: number;
  predicate: string;
}

interface Scorebook {
  subject: string;
  teacher: string;
  components: ScoreComponent[];
  students: ScoreStudent[];
}

interface ReportCard {
  student: {
    id: string;
    name: string;
    nisn: string;
    classroom: string;
    academicYear: string;
  };
  subjects: Array<{ name: string; score: number; predicate: string; notes: string }>;
  attendanceSummary: {
    present: number;
    sick: number;
    permit: number;
    absent: number;
    total: number;
    percentage: number;
  };
  gpa: number;
}

export function GradebookManager() {
  const [activeSubTab, setActiveSubTab] = useState<"gradebook" | "report">("gradebook");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjectId, setSubjectId] = useState("sub_mat");
  const [classroomId, setClassroomId] = useState("cls_10_mipa_1");
  const [scorebook, setScorebook] = useState<Scorebook | null>(null);
  const [edits, setEdits] = useState<Record<string, number | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportCard | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/academic/subjects?gradeLevel=10"), fetch("/api/academic/classrooms")])
      .then(async ([subjectRes, classRes]) => {
        const subjectJson = subjectRes.ok ? await subjectRes.json() : { data: [] };
        const classJson = classRes.ok ? await classRes.json() : { data: [] };
        setSubjects(subjectJson.data ?? []);
        setClassrooms(classJson.data ?? []);
      })
      .catch(() => setError("Gagal memuat daftar mapel dan kelas"));
  }, []);

  const loadScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/gradebook/scores?subjectId=${encodeURIComponent(subjectId)}&classroomId=${encodeURIComponent(classroomId)}`
      );
      if (!res.ok) {
        setError("Gagal memuat buku nilai");
        return;
      }
      const json = await res.json();
      setScorebook(json);
      setEdits({});
    } catch {
      setError("Gagal memuat buku nilai");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
  }, [subjectId, classroomId]);

  const handleSave = async () => {
    if (!scorebook) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const grades = scorebook.students.flatMap((student) =>
      scorebook.components
        .map((component) => {
          const key = `${student.id}:${component.id}`;
          const score = edits[key] ?? student.scores[component.id];
          return typeof score === "number"
            ? { studentId: student.id, componentId: component.id, score }
            : null;
        })
        .filter((grade): grade is { studentId: string; componentId: string; score: number } => grade !== null)
    );

    try {
      const res = await fetch("/api/gradebook/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, grades }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal menyimpan nilai");
        return;
      }

      setMessage(`${json.totalSaved} nilai berhasil disimpan.`);
      await loadScores();
    } catch {
      setError("Gagal menyimpan nilai");
    } finally {
      setSaving(false);
    }
  };

  const loadReport = async (studentId: string) => {
    setReportLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gradebook/report-card?studentId=${encodeURIComponent(studentId)}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal memuat rapor");
        return;
      }
      setReport(json);
    } catch {
      setError("Gagal memuat rapor");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "report" && scorebook?.students[0]) {
      loadReport(scorebook.students[0].id);
    }
  }, [activeSubTab, scorebook]);

  return (
    <div className="space-y-6" data-ui>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#b8336a]" /> Penilaian & Buku Nilai (Gradebook)
          </h3>
          <p className="text-xs text-[#5f6672] mt-0.5">
            {scorebook
              ? `Mata Pelajaran: ${scorebook.subject} · Guru: ${scorebook.teacher}`
              : "Memuat buku nilai..."}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#f3f4f6] p-1 rounded-md">
          <button
            onClick={() => setActiveSubTab("gradebook")}
            className={`px-3 py-1 text-xs font-semibold rounded transition ${
              activeSubTab === "gradebook" ? "bg-white text-[#b8336a]" : "text-[#5f6672] hover:text-[#111827]"
            }`}
          >
            Buku Nilai Guru
          </button>
          <button
            onClick={() => setActiveSubTab("report")}
            className={`px-3 py-1 text-xs font-semibold rounded transition ${
              activeSubTab === "report" ? "bg-white text-[#b8336a]" : "text-[#5f6672] hover:text-[#111827]"
            }`}
          >
            Preview Rapor Siswa
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-[#dcfce7] text-[#14532d] text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4" /> {message}
        </div>
      )}
      {error && (
        <div className="p-3 bg-[#ffedea] text-[#831c1e] text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {activeSubTab === "gradebook" ? (
        <>
          <div className="p-4 bg-white rounded-lg flex flex-wrap items-center gap-3">
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              className="px-3 py-1.5 bg-[#f9fafb] rounded text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <select
              value={classroomId}
              onChange={(event) => setClassroomId(event.target.value)}
              className="px-3 py-1.5 bg-[#f9fafb] rounded text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
            >
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={saving || !scorebook || scorebook.students.length === 0}
              className="inline-flex items-center gap-1.5 bg-[#b8336a] hover:bg-[#a12b5b] text-white text-xs font-medium px-3.5 py-1.5 rounded transition disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Nilai"}
            </button>
            <span className="text-[11px] text-[#5f6672]">
              Bobot: {scorebook?.components.map((component) => `${component.name} (${component.weight}%)`).join(" · ")}
            </span>
          </div>

          <div className="bg-white rounded-lg overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#5f6672]">Memuat nilai...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f9fafb] text-[11px] font-semibold text-[#5f6672]">
                  <tr>
                    <th className="px-5 py-3">Nama Siswa</th>
                    {scorebook?.components.map((component) => (
                      <th key={component.id} className="px-4 py-3 text-center">
                        {component.name} ({component.weight}%)
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center">Nilai Akhir</th>
                    <th className="px-4 py-3 text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  {scorebook?.students.map((student) => (
                    <tr key={student.id} className="hover:bg-[#f9fafb]">
                      <td className="px-5 py-3.5 font-medium text-[#111827]">{student.name}</td>
                      {scorebook.components.map((component) => {
                        const key = `${student.id}:${component.id}`;
                        const value = edits[key] ?? student.scores[component.id] ?? "";
                        return (
                          <td key={component.id} className="px-4 py-2.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={value}
                              onChange={(event) =>
                                setEdits((current) => ({
                                  ...current,
                                  [key]:
                                    event.target.value === ""
                                      ? undefined
                                      : Number(event.target.value),
                                }))
                              }
                              className="w-16 px-2 py-1 bg-[#f9fafb] rounded text-center text-xs text-[#111827] tabular-nums focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3.5 text-center font-bold text-[#b8336a] tabular-nums">
                        {student.finalScore || "-"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-[#dcfce7] text-[#14532d]">
                          {student.predicate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="p-6 bg-white rounded-lg space-y-6">
          {reportLoading || !report ? (
            <div className="p-8 text-center text-xs text-[#5f6672]">Memuat rapor...</div>
          ) : (
            <>
              <div className="pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#b8336a]">
                    Kartu Laporan Hasil Belajar (Rapor)
                  </span>
                  <h4 className="text-xl font-bold text-[#111827] mt-0.5">{report.student.name}</h4>
                  <p className="text-xs text-[#5f6672]">
                    NISN: {report.student.nisn} &bull; Kelas: {report.student.classroom} &bull;{" "}
                    {report.student.academicYear}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#5f6672]">Rata-rata Semester:</span>
                  <p className="text-2xl font-bold text-[#111827] tabular-nums">{report.gpa}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-xs text-[#111827]">Capaian Kompetensi Akademik:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.subjects.map((subject) => (
                    <div key={subject.name} className="p-4 bg-[#f9fafb] rounded text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <strong className="text-[#111827]">{subject.name}</strong>
                        <span className="text-[11px] font-bold text-[#14532d] bg-[#dcfce7] px-2 py-0.5 rounded">
                          Nilai: {subject.score} ({subject.predicate})
                        </span>
                      </div>
                      <p className="text-xs text-[#5f6672]">{subject.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#fdf2f7] rounded text-xs text-[#6b1d3e] flex items-center justify-between">
                <span>
                  Rekap Kehadiran: Hadir {report.attendanceSummary.present} hari &bull; Sakit{" "}
                  {report.attendanceSummary.sick} hari &bull; Izin {report.attendanceSummary.permit}{" "}
                  hari &bull; Alpa {report.attendanceSummary.absent} hari
                </span>
                <span className="font-bold tabular-nums">
                  Kehadiran {report.attendanceSummary.percentage}%
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
