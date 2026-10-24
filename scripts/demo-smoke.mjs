const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const base = readFlag("base", process.env.DEMO_BASE_URL || "http://localhost:8787").replace(/\/$/, "");
const checks = [];

function check(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function request(path, { token, method = "GET", body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: response.status, ok: response.ok, json };
}

async function login(username, password) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });
  if (!result.ok || !result.json?.token) {
    throw new Error(`Login ${username} gagal: ${result.status} ${JSON.stringify(result.json)}`);
  }
  return result.json.token;
}

try {
  console.log(`Smoke test demo School ERP terhadap ${base}\n`);

  const health = await request("/api/health");
  check("health endpoint", health.ok && health.json?.status === "ok");

  const admin = await login("admin", "admin123");
  const teacher = await login("guru_budi", "guru123");
  const student = await login("siswa_ahmad", "siswa123");
  const guardian = await login("wali_subagyo", "wali123");
  const guardianSingle = await login("wali_hartono", "wali123");
  check("login lima peran", Boolean(admin && teacher && student && guardian && guardianSingle));

  const seed = await request("/api/admin/seed-demo", { token: admin, method: "POST" });
  check("seeder idempoten", seed.ok && seed.json?.counts?.users >= 17, `users=${seed.json?.counts?.users}`);

  const year = await request("/api/academic/years?active=true", { token: admin });
  check(
    "tahun ajaran aktif 2026/2027",
    year.ok && year.json?.data?.name === "2026/2027" && year.json?.data?.startDate === "2026-07-13",
    year.json?.data?.name
  );

  const classrooms = await request("/api/academic/classrooms", { token: admin });
  check("enam rombel tersedia", classrooms.ok && classrooms.json?.data?.length >= 6);
  const roster = await request("/api/academic/classrooms/cls_10_mipa_1/students", { token: admin });
  check("roster X-MIPA-1 berisi 5 siswa", roster.ok && roster.json?.data?.length === 5);

  const session = await request("/api/attendance/sessions?classroomId=cls_10_mipa_1&date=2026-10-23", {
    token: teacher,
  });
  check("sesi presensi 23 Okt 2026 tersedia", session.ok && session.json?.data?.records?.length === 5);

  const saveAttendance = await request("/api/attendance/session", {
    token: teacher,
    method: "POST",
    body: {
      classroomId: "cls_10_mipa_1",
      date: "2026-10-23",
      records: roster.json.data.map((item) => ({ studentId: item.id, status: "present" })),
    },
  });
  check("simpan presensi", saveAttendance.ok, saveAttendance.json?.message);

  const recap = await request("/api/attendance/summary?studentId=usr_student_1", { token: student });
  check(
    "rekap Ahmad 42/2/1/0 (93.3%)",
    recap.ok &&
      recap.json?.data?.present === 42 &&
      recap.json?.data?.sick === 2 &&
      recap.json?.data?.permit === 1 &&
      recap.json?.data?.absent === 0 &&
      recap.json?.data?.percentage === 93.3,
    JSON.stringify(recap.json?.data)
  );

  const forbiddenAttendance = await request("/api/attendance/summary?studentId=usr_student_2", {
    token: student,
  });
  check("siswa tidak bisa membaca presensi siswa lain", forbiddenAttendance.status === 403);

  const invoices = await request("/api/finance/invoices", { token: admin });
  check("tagihan dibaca dari D1", invoices.ok && invoices.json?.data?.length >= 25, `count=${invoices.json?.data?.length}`);

  const ownInvoices = await request("/api/finance/invoices", { token: student });
  check(
    "siswa hanya melihat tagihannya",
    ownInvoices.ok && ownInvoices.json.data.every((invoice) => invoice.studentId === "usr_student_1")
  );

  const batch = await request("/api/finance/batch-generate", {
    token: admin,
    method: "POST",
    body: { month: "2026-12" },
  });
  const batchAgain = await request("/api/finance/batch-generate", {
    token: admin,
    method: "POST",
    body: { month: "2026-12" },
  });
  check("penerbitan massal idempoten", batch.ok && batchAgain.ok && batchAgain.json.generatedCount === 0);

  const form = new FormData();
  form.append("invoiceId", "INV-2026-10-001");
  form.append("proof", new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }), "proof.png");
  const upload = await request("/api/finance/upload-proof", { token: student, method: "POST", form });
  check("unggah bukti ke R2", upload.ok && upload.json?.status === "pending", upload.json?.key);

  const verify = await request("/api/finance/verify", {
    token: admin,
    method: "POST",
    body: { invoiceId: "INV-2026-10-001", status: "paid" },
  });
  check("verifikasi admin menjadi lunas", verify.ok && verify.json?.status === "paid");

  const forbiddenVerify = await request("/api/finance/verify", {
    token: student,
    method: "POST",
    body: { invoiceId: "INV-2026-10-002", status: "paid" },
  });
  check("siswa tidak bisa memverifikasi tagihan", forbiddenVerify.status === 403);

  const scorebook = await request("/api/gradebook/scores?subjectId=sub_mat&classroomId=cls_10_mipa_1", {
    token: teacher,
  });
  check("buku nilai Matematika tersedia", scorebook.ok && scorebook.json?.students?.length === 5);

  const saveGrade = await request("/api/gradebook/save", {
    token: teacher,
    method: "POST",
    body: {
      subjectId: "sub_mat",
      grades: [{ studentId: "usr_student_1", componentId: "comp_mat_tugas", score: 90 }],
    },
  });
  check("simpan nilai", saveGrade.ok);

  const updatedScores = await request("/api/gradebook/scores?subjectId=sub_mat&classroomId=cls_10_mipa_1", {
    token: teacher,
  });
  const ahmadScore = updatedScores.json?.students?.find((item) => item.id === "usr_student_1");
  check("nilai akhir terhitung ulang menjadi 88.5", ahmadScore?.finalScore === 88.5, `${ahmadScore?.finalScore}`);

  const invalidGrade = await request("/api/gradebook/save", {
    token: teacher,
    method: "POST",
    body: {
      subjectId: "sub_mat",
      grades: [{ studentId: "usr_student_1", componentId: "comp_mat_tugas", score: 101 }],
    },
  });
  check("nilai di luar 0-100 ditolak", invalidGrade.status === 400);

  const report = await request("/api/gradebook/report-card?studentId=usr_student_1", { token: guardian });
  check(
    "rapor dihitung dari nilai dan presensi",
    report.ok && report.json?.subjects?.length === 4 && report.json?.attendanceSummary?.present === 42,
    `gpa=${report.json?.gpa}`
  );

  const loans = await request("/api/inventory/loans", { token: admin });
  check("pinjaman terlambat terdeteksi", loans.ok && loans.json.loans.some((loan) => loan.status === "overdue"));

  const units = await request("/api/inventory/asset-units", { token: admin });
  const available = units.json.units.find(
    (unit) => unit.status === "available" && unit.itemId === "itm_mikroskop"
  );
  const loan = await request("/api/inventory/loans", {
    token: teacher,
    method: "POST",
    body: {
      unitId: available.id,
      expectedReturnDate: "2026-11-02",
      purpose: "Smoke test sirkulasi aset",
    },
  });
  check("pengajuan pinjaman", loan.ok, loan.json?.loan?.id);

  const approve = await request(`/api/inventory/loans/${loan.json.loan.id}/approval`, {
    token: admin,
    method: "POST",
    body: { action: "approve" },
  });
  check("persetujuan pinjaman", approve.ok);

  const approveAgain = await request(`/api/inventory/loans/${loan.json.loan.id}/approval`, {
    token: admin,
    method: "POST",
    body: { action: "approve" },
  });
  check("approval ganda ditolak", approveAgain.status === 400);

  const returned = await request(`/api/inventory/loans/${loan.json.loan.id}/return`, {
    token: admin,
    method: "POST",
    body: { returnCondition: "good", inspectionNotes: "Kembali lengkap" },
  });
  check("inspeksi pengembalian", returned.ok);

  const returnAgain = await request(`/api/inventory/loans/${loan.json.loan.id}/return`, {
    token: admin,
    method: "POST",
    body: { returnCondition: "good" },
  });
  check("pengembalian ganda ditolak", returnAgain.status === 400);

  const beforeStock = await request("/api/inventory/stock-movements?itemId=itm_spidol", { token: admin });
  const beforeBalance = beforeStock.json.movements[0]?.balanceAfter ?? 0;

  const requisition = await request("/api/inventory/requisitions", {
    token: teacher,
    method: "POST",
    body: { itemId: "itm_spidol", quantity: 1, reason: "Smoke test requisisi" },
  });
  check("pengajuan requisisi", requisition.ok);

  const approveRequisition = await request(
    `/api/inventory/requisitions/${requisition.json.requisition.id}/approval`,
    { token: admin, method: "POST", body: { action: "approve" } }
  );
  check("persetujuan requisisi", approveRequisition.ok);

  const afterStock = await request("/api/inventory/stock-movements?itemId=itm_spidol", { token: admin });
  check(
    "approval requisisi memotong stok",
    afterStock.json.movements[0]?.balanceAfter === beforeBalance - 1,
    `${beforeBalance} -> ${afterStock.json.movements[0]?.balanceAfter}`
  );

  const children = await request("/api/parent/children", { token: guardian });
  check(
    "wali multi-anak melihat 2 anak",
    children.ok && children.json?.data?.length === 2,
    children.json?.data?.map((child) => child.name).join(", ")
  );

  const singleChild = await request("/api/parent/children", { token: guardianSingle });
  check(
    "wali tunggal hanya melihat 1 anak",
    singleChild.ok && singleChild.json?.data?.length === 1 && singleChild.json.data[0].name === "Budi Santoso"
  );

  const dashboard = await request("/api/dashboard/summary", { token: admin });
  check(
    "dashboard memakai data nyata",
    dashboard.ok &&
      dashboard.json?.data?.students === 12 &&
      dashboard.json?.data?.attendance?.date === "2026-10-23",
    JSON.stringify(dashboard.json?.data)
  );
} catch (error) {
  check("smoke test selesai tanpa exception", false, error.message);
}

const failed = checks.filter((item) => !item.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} pemeriksaan lulus.`);
if (failed.length > 0) {
  console.error("Gagal:", failed.map((item) => item.name).join(", "));
  process.exitCode = 1;
}
