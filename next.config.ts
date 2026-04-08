import type { NextConfig } from "next";

const isTauriStatic = process.env.TAURI_STATIC === "1";

const nextConfig: NextConfig = {
  ...(isTauriStatic
    ? { output: "export" as const, images: { unoptimized: true } }
    : {}),
  transpilePackages: ["@blocknote/core", "@blocknote/react", "@blocknote/ariakit"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
