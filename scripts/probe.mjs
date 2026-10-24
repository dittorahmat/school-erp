#!/usr/bin/env node
// One-shot API probe. Replaces hand-rolled PowerShell request blocks.
//
//   node scripts/probe.mjs <role> <METHOD> <path> [jsonBody] [--base=url]
//   node scripts/probe.mjs siswa GET /api/attendance/summary
//   node scripts/probe.mjs admin POST /api/finance/batch-generate '{"month":"2026-11"}'
//
// Prints the status line and the body, then exits 1 on a 4xx/5xx response.
const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const baseFlag = process.argv.find((arg) => arg.startsWith("--base="));
const base = (baseFlag ? baseFlag.slice("--base=".length) : process.env.DEMO_BASE_URL || "http://localhost:8787").replace(/\/$/, "");

const ACCOUNTS = {
  admin: ["admin", "admin123"],
  guru: ["guru_budi", "guru123"],
  guru2: ["guru_siti", "guru123"],
  siswa: ["siswa_ahmad", "siswa123"],
  siswa2: ["siswa_dewi", "siswa123"],
  wali: ["wali_subagyo", "wali123"],
  wali2: ["wali_hartono", "wali123"],
};

const [role, method = "GET", path, bodyText] = args;

if (!role || !path) {
  console.error("usage: node scripts/probe.mjs <role> <METHOD> <path> [jsonBody] [--base=url]");
  console.error(`roles: ${Object.keys(ACCOUNTS).join(", ")}`);
  process.exit(2);
}

const account = ACCOUNTS[role];
if (!account) {
  console.error(`unknown role: ${role} (expected ${Object.keys(ACCOUNTS).join(", ")})`);
  process.exit(2);
}

const loginResponse = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: account[0], password: account[1] }),
});
const login = await loginResponse.json().catch(() => null);
if (!loginResponse.ok || !login?.token) {
  console.error(`login ${role} failed: ${loginResponse.status} ${JSON.stringify(login)}`);
  process.exit(1);
}

const response = await fetch(`${base}${path}`, {
  method,
  headers: {
    Authorization: `Bearer ${login.token}`,
    ...(bodyText ? { "Content-Type": "application/json" } : {}),
  },
  body: bodyText,
});
const text = await response.text();
let parsed = text;
try {
  parsed = JSON.parse(text);
} catch {
  // plain text stays as-is
}

console.log(`${method} ${path} as ${role} -> ${response.status} ${response.statusText}`);
console.log(typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2));
if (!response.ok) process.exitCode = 1;
