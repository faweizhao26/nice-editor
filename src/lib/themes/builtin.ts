/**
 * 内置主题。
 *
 * 设计要点（也是这套东西能在微信里活下来的关键）：
 *  1. 主题 CSS 一律以 `#nice` 作用域书写，复制时由 juice 把规则内联到每个元素上；
 *  2. 不能使用 CSS 变量 —— juice 不解析 var()，微信也不认；
 *  3. 不能用 `:hover` / `:nth-child` 之类依赖运行时的选择器（预览可用，复制后失效）；
 *  4. 所有尺寸/颜色写死字面量，保证「预览所见 = 粘贴所得」。
 */

export type HeadingStyle = "plain" | "underline" | "bar" | "pill" | "boxed" | "center";

export interface ThemePalette {
  id: string;
  name: string;
  desc: string;
  accent: string;
  text: string;
  heading: string;
  sub: string;
  link: string;
  inlineCodeBg: string;
  inlineCodeColor: string;
  quoteBg: string;
  quoteBorder: string;
  quoteColor: string;
  tableHeadBg: string;
  tableBorder: string;
  divider: string;
  bodyBg?: string;
  font?: string;
  headingFont?: string;
  headingStyle: HeadingStyle;
  markBg?: string;
  markColor?: string;
  radius?: string;
}

export interface Theme extends ThemePalette {
  css: string;
}

const SANS =
  '-apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif';
const SERIF =
  'Optima-Regular, Optima, PingFangSC-light, "PingFang SC", Cambria, Cochin, Georgia, Times, "Times New Roman", serif';
const MONO = 'Menlo, Monaco, Consolas, "Courier New", monospace';

/** 标题装饰：按 headingStyle 生成 h1~h6 的样式块 */
function headingCss(p: ThemePalette): string {
  const font = p.headingFont ? `font-family: ${p.headingFont};\n  ` : "";
  const base = `#nice h1,
#nice h2,
#nice h3,
#nice h4,
#nice h5,
#nice h6 {
  ${font}font-weight: 700;
  color: ${p.heading};
  margin: 28px 0 14px;
  padding: 0;
  line-height: 1.45;
}
#nice h1 { font-size: 22px; }
#nice h2 { font-size: 20px; }
#nice h3 { font-size: 18px; }
#nice h4 { font-size: 17px; }
#nice h5 { font-size: 16px; }
#nice h6 { font-size: 16px; }
#nice h1:first-child,
#nice h2:first-child,
#nice h3:first-child {
  margin-top: 6px;
}`;

  switch (p.headingStyle) {
    case "underline":
      return `${base}
#nice h1 {
  font-size: 23px;
  border-bottom: 1px solid ${p.tableBorder};
  padding-bottom: 10px;
}
#nice h2 {
  border-bottom: 2px solid ${p.accent};
  padding-bottom: 8px;
}
#nice h3 {
  padding-left: 10px;
  border-left: 4px solid ${p.accent};
}`;
    case "bar":
      return `${base}
#nice h2 {
  font-size: 19px;
  background: ${p.accent};
  color: #ffffff;
  padding: 7px 14px;
  border-radius: ${p.radius ?? "6px"};
  display: block;
}
#nice h3 {
  padding-left: 11px;
  border-left: 4px solid ${p.accent};
}
#nice h4 {
  padding-left: 11px;
  border-left: 3px solid ${p.accent};
  opacity: 0.9;
}`;
    case "pill":
      return `${base}
#nice h2 {
  font-size: 19px;
  display: inline-block;
  background: ${p.quoteBg};
  color: ${p.accent};
  padding: 6px 14px;
  border-radius: 999px;
}
#nice h3 {
  display: inline-block;
  border-bottom: 3px solid ${p.accent};
  padding-bottom: 4px;
}`;
    case "boxed":
      return `${base}
#nice h2 {
  font-size: 19px;
  text-align: center;
  border-top: 1px solid ${p.accent};
  border-bottom: 1px solid ${p.accent};
  padding: 8px 0;
}
#nice h3 {
  text-align: center;
  letter-spacing: 1px;
}
#nice h3 .content {
  border-bottom: 3px solid ${p.accent};
  padding-bottom: 3px;
}`;
    case "center":
      return `${base}
#nice h1 {
  font-size: 23px;
  text-align: center;
  letter-spacing: 1px;
}
#nice h2 {
  font-size: 20px;
  text-align: center;
  letter-spacing: 1px;
}
#nice h2 .content {
  border-bottom: 2px solid ${p.accent};
  padding-bottom: 5px;
}
#nice h3 {
  padding-left: 12px;
  border-left: 3px solid ${p.accent};
}`;
    default:
      return `${base}
#nice h2 {
  padding-left: 12px;
  border-left: 4px solid ${p.accent};
}`;
  }
}

