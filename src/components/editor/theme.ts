import { EditorView } from "@codemirror/view";
import { Compartment, type Extension } from "@codemirror/state";

/**
 * 编辑器外观。
 *
 * ⚠️ 两个必须注意的点：
 *
 * 1. `@uiw/react-codemirror` 的 `theme` 属性**默认是 `'light'`**，它会在我们的
 *    扩展之后注入一条 `.cm-editor { background-color: #fff }`。两条规则优先级相同
 *    （都是单 class），它排后面所以它赢 —— 深色模式下编辑器会变成白底，而文字用
 *    的是 `var(--fg)`（深色模式下是浅色 `#e6e8eb`），结果就是白底浅字，完全看不清。
 *    所以组件里必须传 `theme="none"`，让样式完全由这里控制。
 *
 * 2. CodeMirror 自己的默认配色（选区、光标、自动补全弹层等）由 `darkTheme` facet 决定，
 *    不设的话永远走浅色那套。用 `darkThemeCompartment` 跟着系统的明暗模式切换。
 */
export const darkThemeCompartment = new Compartment();

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
