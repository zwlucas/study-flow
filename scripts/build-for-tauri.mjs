import { spawn } from "node:child_process";
import { access, rename } from "node:fs/promises";
import path from "node:path";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(npmCommand, ["run", "build"], {
      stdio: "inherit",
      env: {
        ...process.env,
        TAURI_STATIC: "1",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`next build failed with exit code ${code ?? 1}`));
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const apiDir = path.join(process.cwd(), "src", "app", "api");
  const apiDirBackup = path.join(process.cwd(), "src", "app", "_api_disabled_for_tauri");
  let apiDirMoved = false;

  try {
    if (await exists(apiDir)) {
      if (await exists(apiDirBackup)) {
        throw new Error(`Temporary backup folder already exists: ${apiDirBackup}`);
      }
      // Static export does not support route handlers from src/app/api.
      await rename(apiDir, apiDirBackup);
      apiDirMoved = true;
    }

    await runBuild();
  } finally {
    if (apiDirMoved && (await exists(apiDirBackup))) {
      await rename(apiDirBackup, apiDir);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
