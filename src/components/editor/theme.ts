import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

/** 编辑器外观：跟着 App 的暗色主题走，尽量不抢视线 */
export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    backgroundColor: "transparent",
    color: "var(--fg)",
  },
  ".cm-scroller": {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    lineHeight: "1.75",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "16px 20px 40vh 20px",
    caretColor: "var(--accent)",
  },
  ".cm-line": { padding: "0" },
  "&.cm-focused": { outline: "none" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--muted)",
  },
  ".cm-activeLine": { backgroundColor: "rgba(127,127,127,0.06)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--accent)" },
  ".cm-selectionBackground, ::selection": { backgroundColor: "rgba(99,140,255,0.25)" },
  "&.cm-focused .cm-selectionBackground": { backgroundColor: "rgba(99,140,255,0.3)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  ".cm-searchMatch": { backgroundColor: "rgba(255,196,0,0.35)", outline: "1px solid rgba(255,196,0,0.6)" },
  ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: "rgba(255,120,0,0.45)" },
  ".cm-panels": { backgroundColor: "var(--panel)", color: "var(--fg)", border: "none" },
  ".cm-panels input, .cm-panels button": {
    backgroundColor: "var(--input-bg)",
    color: "var(--fg)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    padding: "2px 6px",
    font: "inherit",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--fg)",
  },
});

/** 标题 / 引用 / 强调的语法高亮，用 CSS 变量保持可主题化 */
export const markdownHighlight: Extension = EditorView.baseTheme({
  ".cm-content .cm-header": { fontWeight: "700", color: "var(--fg)" },
  ".cm-content .cm-header-1": { fontSize: "1.25em" },
  ".cm-content .cm-header-2": { fontSize: "1.15em" },
  ".cm-content .cm-header-3": { fontSize: "1.08em" },
  ".cm-content .cm-strong": { fontWeight: "700", color: "var(--accent)" },
  ".cm-content .cm-emphasis": { fontStyle: "italic" },
  ".cm-content .cm-strikethrough": { textDecoration: "line-through", opacity: 0.6 },
  ".cm-content .cm-link, .cm-content .cm-url": { color: "var(--accent)", textDecoration: "underline" },
  ".cm-content .cm-quote": { color: "var(--muted)" },
  ".cm-content .cm-list": { color: "var(--accent)" },
  ".cm-content .cm-meta": { color: "var(--muted)" },
  ".cm-content .cm-monospace": { color: "var(--code-fg)" },
  ".cm-content .cm-inline-code": { color: "var(--code-fg)" },
});
