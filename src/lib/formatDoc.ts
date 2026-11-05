/**
 * 「一键格式化」。
 *
 * ## 参考 mdnice 的做法
 *
 * mdnice 的 `formatDoc` = **Prettier 的 markdown 解析器做结构重排** + 两条
 * `$` 与中文之间的空格规则（防止 `中文$x$` 粘在一起导致公式解析不出来）。
 * 注意 **mdnice 本身并不做「中英文之间加空格」**，那是这里额外加的。
 *
 * 这里不引 Prettier：standalone 的 markdown 插件会给静态包再加几百 KB，
 * 而我们需要的规则并不多。但必须做到 Prettier 天然具备的一件事 ——
 * **绝不改动围栏代码块里的内容**。
 *
 * ## 之前的实现有个会毁内容的 bug
 *
 * 旧版在整篇文本上跑正则，代码块里的行也会被改：
 *   `#!/bin/bash`        → `# !/bin/bash`      （shebang 被毁）
 *   `#this is a comment` → `# this is a comment`（代码被改）
 *   `echo "a b"   `      → 行尾空格被删
 * 所以现在先按围栏切段，只对**正文行**做变换，代码块逐字原样保留。
 */

/** 中文（含扩展 A）与日文假名 —— 参与「中英文之间加空格」的左侧字符 */
const CJK = "\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff";

/**
 * 行内需要**保护**、不参与加空格的片段（按顺序匹配，行内代码优先）：
 *   1. 行内代码 `` `x` ``
 *   2. 链接/图片的 `](URL)` 部分（URL 里的字符不该被空格切开）
 *   3. HTML 标签 / 自动链接 `<...>`
 * 公式 `$...$` **故意不保护** —— mdnice 那两条规则正是要处理 `$` 与中文的
 * 边界，而公式内部的空格在 LaTeX 里会被忽略，风险可接受。
 */
