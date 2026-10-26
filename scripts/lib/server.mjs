// Shared bits for the demo scripts: where the API lives and how to fail when it
// is not there.
//
// The local default is 127.0.0.1 on purpose. Windows resolves `localhost` to
// ::1 first, while Wrangler binds 127.0.0.1, so `localhost` produces a bare
// "fetch failed" instead of reaching the dev server.

export const LOCAL_BASE = "http://127.0.0.1:8787";

export const resolveBase = (flagValue, fallback = LOCAL_BASE) =>
  (flagValue ?? process.env.DEMO_BASE_URL ?? fallback).replace(/\/$/, "");

/**
 * Exits with code 2 when the API is unreachable. Code 2 means "environment not
 * ready", which is deliberately distinct from code 1 ("a check failed") so a
 * dead dev server never reads as a product regression.
 */
export async function requireServer(base, hint = "pnpm dev") {
  try {
    const response = await fetch(`${base}/api/health`);
    if (response.ok) return;
    throw new Error(`health endpoint menjawab ${response.status}`);
  } catch (error) {
    console.error(`\nServer tidak merespons di ${base}: ${error.message}`);
    console.error(`Jalankan \`${hint}\`, atau arahkan --base ke instance lain.`);
    process.exit(2);
  }
}
