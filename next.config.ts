import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      fs: { browser: "./src/lib/empty.ts" },
    },
  },
  serverExternalPackages: [],
};

export default nextConfig;
