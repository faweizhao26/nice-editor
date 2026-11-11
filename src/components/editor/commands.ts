import { EditorSelection, type EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

/** 用前后缀包住选区；没有选区时插入占位文本并选中它 */
export function wrapSelection(view: EditorView, before: string, after = before, placeholder = "") {
  const changes = view.state.changeByRange((range) => {
    const selected = view.state.sliceDoc(range.from, range.to);
    const text = selected || placeholder;
    const insert = `${before}${text}${after}`;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.range(
        range.from + before.length,
        range.from + before.length + text.length,
      ),
    };
  });
  view.dispatch(changes, { scrollIntoView: true, userEvent: "input" });
  view.focus();
}

/** 给每一行加前缀（用于列表、引用、标题） */
export function prefixLines(view: EditorView, prefix: string, toggle = true) {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const from = state.doc.lineAt(range.from).from;
    const to = state.doc.lineAt(range.to).to;
    const block = state.sliceDoc(from, to);
    const lines = block.split("\n");
    const already = lines.every((l) => l.startsWith(prefix));
    const next = lines
      .map((l) => (already ? l.slice(prefix.length) : `${prefix}${l}`))
      .join("\n");
    return { changes: { from, to, insert: next }, range: EditorSelection.range(from, from + next.length) };
  });
  view.dispatch(changes, { scrollIntoView: true, userEvent: "input" });
  view.focus();
}

/** 插入一段文本（可选是否独占一行） */
export function insertBlock(view: EditorView, text: string) {
  const { state } = view;
  const changes = state.changeByRange((range) => ({
    changes: { from: range.from, to: range.to, insert: text },
    range: EditorSelection.cursor(range.from + text.length),
  }));
  view.dispatch(changes, { scrollIntoView: true, userEvent: "input" });
  view.focus();
}

export function insertLink(view: EditorView) {
  const selected = view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to);
  wrapSelection(view, "[", "](https://)", selected || "链接文字");
}

export function insertImage(view: EditorView) {
  const selected = view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to);
  wrapSelection(view, "![", "](https://)", selected || "图片描述");
}

/** 表格：插入 rows × cols 的模板（含表头与分隔行） */
export function insertTable(view: EditorView, rows = 2, cols = 3) {
  const n = Math.max(1, Math.min(20, rows));
  const m = Math.max(1, Math.min(10, cols));
  const header = `| ${Array.from({ length: m }, (_, i) => `列 ${i + 1}`).join(" | ")} |`;
  const sep = `| ${Array.from({ length: m }, () => "---").join(" | ")} |`;
  const body = Array.from({ length: n }, () => `| ${Array.from({ length: m }, () => "内容").join(" | ")} |`);
  insertBlock(view, `\n${[header, sep, ...body].join("\n")}\n\n`);
}

/* ------------------------------------------------------------------ *
 * 表格增删行列
 *
 * 在 Markdown 里手改表格竖线对齐非常痛，所以给光标所在的表格提供
 * 「加一行 / 加一列 / 删一行 / 删一列」。找不到表格时返回 false，
 * 由调用方给出提示，而不是静默什么都不做。
 * ------------------------------------------------------------------ */

interface TableBlock {
  from: number;
  to: number;
  /** 光标所在行在 rows 里的下标 */
  cursorRow: number;
  /** 光标所在列 */
  cursorCol: number;
  rows: string[][];
}

/** 一行是否属于表格（必须以 | 开头，且至少有两个 |） */
const isTableLine = (l: string) => /^\s*\|.*\|/.test(l);

/** 拆一行成单元格（去掉首尾竖线与空白） */
function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

/** 分隔行：全是 --- / :--- / ---: 之类的单元格 */
const isSepRow = (cells: string[]) =>
  cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, "")));

/** 光标落在第几个单元格 */
function colAt(line: string, offset: number): number {
  const parts = line.split("|");
  let acc = 0;
  for (let i = 0; i < parts.length; i++) {
    const end = acc + parts[i].length;
    if (offset <= end) return Math.max(0, i - 1);
    acc = end + 1;
  }
  return Math.max(0, parts.length - 2);
}

