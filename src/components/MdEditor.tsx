"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";

import { editorTheme, darkThemeCompartment, markdownHighlight } from "./editor/theme";
import {
  insertCodeBlock,
  insertHr,
  insertImage,
  insertLink,
  insertMathBlock,
  insertTable,
  linkToFootnote,
  prefixLines,
  replaceDoc,
  wrapSelection,
} from "./editor/commands";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onViewReady?: (view: EditorView | null) => void;
  onLinkToFoot?: () => void;
  /** 一键格式化（快捷键 Mod-Alt-F，与 mdnice 的 Ctrl/Cmd+Alt+F 一致） */
  onFormatDoc?: () => void;
}

export default function MdEditor({ value, onChange, onViewReady, onLinkToFoot, onFormatDoc }: Props) {
  const ref = useRef<ReactCodeMirrorRef>(null);

  /**
   * 拿到 `EditorView` 唯一可靠的方式是 `onCreateEditor`。
   *
   * ⚠️ 不要用 `ref.current?.view`：`@uiw/react-codemirror` 是用
   * `useImperativeHandle` 暴露 view 的，组件挂载那一刻它可能还没赋值，
   * 而写在 `useEffect(..., [])` 里的代码只跑一次 —— 拿不到就永远是 null。
   * 后果是所有依赖 view 的功能（同步滚动、表格增删行列）**静默失效**，
   * 点了没反应也不报错。
   */
  const handleCreateEditor = useCallback(
    (view: EditorView) => {
      onViewReady?.(view);
    },
    [onViewReady],
  );

  /** 卸载时清掉引用，避免留着已经销毁的 view */
  useEffect(() => () => onViewReady?.(null), [onViewReady]);

  /**
   * 让 CodeMirror 的默认配色（选区、光标、补全弹层）跟着系统的明暗模式走。
   * 不设这个 facet 的话它永远用浅色那套，在深色界面里会显得很突兀。
   */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (isDark: boolean) => {
      ref.current?.view?.dispatch({
        effects: darkThemeCompartment.reconfigure(EditorView.darkTheme.of(isDark)),
      });
    };
    apply(mq.matches);
    const onSchemeChange = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", onSchemeChange);
    return () => mq.removeEventListener("change", onSchemeChange);
  }, []);

  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage }),
      EditorView.lineWrapping,
      // 初始值无所谓，挂载后上面的 effect 会按系统配色重新配置
      darkThemeCompartment.of(EditorView.darkTheme.of(false)),
      editorTheme,
      markdownHighlight,
      Prec.high(
        keymap.of([
          { key: "Mod-b", preventDefault: true, run: (v) => (wrapSelection(v, "**", "**", "粗体"), true) },
          { key: "Mod-i", preventDefault: true, run: (v) => (wrapSelection(v, "*", "*", "斜体"), true) },
          { key: "Mod-d", preventDefault: true, run: (v) => (wrapSelection(v, "~~", "~~", "删除线"), true) },
          { key: "Mod-e", preventDefault: true, run: (v) => (wrapSelection(v, "`", "`", "code"), true) },
          { key: "Mod-k", preventDefault: true, run: (v) => (insertLink(v), true) },
          { key: "Mod-Shift-i", preventDefault: true, run: (v) => (insertImage(v), true) },
          { key: "Mod-Shift-c", preventDefault: true, run: (v) => (insertCodeBlock(v), true) },
          { key: "Mod-Shift-m", preventDefault: true, run: (v) => (insertMathBlock(v), true) },
          { key: "Mod-Shift-t", preventDefault: true, run: (v) => (insertTable(v), true) },
          { key: "Mod-Shift-h", preventDefault: true, run: (v) => (insertHr(v), true) },
          { key: "Mod-1", preventDefault: true, run: (v) => (prefixLines(v, "# "), true) },
          { key: "Mod-2", preventDefault: true, run: (v) => (prefixLines(v, "## "), true) },
          { key: "Mod-3", preventDefault: true, run: (v) => (prefixLines(v, "### "), true) },
          { key: "Mod-Shift-8", preventDefault: true, run: (v) => (prefixLines(v, "- "), true) },
          { key: "Mod-Shift-9", preventDefault: true, run: (v) => (prefixLines(v, "1. "), true) },
          { key: "Mod-Shift-.", preventDefault: true, run: (v) => (prefixLines(v, "> "), true) },
          {
            key: "Mod-l",
            preventDefault: true,
            run: (v) => {
              if (onLinkToFoot) {
                onLinkToFoot();
              } else {
                replaceDoc(v, linkToFootnote(v.state));
              }
              return true;
            },
          },
          {
            key: "Mod-Alt-f",
            preventDefault: true,
            run: () => {
              onFormatDoc?.();
              return true;
            },
          },
        ]),
      ),
    ],
    [onLinkToFoot, onFormatDoc],
  );

  return (
    // theme="none" 是必须的：默认值 'light' 会注入 `.cm-editor{background:#fff}`，
    // 深色模式下把编辑器刷成白底、而文字是浅色的，直接看不清。
    <CodeMirror
      ref={ref}
      className="md-editor"
      value={value}
      height="100%"
      extensions={extensions}
      onChange={onChange}
      onCreateEditor={handleCreateEditor}
      theme="none"
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: false,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        highlightSelectionMatches: true,
        searchKeymap: true,
        tabSize: 2,
      }}
    />
  );
}