/** 把一套配色渲染成完整主题 CSS */
export function buildThemeCss(p: ThemePalette): string {
  const radius = p.radius ?? "6px";
  return `/* ${p.name} —— ${p.desc} */
/* 全局 */
#nice {
  font-family: ${p.font ?? SANS};
  font-size: 16px;
  color: ${p.text};
  line-height: 1.75;
  padding: 0 12px;
  letter-spacing: 0.4px;
  word-spacing: 1px;
  ${p.bodyBg ? `background: ${p.bodyBg};\n  ` : ""}text-align: left;
}

/* 段落 */
#nice p {
  font-size: 16px;
  color: ${p.text};
  line-height: 1.75;
  margin: 14px 0;
  letter-spacing: 0.4px;
  text-align: left;
}

${headingCss(p)}

/* 强调 */
#nice strong {
  color: ${p.heading};
  font-weight: 700;
}
#nice em {
  color: ${p.accent};
  font-style: italic;
}
#nice del {
  color: ${p.sub};
}
#nice a {
  color: ${p.link};
  text-decoration: none;
  border-bottom: 1px solid ${p.link};
  word-break: break-all;
}
#nice .footnote-word > a {
  border-bottom: none;
}
#nice .footnote-ref {
  color: ${p.accent};
}

/* 列表 */
#nice ul,
#nice ol {
  color: ${p.text};
  padding-left: 26px;
  margin: 12px 0;
}
#nice ul {
  list-style-type: disc;
}
#nice ul ul {
  list-style-type: circle;
}
#nice ol {
  list-style-type: decimal;
}
#nice li {
  color: ${p.text};
  font-size: 16px;
  line-height: 1.75;
  margin: 6px 0;
}
#nice li::marker {
  color: ${p.accent};
}

/* 引用 */
#nice blockquote {
  background: ${p.quoteBg};
  border-left: 4px solid ${p.quoteBorder};
  color: ${p.quoteColor};
  padding: 12px 16px;
  border-radius: 0 ${radius} ${radius} 0;
}
#nice blockquote p {
  color: ${p.quoteColor};
  font-size: 15px;
  margin: 4px 0;
}
#nice .nice-multiquote-2 {
  border-left-color: ${p.accent};
  opacity: 0.92;
}
#nice .nice-multiquote-3 {
  border-left-color: ${p.sub};
  opacity: 0.85;
}

/* 行内代码 */
#nice code:not(.hljs) {
  background: ${p.inlineCodeBg};
  color: ${p.inlineCodeColor};
  font-family: ${MONO};
  border-radius: 4px;
}

/* 代码块容器（底色/字色由「代码主题」决定） */
#nice pre.custom {
  border-radius: ${radius};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* 分隔线 */
#nice hr {
  background: none;
  border-top: 1px solid ${p.divider};
  height: 0;
}

/* 表格 */
#nice table {
  color: ${p.text};
}
#nice table th,
#nice table td {
  border: 1px solid ${p.tableBorder};
  font-size: 14px;
}
#nice table thead th {
  background: ${p.tableHeadBg};
  color: ${p.heading};
  font-weight: 600;
}
#nice table tbody tr:nth-child(even) {
  background: ${p.quoteBg};
}

/* 目录 */
#nice .table-of-contents {
  background: ${p.quoteBg};
  border-left: 3px solid ${p.accent};
}
#nice .table-of-contents a {
  color: ${p.link};
  border-bottom: none;
}

/* 脚注 / 参考资料 */
#nice .footnotes {
  color: ${p.sub};
  border-top: 1px dashed ${p.divider};
  padding-top: 12px;
}
#nice .footnotes-title {
  color: ${p.heading};
}
#nice .footnote-num {
  color: ${p.accent};
}

/* 高亮 */
#nice mark {
  background: ${p.markBg ?? "#fff3a3"};
  color: ${p.markColor ?? p.text};
}

/* 图片说明 */
#nice figcaption {
  color: ${p.sub};
}
`;
}

