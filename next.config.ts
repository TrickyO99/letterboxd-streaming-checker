import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build for the Docker image.
  // Vercel does its own build tracing and breaks if this is set (ENOENT on
  // next-server.js.nft.json), so only apply it outside Vercel's builder.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
