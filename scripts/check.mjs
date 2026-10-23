import { execSync } from "node:child_process";

const env = {
  ...process.env,
  NODE_OPTIONS: "--max-old-space-size=4096",
};

function run(cmd, desc) {
  console.log(`\n==> [CHECK] ${desc}...`);
  execSync(cmd, { stdio: "inherit", env });
}

try {
  run("pnpm --recursive run build", "Building all workspaces");
  run("pnpm --recursive run test", "Running vitest suites");
  run("pnpm run lint:ui", "Running frontend UI taste linter");
  console.log("\n✅ All guardrail checks passed successfully!");
} catch (error) {
  console.error("\n❌ Guardrail check failed.");
  process.exit(1);
}
