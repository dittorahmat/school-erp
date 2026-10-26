#!/usr/bin/env node
// Guardrail: secrets belong in `wrangler secret put` (production) or `.dev.vars`
// (local), never in a tracked config file.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const failures = [];

const toml = readFileSync(new URL("../apps/api/wrangler.toml", import.meta.url), "utf8");
const varsBlock = toml.split(/^\[vars\]\s*$/m)[1]?.split(/^\[/m)[0] ?? "";
const secretKey = /^\s*([A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY)[A-Z0-9_]*)\s*=/m.exec(varsBlock);
if (secretKey) {
  failures.push(`apps/api/wrangler.toml [vars] memuat rahasia: ${secretKey[1]}`);
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n");
if (tracked.includes(".dev.vars")) {
  failures.push(".dev.vars ada di git; pindahkan isinya dan hapus dari index");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL  ${failure}`);
  process.exit(1);
}

console.log("RESULT: 0 FAIL — tidak ada rahasia di konfigurasi repo");
