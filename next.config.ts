import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 纯前端项目：构建成静态站点，丢到 Vercel / 任意静态托管即可
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  // 显式指定工程根目录，避免 Turbopack 往上找到 home 目录
  turbopack: { root: process.cwd() },
};

export default nextConfig;
