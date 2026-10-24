#!/usr/bin/env node
// Docs guardrail: identifiers quoted in the demo walkthrough must exist in the seed.
// A wrong invoice ID or a stale classroom name is otherwise only caught by a reader.
//
//   node scripts/check-docs.mjs
//
// Exit code 1 when a doc quotes an ID the seed does not define, or hardcodes a
// check count that drifts every time the smoke test gains an assertion.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DOCS_DIR = "docs/demo";
const SEED_MODULE = "../packages/db/src/seed/demo.ts";
const IDENTIFIER = /\b(INV-[A-Z0-9][A-Z0-9-]*|usr_[a-z0-9_]+|cls_[a-z0-9_]+|sub_[a-z0-9_]+|fee_[a-z0-9_]+)\b/g;

const seed = await import(SEED_MODULE);

const seedIds = new Set();
for (const [name, value] of Object.entries(seed)) {
  if (!Array.isArray(value)) continue;
  for (const row of value) {
    if (row && typeof row === "object") {
      if (typeof row.id === "string") seedIds.add(row.id);
      if (typeof row.assetTag === "string") seedIds.add(row.assetTag);
      if (typeof row.username === "string") seedIds.add(row.username);
    }
  }
}

const findings = [];
const files = readdirSync(DOCS_DIR).filter((name) => name.endsWith(".md"));

for (const name of files) {
  const path = join(DOCS_DIR, name);
  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    const where = `${path}:${index + 1}`;

    for (const match of line.matchAll(IDENTIFIER)) {
      if (!seedIds.has(match[1])) {
        findings.push(`${where}  "${match[1]}" tidak ada di dataset seed`);
      }
    }

    if (/\b\d+\s*\/\s*\d+\s+(pemeriksaan|checks?)\b/i.test(line) || /\b\d+\s+(pemeriksaan|checks?)\b/i.test(line)) {
      findings.push(`${where}  jumlah pemeriksaan di-hardcode; rujuk "semua pemeriksaan lulus"`);
    }
  });
}

console.log(`DOCS · CHECK ${String(files.length).padStart(3, " ")} file(s) in ${DOCS_DIR}\n`);
for (const finding of findings) console.error(`FAIL  ${finding}`);

if (findings.length > 0) {
  console.error(`\nRESULT: ${findings.length} doc claim(s) not backed by the seed`);
  process.exit(1);
}
console.log(`RESULT: 0 FAIL — ${seedIds.size} seed identifiers, every quoted ID resolves`);
