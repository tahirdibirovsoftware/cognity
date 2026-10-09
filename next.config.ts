import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
      serverActions: {
        bodySizeLimit: "60mb",
      },
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