const PALETTES: ThemePalette[] = [
  {
    id: "default",
    name: "默认",
    desc: "经典蓝，兼容性最好",
    accent: "#1e6bb8",
    text: "#2b2b2b",
    heading: "#1a1a1a",
    sub: "#9a9a9a",
    link: "#1e6bb8",
    inlineCodeBg: "#f2f2f2",
    inlineCodeColor: "#c7254e",
    quoteBg: "#f7f7f7",
    quoteBorder: "#1e6bb8",
    quoteColor: "#5a5a5a",
    tableHeadBg: "#f2f4f7",
    tableBorder: "#e2e5e9",
    divider: "#e0e0e0",
    headingStyle: "underline",
  },
  {
    id: "wechat",
    name: "微信绿",
    desc: "公众号原生观感",
    accent: "#07c160",
    text: "#3e3e3e",
    heading: "#141414",
    sub: "#9b9b9b",
    link: "#576b95",
    inlineCodeBg: "#eef9f2",
    inlineCodeColor: "#07a352",
    quoteBg: "#f1faf5",
    quoteBorder: "#07c160",
    quoteColor: "#4c6b58",
    tableHeadBg: "#eef9f2",
    tableBorder: "#dcefe4",
    divider: "#e3e3e3",
    headingStyle: "pill",
  },
  {
    id: "minimal",
    name: "极简",
    desc: "黑白灰，只留内容",
    accent: "#111111",
    text: "#333333",
    heading: "#000000",
    sub: "#a0a0a0",
    link: "#333333",
    inlineCodeBg: "#f5f5f5",
    inlineCodeColor: "#111111",
    quoteBg: "#fafafa",
    quoteBorder: "#111111",
    quoteColor: "#666666",
    tableHeadBg: "#f5f5f5",
    tableBorder: "#e5e5e5",
    divider: "#e5e5e5",
    headingStyle: "plain",
  },
  {
    id: "elegant",
    name: "优雅紫",
    desc: "紫调克制，适合长文",
    accent: "#7c5cff",
    text: "#3d3a4b",
    heading: "#221f33",
    sub: "#9d99ab",
    link: "#7c5cff",
    inlineCodeBg: "#f3f0ff",
    inlineCodeColor: "#6d4aff",
    quoteBg: "#f7f5ff",
    quoteBorder: "#7c5cff",
    quoteColor: "#5b5470",
    tableHeadBg: "#f3f0ff",
    tableBorder: "#e4dfff",
    divider: "#e6e3f2",
    headingStyle: "bar",
  },
  {
    id: "tech",
    name: "科技蓝",
    desc: "蓝色块标题，技术号常用",
    accent: "#2563eb",
    text: "#334155",
    heading: "#0f172a",
    sub: "#94a3b8",
    link: "#2563eb",
    inlineCodeBg: "#eff6ff",
    inlineCodeColor: "#1d4ed8",
    quoteBg: "#f1f5f9",
    quoteBorder: "#2563eb",
    quoteColor: "#475569",
    tableHeadBg: "#e8f0fe",
    tableBorder: "#dbe4f0",
    divider: "#e2e8f0",
    headingStyle: "bar",
  },
  {
    id: "sunset",
    name: "暖阳橙",
    desc: "橙调，语气轻快",
    accent: "#f97316",
    text: "#4a3728",
    heading: "#2e1f14",
    sub: "#b09a86",
    link: "#ea7317",
    inlineCodeBg: "#fff4ec",
    inlineCodeColor: "#d9600c",
    quoteBg: "#fff8f3",
    quoteBorder: "#f97316",
    quoteColor: "#7a5a41",
    tableHeadBg: "#fff1e6",
    tableBorder: "#f6e2d3",
    divider: "#f0e2d6",
    headingStyle: "underline",
  },
  {
    id: "forest",
    name: "森绿",
    desc: "深绿，沉稳",
    accent: "#16a34a",
    text: "#2f3e34",
    heading: "#12291c",
    sub: "#93a89b",
    link: "#15803d",
    inlineCodeBg: "#eefaf1",
    inlineCodeColor: "#15803d",
    quoteBg: "#f3faf5",
    quoteBorder: "#16a34a",
    quoteColor: "#4c6355",
    tableHeadBg: "#e9f7ee",
    tableBorder: "#d8ebdf",
    divider: "#e0ebe4",
    headingStyle: "bar",
  },
  {
    id: "sakura",
    name: "樱花粉",
    desc: "粉调圆角，生活号",
    accent: "#ec4899",
    text: "#4a3740",
    heading: "#2f1f27",
    sub: "#b39aa6",
    link: "#db2777",
    inlineCodeBg: "#fdf2f8",
    inlineCodeColor: "#db2777",
    quoteBg: "#fdf6fa",
    quoteBorder: "#ec4899",
    quoteColor: "#7a5566",
    tableHeadBg: "#fdeef6",
    tableBorder: "#f7dbe8",
    divider: "#f3e2ea",
    headingStyle: "pill",
    radius: "10px",
  },
  {
    id: "ocean",
    name: "深海",
    desc: "青蓝渐变感，冷静",
    accent: "#0ea5e9",
    text: "#2b3a44",
    heading: "#0c1f2b",
    sub: "#8fa6b2",
    link: "#0284c7",
    inlineCodeBg: "#eff9ff",
    inlineCodeColor: "#0369a1",
    quoteBg: "#f2f9fd",
    quoteBorder: "#0ea5e9",
    quoteColor: "#4a6675",
    tableHeadBg: "#e9f6fd",
    tableBorder: "#d7eaf5",
    divider: "#e0eef6",
    headingStyle: "underline",
  },
  {
    id: "ink",
    name: "墨韵",
    desc: "衬线中文，克制典雅",
    accent: "#8b5a2b",
    text: "#33302c",
    heading: "#1f1c18",
    sub: "#a29585",
    link: "#8b5a2b",
    inlineCodeBg: "#f5f1ea",
    inlineCodeColor: "#8b5a2b",
    quoteBg: "#faf7f1",
    quoteBorder: "#8b5a2b",
    quoteColor: "#5c5346",
    tableHeadBg: "#f6f1e9",
    tableBorder: "#e8e0d3",
    divider: "#e6ded0",
    font: SERIF,
    headingFont: SERIF,
    headingStyle: "center",
  },
  {
    id: "magazine",
    name: "杂志风",
    desc: "大标题、居中、红黑撞色",
    accent: "#dc2626",
    text: "#262626",
    heading: "#000000",
    sub: "#a3a3a3",
    link: "#dc2626",
    inlineCodeBg: "#f5f5f5",
    inlineCodeColor: "#dc2626",
    quoteBg: "#fafafa",
    quoteBorder: "#dc2626",
    quoteColor: "#525252",
    tableHeadBg: "#f5f5f5",
    tableBorder: "#e5e5e5",
    divider: "#1a1a1a",
    headingFont: SERIF,
    headingStyle: "boxed",
  },
  {
    id: "night",
    name: "暗夜",
    desc: "深色底，配暗色代码主题",
    accent: "#38bdf8",
    text: "#c9d1d9",
    heading: "#f0f6fc",
    sub: "#7d8590",
    link: "#58a6ff",
    inlineCodeBg: "#21262d",
    inlineCodeColor: "#ff7b72",
    quoteBg: "#161b22",
    quoteBorder: "#38bdf8",
    quoteColor: "#9ba7b4",
    tableHeadBg: "#21262d",
    tableBorder: "#30363d",
    divider: "#30363d",
    bodyBg: "#0d1117",
    markBg: "#4a3c00",
    markColor: "#ffe58f",
    headingStyle: "bar",
  },
];