const INLINE_PROTECT = /(`+[^`]*`+|\]\([^)]*\)|<[^>]+>)/g;

/** 判断一行是否是围栏**开始**标记（``` 或 ~~~，最多 3 个前导空格，后面可以带语言名） */
const FENCE_RE = /^\s{0,3}(`{3,}|~{3,})/;

/**
 * 判断一行是否是围栏**结束**标记。
 *
 * ⚠️ 结束标记后面不能再有任何内容 —— 否则代码块里的 ```inner 这种行会被
 * 误判成闭合，围栏状态提前错位，后面就会往代码块里插空行、把内容改坏。
 * markdown 的规则就是这样（闭合标记只能是围栏字符 + 空白）。
 */
const FENCE_CLOSE_RE = /^\s{0,3}(`{3,}|~{3,})\s*$/;

/** 中英文/数字之间加空格（pangu 规则的安全子集） */
function spaceCJK(line: string): string {
  // 把受保护片段换成占位符，只对剩下的文本做替换
  const parts: string[] = [];
  const masked = line.replace(INLINE_PROTECT, (m) => {
    parts.push(m);
    return `\u0000${parts.length - 1}\u0000`;
  });

  const spaced = masked
    // 中文 ↔ 半角字母 / 数字
    .replace(new RegExp(`([${CJK}])([A-Za-z0-9])`, "g"), (_m, a: string, b: string) => `${a} ${b}`)
    .replace(new RegExp(`([A-Za-z0-9])([${CJK}])`, "g"), (_m, a: string, b: string) => `${a} ${b}`)
    // 中文 ↔ $（公式 / 行内代码的边界）
    .replace(new RegExp(`([${CJK}])\\$`, "g"), (_m, a: string) => `${a} $`)
    .replace(new RegExp(`\\$([${CJK}])`, "g"), (_m, a: string) => `$ ${a}`);

  return spaced.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => parts[Number(i)]);
}

/** 单行正文的规范化 */
function normalizeProseLine(line: string): string {
  let l = line;

  // 行尾空格：单个是误留，**两个以上是 Markdown 硬换行**，必须保留
  if (!/[ \t]{2,}$/.test(l)) l = l.replace(/[ \t]+$/, "");

  // 标题 # 后统一一个空格
  l = l.replace(/^(\s{0,3}#{1,6})\s*/, "$1 ");
  // 只有 # 没有内容时不留尾随空格
  l = l.replace(/^(\s{0,3}#{1,6})\s+$/, "$1");

  // 无序列表统一用 -
  l = l.replace(/^(\s*)[*+]\s+/, "$1- ");
  // 有序列表统一 "1. "
  l = l.replace(/^(\s*)(\d+)[.)]\s+/, "$1$2. ");

  // 引用符号后统一一个空格
  l = l.replace(/^(\s*>+)\s?/, "$1 ");
  l = l.replace(/^(\s*>+)\s+$/, "$1");

  // 表格分隔行：统一成 | --- | :--: | 形态
  if (/^\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes("-")) {
    l = l
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => {
        const c = cell.trim();
        if (!c) return "---";
        const left = c.startsWith(":");
        const right = c.endsWith(":");
        const width = Math.max(c.replace(/:/g, "").length, 3);
        return `${left ? ":" : ""}${"-".repeat(width)}${right ? ":" : ""}`;
      })
      .join(" | ")
      .replace(/^/, "| ")
      .replace(/$/, " |");
  }

  return spaceCJK(l);
}

const isHeading = (l: string) => /^\s{0,3}#{1,6}\s/.test(l);
const isFence = (l: string) => FENCE_RE.test(l);
const isTableRow = (l: string) => /^\s*\|/.test(l);
const isHr = (l: string) => /^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(l);
const isBlank = (l: string) => l.trim() === "";

/**
 * 格式化整篇 Markdown。
 *
 * 处理项：
 *   - 中英文 / 数字之间加空格、中文与 `$` 之间加空格
 *   - 标题、列表、引用、表格分隔行的标记规范化
 *   - 围栏代码块**逐字保留**
 *   - 标题 / 表格 / 分隔线 / 代码块前后补空行，连续空行折叠成一个
 *   - 文件末尾恰好一个换行
 */
export function formatMarkdown(input: string): string {
  const src = input.replace(/\r\n?/g, "\n").split("\n");

  /* ---- 第一遍：逐行规范化，跟踪围栏状态 ---- */
  const stage1: string[] = [];
  let fence: string | null = null;

  for (const raw of src) {
    if (fence) {
      stage1.push(raw); // 代码块内一字不动
      const m = FENCE_CLOSE_RE.exec(raw);
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
      continue;
    }
    const open = FENCE_RE.exec(raw);
    if (open) {
      fence = open[1];
      stage1.push(raw.replace(/[ \t]+$/, "")); // 围栏行只清行尾空格
      continue;
    }
    stage1.push(normalizeProseLine(raw));
  }

  /* ---- 第二遍：空行与块间距 ---- */
  const out: string[] = [];
  fence = null;
  let justClosedFence = false;

  for (const line of stage1) {
    if (fence) {
      out.push(line);
      const m = FENCE_CLOSE_RE.exec(line);
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) {
        fence = null;
        justClosedFence = true;
      }
      continue;
    }

    if (isFence(line)) {
      if (out.length && !isBlank(out[out.length - 1])) out.push("");
      fence = FENCE_RE.exec(line)![1];
      out.push(line);
      justClosedFence = false;
      continue;
    }

    // 代码块后面也要有空行
    if (justClosedFence && !isBlank(line)) out.push("");
    justClosedFence = false;

    const prev = out[out.length - 1] ?? "";

    // 标题 / 表格首行 / 分隔线之前补空行（表格后续行不补，否则每行之间都会插空行）
    const needsBlankBefore =
      (isHeading(line) || isHr(line) || (isTableRow(line) && !isTableRow(prev))) && !isBlank(prev);

    if (needsBlankBefore && out.length) out.push("");

    // 连续空行折叠
    if (isBlank(line) && isBlank(out[out.length - 1] ?? "")) continue;

    out.push(line);
  }

  // 去掉结尾空行，末尾补恰好一个换行
  while (out.length && isBlank(out[out.length - 1])) out.pop();

  // 整篇没内容时不要凭空造出一个换行
  if (!out.length) return "";

  return `${out.join("\n")}\n`;
}
