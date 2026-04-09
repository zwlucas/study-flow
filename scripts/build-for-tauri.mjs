import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

// Build static assets for Tauri by forcing Next.js export mode.
const child = spawn(npmCommand, ["run", "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    TAURI_STATIC: "1",
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
