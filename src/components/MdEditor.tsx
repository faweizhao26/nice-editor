"use client";

import { useEffect, useMemo, useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";

import { editorTheme, markdownHighlight } from "./editor/theme";
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
}

export default function MdEditor({ value, onChange, onViewReady, onLinkToFoot }: Props) {
  const ref = useRef<ReactCodeMirrorRef>(null);

  useEffect(() => {
    onViewReady?.(ref.current?.view ?? null);
    return () => onViewReady?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage }),
      EditorView.lineWrapping,
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
        ]),
      ),
    ],
    [onLinkToFoot],
  );

  return (
    <CodeMirror
      ref={ref}
      className="md-editor"
      value={value}
      height="100%"
      extensions={extensions}
      onChange={onChange}
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
