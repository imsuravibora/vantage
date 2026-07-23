import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pins the workspace root to this project so Next.js doesn't get confused
  // by an unrelated package-lock.json in the parent home directory.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