export const BUILTIN_THEMES: Theme[] = PALETTES.map((p) => ({ ...p, css: buildThemeCss(p) }));

export const DEFAULT_THEME_ID = "default";

/** 自定义主题：默认给一份带注释的空壳，用户在「自定义 CSS」里改 */
export const CUSTOM_THEME: Theme = {
  id: "custom",
  name: "自定义",
  desc: "自己写 CSS，作用域用 #nice",
  accent: "#8b8b8b",
  text: "#2b2b2b",
  heading: "#1a1a1a",
  sub: "#9a9a9a",
  link: "#1e6bb8",
  inlineCodeBg: "#f2f2f2",
  inlineCodeColor: "#c7254e",
  quoteBg: "#f7f7f7",
  quoteBorder: "#1e6bb8",
  quoteColor: "#5a5a5a",
  tableHeadBg: "#f2f4f7",
  tableBorder: "#e2e5e9",
  divider: "#e0e0e0",
  headingStyle: "plain",
  css: `/* 自定义主题：所有规则必须以 #nice 开头，复制时会被内联到每个元素 */

#nice {
  font-size: 16px;
  color: #2b2b2b;
  line-height: 1.75;
  padding: 0 12px;
}

#nice p {
  margin: 14px 0;
}

#nice h2 {
  font-size: 20px;
  color: #1a1a1a;
  padding-left: 12px;
  border-left: 4px solid #1e6bb8;
}

#nice blockquote {
  background: #f7f7f7;
  border-left: 4px solid #1e6bb8;
  padding: 12px 16px;
  color: #5a5a5a;
}

#nice code:not(.hljs) {
  background: #f2f2f2;
  color: #c7254e;
  padding: 2px 5px;
  border-radius: 4px;
}

#nice a {
  color: #1e6bb8;
  border-bottom: 1px solid #1e6bb8;
}
`,
};

export const ALL_THEMES: Theme[] = [...BUILTIN_THEMES, CUSTOM_THEME];

export function getTheme(id: string): Theme {
  return ALL_THEMES.find((t) => t.id === id) ?? BUILTIN_THEMES[0];
}
