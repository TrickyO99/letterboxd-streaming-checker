import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // served at odtriki.com/trikinema/streaming
  basePath: "/trikinema/streaming",
  env: { NEXT_PUBLIC_BASE_PATH: "/trikinema/streaming" },
  // Produces a self-contained .next/standalone build for the Docker image.
  output: "standalone",
};

export default nextConfig;
