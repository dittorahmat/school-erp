#!/usr/bin/env node
// One-command local reset: wipe the local D1 state, apply migrations, then seed.
//
//   pnpm demo:reset             # wipe, migrate, seed (starts a temporary dev server)
//   pnpm demo:reset --no-seed   # wipe and migrate only
//
// Refuses to run while a dev server answers on the target base, because the
// state directory cannot be removed underneath it.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBase, LOCAL_BASE } from "./lib/server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "apps/api");
const stateDir = path.join(apiDir, ".wrangler", "state");
const base = resolveBase(undefined, LOCAL_BASE);
const shouldSeed = !process.argv.includes("--no-seed");

async function reachable() {
  try {
    return (await fetch(`${base}/api/health`)).ok;
  } catch {
    return false;
  }
}

function run(command, cwd) {
  const result = spawnSync(command, { cwd, stdio: "inherit", shell: true });
  if (result.status !== 0) {
    console.error(`\nGagal: ${command} (exit ${result.status})`);
    process.exit(1);
  }
}

function waitForServer(child, timeoutMs = 90_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      if (child.exitCode !== null) {
        clearInterval(timer);
        reject(new Error("dev server berhenti sebelum siap"));
        return;
      }
      if (await reachable()) {
        clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`dev server tidak siap dalam ${timeoutMs / 1000} detik`));
      }
    }, 1000);
  });
}

function stopServer(child) {
  if (child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    process.kill(-child.pid, "SIGTERM");
  }
}

function stopOrphanWorkerd() {
  if (process.platform === "win32") {
    const command =
      `$killed = Get-CimInstance Win32_Process -Filter "Name = 'workerd.exe'" ` +
      `| Where-Object { $_.CommandLine -like '*${root}*' } ` +
      `| ForEach-Object { Stop-Process -Id $_.ProcessId -Force; $_.ProcessId }; ` +
      `if ($killed) { $killed -join ',' }`;
    const result = spawnSync("powershell", ["-NoProfile", "-Command", command], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      console.error(`Gagal menghentikan workerd yatim: ${(result.stderr ?? "").trim()}`);
      return;
    }
    const killed = (result.stdout ?? "").trim();
    if (killed) console.log(`Dihentikan workerd yatim: ${killed}`);
    return;
  }

  spawnSync("pkill", ["-f", `${root}.*workerd`], { stdio: "ignore" });
}

function removeState() {
  if (!existsSync(stateDir)) {
    console.log("State lokal belum ada; migrasi akan membuatnya.");
    return;
  }

  // A dev server the agent killed by port can leave workerd holding the files.
  stopOrphanWorkerd();

  try {
    rmSync(stateDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch (error) {
    console.error(`\nGagal menghapus ${path.relative(root, stateDir)}: ${error.message}`);
    console.error("Tutup proses wrangler/workerd yang masih berjalan, lalu ulangi.");
    process.exit(1);
  }

  console.log(`Dihapus: ${path.relative(root, stateDir)}`);
}

async function main() {
  if (await reachable()) {
    console.error(`Server masih hidup di ${base}.`);
    console.error("Hentikan dev server dulu, lalu jalankan pnpm demo:reset lagi.");
    process.exit(2);
  }

  removeState();

  console.log("\n==> Menerapkan migrasi D1 lokal...");
  run("pnpm exec wrangler d1 migrations apply school-erp-db --local", apiDir);

  if (!shouldSeed) {
    console.log("\nSelesai tanpa seed. Jalankan pnpm dev lalu pnpm db:seed.");
    return;
  }

  console.log("\n==> Menjalankan dev server sementara untuk seeding...");
  const child = spawn("pnpm --filter @school-erp/api dev", {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    detached: process.platform !== "win32",
  });

  // Keep the dev server quiet on success; replay its tail when startup fails.
  let serverLog = "";
  const capture = (chunk) => {
    serverLog = (serverLog + chunk).split("\n").slice(-60).join("\n");
  };
  child.stdout?.on("data", capture);
  child.stderr?.on("data", capture);

  try {
    try {
      await waitForServer(child);
    } catch (error) {
      console.error(serverLog.trim());
      throw error;
    }

    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    const session = await login.json().catch(() => null);
    if (!login.ok || !session?.token) {
      throw new Error(`login bootstrap gagal: ${login.status}`);
    }

    const seed = await fetch(`${base}/api/admin/seed-demo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const result = await seed.json().catch(() => null);
    if (!seed.ok) {
      throw new Error(`seed gagal: ${seed.status} ${JSON.stringify(result)}`);
    }

    console.log("\nSeed selesai. Database lokal bersih dan siap untuk studi kasus.");
  } catch (error) {
    console.error(`\nGagal: ${error.message}`);
    process.exitCode = 1;
  } finally {
    stopServer(child);
  }
}

await main();
