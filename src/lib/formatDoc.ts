/**
 * 「格式化文档」：不做重型 AST 重排，只处理 Markdown 里最容易出问题的空白与标记，
 * 保证渲染结果稳定（这也是公众号排版最常见的问题来源）。
 */
export function formatMarkdown(input: string): string {
  let text = input.replace(/\r\n?/g, "\n");

  // 行尾空格（Markdown 里两个空格 = 硬换行，但混在段落里很危险，统一去掉）
  text = text.replace(/[ \t]+$/gm, "");

  // 标题 # 后统一一个空格
  text = text.replace(/^(#{1,6})\s*/gm, (_m, hashes: string) => `${hashes} `);

  // 无序列表统一用 -
  text = text.replace(/^(\s*)[*+]\s+/gm, "$1- ");

  // 有序列表统一 "1. "
  text = text.replace(/^(\s*)(\d+)[.)]\s+/gm, "$1$2. ");

  // 引用符号后统一一个空格
  text = text.replace(/^(\s*>+)\s?/gm, "$1 ");

  // 表格分隔行统一
  text = text.replace(/^\|?[\s:|-]+\|[\s:|-]*$/gm, (row) =>
    /-/.test(row)
      ? row
          .split("|")
          .map((cell) => {
            const c = cell.trim();
            if (!c) return c;
            const left = c.startsWith(":");
            const right = c.endsWith(":");
            const width = Math.max(c.replace(/:/g, "").length, 3);
            return `${left ? ":" : ""}${"-".repeat(width)}${right ? ":" : ""}`;
          })
          .join(" | ")
      : row,
  );

  // 连续 3 行以上空行压成 2 行
  text = text.replace(/\n{3,}/g, "\n\n");

  // 标题、代码围栏、表格、列表前后补空行（渲染器对空行很敏感）
  const lines = text.split("\n");
  const out: string[] = [];
  const isBlockStart = (l: string) =>
    /^(#{1,6}\s|```|~~~|\||>\s?|[-*+]\s|\d+[.)]\s)/.test(l);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = out[out.length - 1] ?? "";
    const insideFence = (() => {
      let count = 0;
      for (const l of out) if (/^(```|~~~)/.test(l)) count += 1;
      return count % 2 === 1;
    })();
    if (!insideFence && isBlockStart(line) && prev.trim() !== "" && !isBlockStart(prev) && !/^\s/.test(line)) {
      out.push("");
    }
    out.push(line);
  }
  text = out.join("\n").replace(/\n{3,}/g, "\n\n");

  return `${text.trim()}\n`;
}