function findTableAt(state: EditorState, pos: number): TableBlock | null {
  const cur = state.doc.lineAt(pos);
  if (!isTableLine(cur.text)) return null;

  let first = cur.number;
  while (first > 1 && isTableLine(state.doc.line(first - 1).text)) first -= 1;
  let last = cur.number;
  while (last < state.doc.lines && isTableLine(state.doc.line(last + 1).text)) last += 1;

  const rows: string[][] = [];
  for (let n = first; n <= last; n++) rows.push(splitRow(state.doc.line(n).text));
  if (rows.length < 2) return null; // 至少要「表头 + 分隔行」

  return {
    from: state.doc.line(first).from,
    to: state.doc.line(last).to,
    cursorRow: cur.number - first,
    cursorCol: colAt(cur.text, pos - cur.from),
    rows,
  };
}

/** 把所有行补齐到同样的列数，再拼回 Markdown */
function rebuild(rows: string[][]): string {
  const cols = Math.max(...rows.map((r) => r.length));
  return rows
    .map((r) => {
      const sep = isSepRow(r);
      const cells = Array.from({ length: cols }, (_, i) => r[i] ?? (sep ? "---" : ""));
      return `| ${cells.join(" | ")} |`;
    })
    .join("\n");
}

function replaceTable(view: EditorView, t: TableBlock, rows: string[][]): boolean {
  const text = rebuild(rows);
  view.dispatch({
    changes: { from: t.from, to: t.to, insert: text },
    // 光标放到表格末尾：加行时正好落在新行，加列时落在新列，可以直接接着打
    selection: EditorSelection.cursor(t.from + text.length),
    scrollIntoView: true,
    userEvent: "input",
  });
  view.focus();
  return true;
}

export function tableAddRow(view: EditorView): boolean {
  const t = findTableAt(view.state, view.state.selection.main.head);
  if (!t) return false;
  const cols = t.rows[0].length;
  return replaceTable(view, t, [...t.rows, Array.from({ length: cols }, () => "")]);
}

export function tableAddColumn(view: EditorView): boolean {
  const t = findTableAt(view.state, view.state.selection.main.head);
  if (!t) return false;
  return replaceTable(
    view,
    t,
    t.rows.map((r) => [...r, isSepRow(r) ? "---" : ""]),
  );
}

export function tableDeleteRow(view: EditorView): boolean {
  const t = findTableAt(view.state, view.state.selection.main.head);
  if (!t) return false;
  if (t.cursorRow < 2) return false; // 表头 / 分隔行不能删
  if (t.rows.length <= 3) return false; // 至少留一行数据
  return replaceTable(view, t, t.rows.filter((_, i) => i !== t.cursorRow));
}

export function tableDeleteColumn(view: EditorView): boolean {
  const t = findTableAt(view.state, view.state.selection.main.head);
  if (!t) return false;
  if (t.rows[0].length <= 1) return false; // 至少留一列
  const c = Math.min(t.cursorCol, t.rows[0].length - 1);
  return replaceTable(view, t, t.rows.map((r) => r.filter((_, i) => i !== c)));
}

export function insertCodeBlock(view: EditorView) {
  insertBlock(view, "\n```typescript\n\n```\n\n");
}

export function insertMathBlock(view: EditorView) {
  insertBlock(view, "\n$$\n\n$$\n\n");
}

export function insertHr(view: EditorView) {
  insertBlock(view, "\n\n---\n\n");
}

/* ------------------------------------------------------------------ *
 * 微信外链转脚注：把正文里的 [文字](http…) 改成 文字[^n]，并在文末补上定义
 * ------------------------------------------------------------------ */
export function linkToFootnote(state: EditorState): string {
  const doc = state.doc.toString();
  const links: string[] = [];
  const converted = doc.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, text: string, url: string) => {
    let n = links.indexOf(url);
    if (n === -1) {
      links.push(url);
      n = links.length - 1;
    }
    return `${text}[^${n + 1}]`;
  });
  if (!links.length) return doc;
  const defs = links.map((url, i) => `[^${i + 1}]: ${url}`).join("\n");
  return `${converted.replace(/\s+$/, "")}\n\n${defs}\n`;
}

/** 文档级替换 */
export function replaceDoc(view: EditorView, next: string) {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: next },
    userEvent: "input",
  });
  view.focus();
}
