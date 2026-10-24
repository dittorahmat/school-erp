#!/usr/bin/env node
// Token linter: colour literals belong in apps/web/src/index.css @theme only.
// Components must use the generated utilities (bg-accent, text-muted, ...).
//
//   node scripts/lint-tokens.mjs [files or directories ...]
//
// Exit code 1 when a colour literal is found outside the theme block.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative, resolve } from "node:path";

const roots = process.argv.slice(2);
if (!roots.length) roots.push("apps/web/src");

const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".html", ".css"]);
const SKIP = new Set(["node_modules", "dist", ".git", "coverage"]);
const THEME_FILE = "index.css";
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const ARBITRARY = /\[#[0-9a-fA-F]{3,8}\]/;

const files = [];
const walk = (path) => {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) if (!SKIP.has(entry)) walk(join(path, entry));
  } else if (EXT.has(extname(path))) {
    files.push(path);
  }
};
for (const root of roots) {
  try {
    statSync(resolve(root));
  } catch {
    console.error(`Not found: ${root}`);
    process.exit(2);
  }
  walk(resolve(root));
}

const findings = [];
for (const file of files) {
  const isThemeFile = file.endsWith(THEME_FILE);
  const lines = readFileSync(file, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    if (/taste-skill-ignore/.test(line)) return;
    const where = `${relative(process.cwd(), file).split("\\").join("/")}:${index + 1}`;

    if (ARBITRARY.test(line)) {
      findings.push({ where, message: "Arbitrary colour value. Use a theme token utility (bg-accent, text-muted)." });
      return;
    }
    if (!HEX.test(line)) return;

    // The theme block is the one place a raw colour is allowed.
    if (isThemeFile && /^\s*--color-[\w-]+\s*:/.test(line)) return;
    findings.push({
      where,
      message: "Colour literal outside the theme. Add a --color-* token to index.css and use the utility.",
    });
  });
}

console.log(`TOKENS · LINT ${String(files.length).padStart(3, " ")} file(s)\n`);
for (const finding of findings) console.error(`FAIL  ${finding.where}  ${finding.message}`);

if (findings.length > 0) {
  console.error(`\nRESULT: ${findings.length} colour literal(s) outside apps/web/src/index.css @theme`);
  process.exit(1);
}
console.log("RESULT: 0 FAIL — all colours come from theme tokens");
