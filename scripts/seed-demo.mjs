const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const base = readFlag("base", process.env.DEMO_BASE_URL || "http://localhost:8787").replace(/\/$/, "");
const username = readFlag("user", process.env.DEMO_ADMIN_USER || "admin");
const password = readFlag("pass", process.env.DEMO_ADMIN_PASS || "admin123");

async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, init);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const detail = body?.error || body?.message || response.statusText;
    throw new Error(`${init.method || "GET"} ${path} -> ${response.status}: ${detail}`);
  }
  return body;
}

try {
  console.log(`Menanam data demo ke ${base} ...`);

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!login?.token) {
    throw new Error("Login tidak mengembalikan token");
  }

  const result = await request("/api/admin/seed-demo", {
    method: "POST",
    headers: { Authorization: `Bearer ${login.token}` },
  });

  console.log(result.message);
  console.table(result.counts);
  console.log("Akun demo: admin/admin123, guru_budi/guru123, siswa_ahmad/siswa123, wali_subagyo/wali123");
} catch (error) {
  console.error(`Seeder gagal: ${error.message}`);
  process.exitCode = 1;
}
