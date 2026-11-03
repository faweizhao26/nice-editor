import type { NextConfig } from "next";

/**
 * GitHub Pages 是「项目站点」时，站点挂在 https://<user>.github.io/<repo>/ 下，
 * 需要设置 basePath，否则 /_next/... 这类绝对路径会 404。
 * 用环境变量传进来，本地开发和根路径部署时留空即可：
 *   NEXT_PUBLIC_BASE_PATH=/nice-editor npm run build
 */
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  // 纯前端项目：构建成静态站点，丢到 Vercel / GitHub Pages / 任意静态托管即可
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  // GitHub Pages 对目录式 URL 更友好
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // 显式指定工程根目录，避免 Turbopack 往上找到 home 目录
  turbopack: { root: process.cwd() },
  // 让客户端代码也能拿到 basePath（MathJax 这类静态资源路径要用）
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
