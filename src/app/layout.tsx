import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * 分享链接的引导脚本。
 *
 * 必须在 React/Next 之前同步执行：把 `#d=…` 从地址栏挪到内存里并立刻清掉 hash。
 * 如果放到组件里用 useEffect 清，Next 的路由器在 hydration 时会把 hash 写回去，
 * 结果是刷新页面时分享内容会反复覆盖用户已经编辑过的正文。
 */
const SHARE_BOOTSTRAP = `(function(){try{
var h=window.location.hash;
if(h&&h.indexOf("#d=")===0){
window.__NICE_SHARE__=h.slice(3);
window.history.replaceState(null,"",window.location.pathname+window.location.search);
}
}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Nice 编辑器 · Markdown 一键排版",
  description:
    "把 Markdown 排版成微信公众号 / 知乎 / 掘金可直接粘贴的格式：主题、代码高亮、数学公式、外链转脚注，全部纯前端。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <script dangerouslySetInnerHTML={{ __html: SHARE_BOOTSTRAP }} />
        {children}
      </body>
    </html>
  );
}
