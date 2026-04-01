/**
 * Gera pasta `out/` para o Tauri (export estático).
 * Rotas /api não entram no export do Next; a pasta é copiada para stash e removida temporariamente.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const apiDir = path.join(root, "src", "app", "api");
const stashRoot = path.join(root, ".tauri-build-stash");
const apiStash = path.join(stashRoot, "api");

let stashed = false;

function restoreApi() {
  if (!stashed || !fs.existsSync(apiStash)) return;
  try {
    if (fs.existsSync(apiDir)) fs.rmSync(apiDir, { recursive: true, force: true });
    fs.cpSync(apiStash, apiDir, { recursive: true });
  } finally {
    fs.rmSync(stashRoot, { recursive: true, force: true });
    stashed = false;
  }
}

process.on("SIGINT", () => {
  restoreApi();
  process.exit(1);
});

try {
  if (fs.existsSync(apiDir)) {
    fs.rmSync(stashRoot, { recursive: true, force: true });
    fs.mkdirSync(stashRoot, { recursive: true });
    fs.cpSync(apiDir, apiStash, { recursive: true });
    fs.rmSync(apiDir, { recursive: true, force: true });
    stashed = true;
  }
  const nextDir = path.join(root, ".next");
  if (fs.existsSync(nextDir)) fs.rmSync(nextDir, { recursive: true, force: true });
  execSync("npx next build", {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, TAURI_STATIC: "1" },
  });
} finally {
  restoreApi();
}
