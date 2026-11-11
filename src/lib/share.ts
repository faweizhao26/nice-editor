import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { DEFAULT_FORMAT, type FormatState } from "./format";
import { DEFAULT_CODE_THEME_ID } from "./themes/codeThemes";
import { DEFAULT_THEME_ID } from "./themes/builtin";

/**
 * 分享链接：把整篇文章（正文 + 主题 + 格式）压进 URL 的 fragment。
 *
 * 用 fragment（`#d=…`）而不是 query（`?d=…`）：
 *  - fragment 不会发给服务器，内容不经过任何后端，GitHub Pages 的日志里也看不到；
 *  - 纯静态站点，本来也没有后端能存文章。
 *
 * 压缩用 lz-string 的 `compressToEncodedURIComponent`，但它的字母表里有 `+`，
 * 而 `+` 在 URL 里会被很多客户端（聊天工具、URLSearchParams）当成空格，
 * 所以外面再套一层 `encodeURIComponent` 保证万无一失。
 */

export interface ShareDoc {
  title: string;
  content: string;
  themeId: string;
  codeThemeId: string;
  customCss: string;
  format: FormatState;
}

const HASH_PREFIX = "d=";

/**
 * lz-string 的 URI 安全字母表是 `A-Za-z0-9+-$`，其中 `+` 会被很多客户端
 * （聊天工具、URLSearchParams）当成空格，`$` 也可能被转义。
 * 直接 `encodeURIComponent` 会把链接撑大约 2%（`%2B`/`%24` 各占 3 个字符），
 * 所以改成等长替换：`+`→`.`、`$`→`_`。
 * 这两个字符都不在 lz-string 的字母表里，替换是可逆的，且结果全落在
 * RFC 3986 的 unreserved 集合内，任何客户端都不会改写它。
 */
const toUrlSafe = (s: string) => s.replace(/\+/g, ".").replace(/\$/g, "_");
const fromUrlSafe = (s: string) => s.replace(/\./g, "+").replace(/_/g, "$");

/** 只写非默认值，链接能短一截是一截 */
interface Compact {
  t?: string;
  c: string;
  th?: string;
  ct?: string;
  css?: string;
  f?: Partial<FormatState>;
}

/**
 * 分享前把自定义 CSS 瘦一遍。
 *
 * 实测（v7 CSS 7150 字符 + 441 字正文）：链接 6297 字符。
 *   - 去注释 + 去行首缩进 → 4451（省 29%）
 *   - 再压成单行            → 4165（只再多省 5%）
 * 所以这里**只做温和处理**：去注释、去行首缩进、折叠多余空行，
 * 保留换行与选择器结构 —— 接收方在 CSS 输入框里还能看懂，
 * 而收益已经拿到 87%。不做单行 minify。
 *
 * 代价：注释会丢。所以 `loadShared` 里加了一层保护 ——
 * 如果本地已有等价 CSS（压缩后相同），就保留本地那份，注释不丢。
 */
export function compactCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function encodeShare(doc: ShareDoc): string {
  const compact: Compact = { c: doc.content };
  if (doc.title) compact.t = doc.title;
  if (doc.themeId && doc.themeId !== DEFAULT_THEME_ID) compact.th = doc.themeId;
  if (doc.codeThemeId && doc.codeThemeId !== DEFAULT_CODE_THEME_ID) compact.ct = doc.codeThemeId;
  if (doc.customCss) compact.css = compactCss(doc.customCss);

  const formatDiff: Record<string, unknown> = {};
  (Object.keys(DEFAULT_FORMAT) as (keyof FormatState)[]).forEach((key) => {
    if (doc.format[key] !== DEFAULT_FORMAT[key]) formatDiff[key] = doc.format[key];
  });
  if (Object.keys(formatDiff).length) compact.f = formatDiff as Partial<FormatState>;

  return toUrlSafe(compressToEncodedURIComponent(JSON.stringify(compact)));
}

export function decodeShare(encoded: string): ShareDoc | null {
  try {
    const raw = decompressFromEncodedURIComponent(fromUrlSafe(encoded));
    if (!raw) return null;
    const compact = JSON.parse(raw) as Compact;
    if (typeof compact.c !== "string") return null;
    return {
      title: compact.t || "分享的文章",
      content: compact.c,
      themeId: compact.th || DEFAULT_THEME_ID,
      codeThemeId: compact.ct || DEFAULT_CODE_THEME_ID,
      customCss: compact.css || "",
      format: { ...DEFAULT_FORMAT, ...(compact.f || {}) },
    };
  } catch {
    return null;
  }
}

export function buildShareUrl(doc: ShareDoc): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${HASH_PREFIX}${encodeShare(doc)}`;
}

export function readShareFromLocation(): ShareDoc | null {
  if (typeof window === "undefined") return null;
  // 优先读引导脚本从地址栏摘下来的那份（见 app/layout.tsx）
  const fromBootstrap = window.__NICE_SHARE__;
  if (fromBootstrap) {
    window.__NICE_SHARE__ = undefined;
    return decodeShare(fromBootstrap);
  }
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith(HASH_PREFIX)) return null;
  return decodeShare(hash.slice(HASH_PREFIX.length));
}

/** 载入完就把 fragment 抹掉：否则刷新页面会一直把编辑过的内容覆盖回分享版本 */
export function clearShareHash(): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

/** 超过这个长度，飞书/微信等聊天工具可能会把链接截断 */
export const SHARE_URL_WARN_LENGTH = 8000;

export function shareUrlHint(url: string): string | null {
  if (url.length > SHARE_URL_WARN_LENGTH) {
    return `链接 ${url.length} 字符，偏长，聊天工具可能截断，建议改用导出的 .md 文件`;
  }
  return null;
}
