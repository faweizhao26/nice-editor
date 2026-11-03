/**
 * 「格式」层：在主题 CSS 之后加载，用来覆盖字号、行高、字距、段距、缩进、对齐、
 * 页边距、正文/标题颜色与主题色。用户可以只换配色不动主题结构。
 */

export interface FormatState {
  fontFamily: "sans" | "serif" | "mono" | "custom";
  customFontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  paragraphSpacing: number;
  textIndent: number;
  textAlign: "left" | "center" | "right" | "justify";
  padding: number;
  color: string;
  headingColor: string;
  accent: string;
  bodyBg: string;
}

export const DEFAULT_FORMAT: FormatState = {
  fontFamily: "sans",
  customFontFamily: "",
  fontSize: 16,
  lineHeight: 1.75,
  letterSpacing: 0.4,
  wordSpacing: 1,
  paragraphSpacing: 14,
  textIndent: 0,
  textAlign: "left",
  padding: 12,
  color: "",
  headingColor: "",
  accent: "",
  bodyBg: "",
};

export const FONT_STACKS: Record<string, string> = {
  sans: '-apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif',
  serif: 'Optima-Regular, Optima, PingFangSC-light, "PingFang SC", Cambria, Cochin, Georgia, Times, "Times New Roman", serif',
  mono: 'Menlo, Monaco, Consolas, "Courier New", monospace',
};

export function buildFormatCss(f: FormatState): string {
  const stack = f.fontFamily === "custom" ? f.customFontFamily || FONT_STACKS.sans : FONT_STACKS[f.fontFamily];
  const lines: string[] = ["/* 格式层（用户可调，覆盖主题） */"];

  lines.push(`#nice {
  font-family: ${stack};
  font-size: ${f.fontSize}px;
  line-height: ${f.lineHeight};
  letter-spacing: ${f.letterSpacing}px;
  word-spacing: ${f.wordSpacing}px;
  text-align: ${f.textAlign};
  padding: 0 ${f.padding}px;
${f.bodyBg ? `  background: ${f.bodyBg};\n` : ""}${f.color ? `  color: ${f.color};\n` : ""}}`);

  lines.push(`#nice p {
  font-size: ${f.fontSize}px;
  line-height: ${f.lineHeight};
  letter-spacing: ${f.letterSpacing}px;
  word-spacing: ${f.wordSpacing}px;
  text-align: ${f.textAlign};
  margin: ${f.paragraphSpacing}px 0;
  text-indent: ${f.textIndent}em;
${f.color ? `  color: ${f.color};\n` : ""}}`);

  lines.push(`#nice li {
  font-size: ${f.fontSize}px;
  line-height: ${f.lineHeight};
  letter-spacing: ${f.letterSpacing}px;
${f.color ? `  color: ${f.color};\n` : ""}}`);

  lines.push(`#nice blockquote p {
  font-size: ${Math.max(f.fontSize - 1, 12)}px;
  text-indent: 0;
}`);
  lines.push(`#nice h1, #nice h2, #nice h3, #nice h4, #nice h5, #nice h6 {
  text-align: ${f.textAlign === "justify" ? "left" : f.textAlign};
  text-indent: 0;
${f.headingColor ? `  color: ${f.headingColor};\n` : ""}}`);

  if (f.accent) {
    lines.push(`#nice a, #nice .footnote-ref, #nice li::marker, #nice .footnote-num {
  color: ${f.accent};
}
#nice a {
  border-bottom-color: ${f.accent};
}
#nice h2 {
  border-left-color: ${f.accent};
}
#nice blockquote {
  border-left-color: ${f.accent};
}`);
  }

  return lines.join("\n\n");
}

/* ------------------------------------------------------------------ *
 * 预设：一键切换的常用组合
 * ------------------------------------------------------------------ */
export interface FormatPreset {
  id: string;
  name: string;
  format: Partial<FormatState>;
}

export const FORMAT_PRESETS: FormatPreset[] = [
  { id: "standard", name: "标准", format: { fontSize: 16, lineHeight: 1.75, letterSpacing: 0.4, wordSpacing: 1, paragraphSpacing: 14, textIndent: 0, padding: 12, textAlign: "left" } },
  { id: "compact", name: "紧凑", format: { fontSize: 15, lineHeight: 1.6, letterSpacing: 0.2, wordSpacing: 0, paragraphSpacing: 8, textIndent: 0, padding: 10, textAlign: "left" } },
  { id: "loose", name: "疏朗", format: { fontSize: 17, lineHeight: 2, letterSpacing: 0.8, wordSpacing: 2, paragraphSpacing: 20, textIndent: 0, padding: 16, textAlign: "left" } },
  { id: "indent", name: "首行缩进", format: { fontSize: 16, lineHeight: 1.9, letterSpacing: 0.6, wordSpacing: 1, paragraphSpacing: 12, textIndent: 2, padding: 12, textAlign: "left" } },
  { id: "justify", name: "两端对齐", format: { fontSize: 16, lineHeight: 1.8, letterSpacing: 0.4, wordSpacing: 1, paragraphSpacing: 14, textIndent: 0, padding: 12, textAlign: "justify" } },
];
