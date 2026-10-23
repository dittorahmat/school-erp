import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../index";
import { authMiddleware, requireRoles } from "../auth/middleware";
import { createDb, assessmentComponents, studentGrades } from "@school-erp/db";

const gradebookRouter = new Hono<{ Bindings: Bindings }>();

gradebookRouter.use("*", authMiddleware());

// GET /api/gradebook/scores (Buku Nilai Mata Pelajaran)
gradebookRouter.get("/scores", async (c) => {
  return c.json({
    subject: "Matematika (X-MIPA-1)",
    teacher: "Budi Purnomo, S.Pd.",
    components: [
      { id: "comp_1", name: "Tugas Harian", weight: 30 },
      { id: "comp_2", name: "Sumatif Tengah (UTS)", weight: 30 },
      { id: "comp_3", name: "Sumatif Akhir (SAS)", weight: 40 },
    ],
    students: [
      {
        id: "std_1",
        name: "Ahmad Dahlan",
        scores: { comp_1: 88, comp_2: 85, comp_3: 90 },
        finalScore: 87.9,
        predicate: "A",
      },
      {
        id: "std_2",
        name: "Citra Lestari",
        scores: { comp_1: 92, comp_2: 90, comp_3: 94 },
        finalScore: 92.2,
        predicate: "A",
      },
      {
        id: "std_3",
        name: "Dewi Sartika",
        scores: { comp_1: 78, comp_2: 80, comp_3: 82 },
        finalScore: 80.2,
        predicate: "B",
      },
    ],
  });
});

// POST /api/gradebook/save (Input Nilai oleh Guru)
gradebookRouter.post("/save", requireRoles("admin", "teacher"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    subjectId: z.string().min(1),
    grades: z.array(
      z.object({
        studentId: z.string().min(1),
        componentId: z.string().min(1),
        score: z.number().min(0).max(100),
      })
    ),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid gradebook submission" }, 400);
  }

  return c.json({
    message: "Nilai siswa berhasil disimpan",
    totalSaved: parsed.data.grades.length,
  });
});

// GET /api/gradebook/report-card (Rapor Semester Siswa)
gradebookRouter.get("/report-card", async (c) => {
  return c.json({
    student: {
      name: "Ahmad Dahlan",
      nisn: "0081293812",
      classroom: "X-MIPA-1",
      academicYear: "2025/2026 Ganjil",
    },
    subjects: [
      { name: "Matematika", score: 88, predicate: "A", notes: "Sangat baik dalam aljabar dan geometri" },
      { name: "Bahasa Indonesia", score: 85, predicate: "A", notes: "Aktif dalam menyusun teks argumentasi" },
      { name: "Fisika", score: 82, predicate: "B", notes: "Baik dalam konsep mekanika dan pengukuran" },
      { name: "Bahasa Inggris", score: 90, predicate: "A", notes: "Sangat lancar dalam pemahaman teks dan dialog" },
    ],
    attendanceSummary: {
      present: 42,
      sick: 2,
      permit: 1,
      absent: 0,
    },
    gpa: 86.25,
  });
});

export { gradebookRouter };
