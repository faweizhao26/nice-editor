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

/** 表格：插入一个 3×3 模板 */
export function insertTable(view: EditorView) {
  insertBlock(
    view,
    `\n| 列 1 | 列 2 | 列 3 |\n| :--- | :---: | ---: |\n| 内容 | 内容 | 内容 |\n\n`,
  );
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
