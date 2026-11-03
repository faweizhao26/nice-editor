/**
 * 生成 src/lib/themes/codeThemes.ts
 *
 * 把 highlight.js 自带的样式表转成编辑器可用的形式：
 *   - 丢掉 `pre code.hljs` / `code.hljs` 的布局规则（我们的 base.css 统一管）
 *   - `.hljs` 的底色 / 字色挂到 `#nice pre.custom`（代码块容器）上
 *   - 其余 token 类名统一加 `#nice` 前缀
 *
 * 运行：node scripts/gen-code-themes.mjs
 */
import fs from "node:fs";
import path from "node:path";

const STYLES = ["atom-one-dark", "atom-one-light", "monokai", "github", "vs2015", "xcode"];
const LABELS = {
  atomOneDark: "Atom One Dark",
  atomOneLight: "Atom One Light",
  monokai: "Monokai",
  github: "GitHub",
  vs2015: "VS 2015",
  xcode: "Xcode",
};

const toId = (name) => name.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());

const consts = [];
const entries = [];

for (const name of STYLES) {
  const file = path.join("node_modules", "highlight.js", "styles", `${name}.css`);
  const css = fs.readFileSync(file, "utf8").trim();
  const id = toId(name);
  consts.push(`const ${id} = \`\n${css.replace(/`/g, "\\`").replace(/\$\{/g, "\\${")}\n\`;`);
  entries.push(`  { id: "${id}", name: "${LABELS[id]}", css: ${id} },`);
}

const out = `/**
 * 代码高亮主题：取自 highlight.js 自带样式表（BSD-3-Clause）。
 * 由 scripts/gen-code-themes.mjs 生成，请勿手改。
 */

export interface CodeTheme {
  id: string;
  name: string;
  css: string;
}

${consts.join("\n\n")}

export const CODE_THEMES: CodeTheme[] = [
${entries.join("\n")}
];

export const DEFAULT_CODE_THEME_ID = "atomOneDark";

/**
 * 把 highlight.js 的样式改写进编辑器作用域。
 *
 * 注意：必须先剥掉 CSS 注释再按规则切分 —— highlight.js 的样式表里
 * 注释紧贴在下一条规则前面，不剥掉的话注释会被当成选择器的一部分，
 * 结果 .hljs 的 background 声明被拼成非法选择器而整条失效（代码块会没有底色）。
 */
export function scopeCodeTheme(css: string): string {
  const clean = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, "");
  return clean.replace(/([^{}]+)\\{([^{}]*)\\}/g, (_m, sel: string, body: string) => {
    const sels = sel
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !/^(pre\\s+)?code\\.hljs$/.test(s))
      .map((s) => (s === ".hljs" ? "#nice pre.custom" : \`#nice \${s}\`));
    return sels.length ? \`\${sels.join(", ")}{ \${body} }\` : "";
  });
}

export function getCodeThemeCss(id: string): string {
  const theme = CODE_THEMES.find((t) => t.id === id) ?? CODE_THEMES[0];
  return scopeCodeTheme(theme.css);
}
`;

const target = path.join("src", "lib", "themes", "codeThemes.ts");
fs.writeFileSync(target, out);
console.log(`wrote ${target} (${fs.statSync(target).size} bytes)`);
