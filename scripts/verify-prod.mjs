#!/usr/bin/env node
// Read-only production verification for the demo. Never mutates data: it only
// logs in and issues GETs, so it is safe to run against the live Worker.
//
//   node scripts/verify-prod.mjs [--base=https://school-erp.tech1solusi.workers.dev]
import { requireServer, resolveBase } from "./lib/server.mjs";

const baseFlag = process.argv.find((arg) => arg.startsWith("--base="));
const base = resolveBase(
  baseFlag ? baseFlag.slice("--base=".length) : undefined,
  "https://school-erp.tech1solusi.workers.dev"
);

await requireServer(base, "pnpm deploy");

const checks = [];
const check = (name, ok, detail = "") => {
  checks.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

async function login(username, password) {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.token) throw new Error(`login ${username}: ${response.status}`);
  return { token: json.token, user: json.user };
}

async function get(path, token) {
  const response = await fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, json };
}

try {
  console.log(`Verifikasi produksi (read-only) terhadap ${base}\n`);

  const health = await get("/api/health");
  check("health", health.ok && health.json?.status === "ok");

  const roles = {};
  for (const [role, [username, password]] of Object.entries({
    admin: ["admin", "admin123"],
    teacher: ["guru_budi", "guru123"],
    student: ["siswa_ahmad", "siswa123"],
    guardian: ["wali_subagyo", "wali123"],
  })) {
    const session = await login(username, password);
    roles[role] = session;
    check(`login ${role} dari database`, session.user?.username === username, session.user?.fullName);
  }

  const year = await get("/api/academic/years?active=true", roles.admin.token);
  check(
    "tahun ajaran aktif 2026/2027 Ganjil",
    year.json?.data?.name === "2026/2027" &&
      year.json?.data?.semester === "odd" &&
      year.json?.data?.startDate === "2026-07-13" &&
      year.json?.data?.endDate === "2026-12-18",
    `${year.json?.data?.name} ${year.json?.data?.startDate}..${year.json?.data?.endDate}`
  );

  const dashboard = await get("/api/dashboard/summary", roles.admin.token);
  check(
    "dashboard memakai data D1",
    dashboard.json?.data?.students === 12 && dashboard.json?.data?.classrooms === 6,
    `${dashboard.json?.data?.students} siswa / ${dashboard.json?.data?.classrooms} rombel`
  );

  const children = await get("/api/parent/children", roles.guardian.token);
  check(
    "portal wali menampilkan 2 anak",
    children.json?.data?.length === 2,
    children.json?.data?.map((child) => child.name).join(" + ")
  );

  const invoices = await get("/api/finance/invoices", roles.admin.token);
  check("tagihan terbaca dari D1", (invoices.json?.data?.length ?? 0) >= 25, `${invoices.json?.data?.length}`);

  for (const [label, path] of [
    ["roster", "/api/academic/classrooms/cls_10_mipa_1/students"],
    ["buku nilai", "/api/gradebook/scores?subjectId=sub_mat&classroomId=cls_10_mipa_1"],
    ["sesi presensi", "/api/attendance/sessions?classroomId=cls_10_mipa_1&date=2026-10-23"],
  ]) {
    const denied = await get(path, roles.student.token);
    const allowed = await get(path, roles.teacher.token);
    check(`RBAC ${label}: siswa 403, guru 200`, denied.status === 403 && allowed.status === 200, `${denied.status}/${allowed.status}`);
  }

  const unknown = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "penyusup", password: "x" }),
  });
  check("username tak dikenal ditolak", unknown.status === 401, `${unknown.status}`);
} catch (error) {
  check("verifikasi selesai tanpa exception", false, error.message);
}

const failed = checks.filter((item) => !item.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} pemeriksaan lulus.`);
if (failed.length > 0) {
  console.error("Gagal:", failed.map((item) => item.name).join(", "));
  process.exitCode = 1;
}
