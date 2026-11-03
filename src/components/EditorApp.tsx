"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { EditorView } from "@codemirror/view";

import { useEditor, type PanelId } from "@/store/editor";
import { createParser } from "@/lib/markdown";
import { buildStyleStack } from "@/lib/themes";
import { hasMath, typesetMath } from "@/lib/mathjax";
import { buildRichHtml, copyPlainText, copyRichText, type CopyTarget } from "@/lib/inline";
import { buildStandaloneHtml, downloadFile, pickMarkdownFile } from "@/lib/storage";
import { buildShareUrl, clearShareHash, readShareFromLocation, shareUrlHint } from "@/lib/share";
import { formatMarkdown } from "@/lib/formatDoc";

import MdEditor from "./MdEditor";
import PreviewPane from "./PreviewPane";
import { Panel, type PanelActions } from "./panels";

const RAIL: { id: PanelId; label: string; icon: string }[] = [
  { id: "file", label: "文件", icon: "M4 3h7l5 5v13H4z M11 3v5h5" },
  { id: "theme", label: "主题", icon: "M12 3a9 9 0 100 18 3 3 0 000-6 3 3 0 010-6 3 3 0 000-6z" },
  { id: "code", label: "代码主题", icon: "M8 6l-4 6 4 6 M16 6l4 6-4 6 M13 4l-2 16" },
  { id: "format", label: "格式", icon: "M5 6h14 M5 12h9 M5 18h12" },
  { id: "function", label: "功能", icon: "M12 3l2.5 6H21l-5 4 2 6-6-4-6 4 2-6-5-4h6.5z" },
  { id: "view", label: "视图", icon: "M3 5h18v14H3z M9 5v14" },
  { id: "help", label: "帮助", icon: "M12 17h.01 M9.5 9a2.5 2.5 0 115 .5c0 1.5-2.5 2-2.5 3.5 M12 21a9 9 0 100-18 9 9 0 000 18z" },
];

const COPY_ACTIONS: { id: CopyTarget; label: string; hint: string }[] = [
  { id: "wechat", label: "公众号", hint: "复制到微信公众号" },
  { id: "zhihu", label: "知乎", hint: "复制到知乎专栏" },
  { id: "juejin", label: "掘金", hint: "复制到掘金" },
  { id: "csdn", label: "CSDN", hint: "复制到 CSDN" },
];

export default function EditorApp() {
  const {
    title,
    content,
    themeId,
    codeThemeId,
    customCss,
    format,
    previewType,
    syncScroll,
    isMacCode,
    linkToFoot,
    activePanel,
    hydrated,
    renderTick,
  } = useEditor();

  const setTitle = useEditor((s) => s.setTitle);
  const setContent = useEditor((s) => s.setContent);
  const patch = useEditor((s) => s.patch);
  const togglePanel = useEditor((s) => s.togglePanel);
  const closePanel = useEditor((s) => s.closePanel);
  const hydrate = useEditor((s) => s.hydrate);
  const newDocument = useEditor((s) => s.newDocument);
  const loadSample = useEditor((s) => s.loadSample);
  const loadShared = useEditor((s) => s.loadShared);

  const [editorOpen, setEditorOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** 布局三态：双栏 → 只看预览 → 只看编辑 → 双栏 */
  const layoutMode: "both" | "preview" | "editor" =
    !editorOpen && previewOpen ? "preview" : editorOpen && !previewOpen ? "editor" : "both";
  const cycleLayout = useCallback(() => {
    const next =
      layoutMode === "both" ? { editorOpen: false, previewOpen: true }
      : layoutMode === "preview" ? { editorOpen: true, previewOpen: false }
      : { editorOpen: true, previewOpen: true };
    setEditorOpen(next.editorOpen);
    setPreviewOpen(next.previewOpen);
  }, [layoutMode]);

  const niceRef = useRef<HTMLElement | null>(null);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const syncing = useRef(false);
  const toastTimer = useRef<number | undefined>(undefined);

  /* ---------------- Toast ---------------- */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  /* ---------------- 初始化：读本地草稿与偏好，并处理分享链接 ---------------- */
  useEffect(() => {
    hydrate();
    const shared = readShareFromLocation();
    if (shared) {
      loadShared(shared);
      clearShareHash();
      showToast(`已载入分享的文章「${shared.title}」`);
    }
  }, [hydrate, loadShared, showToast]);

  /* 窄屏（手机）默认收起面板，否则面板会把内容全盖住 */
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 980) closePanel();
  }, [closePanel]);

  /* ---------------- Markdown → HTML ---------------- */
  const deferredContent = useDeferredValue(content);
  const html = useMemo(() => {
    const md = createParser({ linkToFoot });
    try {
      return md.render(deferredContent);
    } catch (e) {
      return `<p style="color:#c00">渲染失败：${String(e)}</p>`;
    }
    // renderTick 用于「载入草稿/新建」时强制重渲染
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredContent, linkToFoot, renderTick]);

  const styleStack = useMemo(
    () => buildStyleStack({ themeId, codeThemeId, format, customCss, isMacCode }),
    [themeId, codeThemeId, format, customCss, isMacCode],
  );

  /* ---------------- 数学公式排版 ---------------- */
  useEffect(() => {
    if (!hasMath(deferredContent)) return;
    const timer = window.setTimeout(() => {
      void typesetMath(niceRef.current);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [html, deferredContent]);

  /* ---------------- 同步滚动 ---------------- */
  useEffect(() => {
    const scroller = editorView?.scrollDOM;
    const preview = previewScrollRef.current;
    if (!scroller || !preview || !syncScroll) return;

    const ratioOf = (el: HTMLElement) => el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);

    const onEditorScroll = () => {
      if (syncing.current) return;
      syncing.current = true;
      preview.scrollTop = ratioOf(scroller) * Math.max(1, preview.scrollHeight - preview.clientHeight);
      requestAnimationFrame(() => {
        syncing.current = false;
      });
    };
    const onPreviewScroll = () => {
      if (syncing.current) return;
      syncing.current = true;
      scroller.scrollTop = ratioOf(preview) * Math.max(1, scroller.scrollHeight - scroller.clientHeight);
      requestAnimationFrame(() => {
        syncing.current = false;
      });
    };

    scroller.addEventListener("scroll", onEditorScroll, { passive: true });
    preview.addEventListener("scroll", onPreviewScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onEditorScroll);
      preview.removeEventListener("scroll", onPreviewScroll);
    };
  }, [syncScroll, editorView]);

  /* ---------------- 复制 ---------------- */
  const handleCopy = useCallback(
    async (target: CopyTarget) => {
      const el = niceRef.current;
      if (!el) return;
      setBusy(true);
      try {
        const rich = buildRichHtml(el, styleStack.inline, target);
        const ok = await copyRichText(rich);
        const name = COPY_ACTIONS.find((a) => a.id === target)?.label ?? target;
        showToast(ok ? `已复制（${name}格式），去编辑器里粘贴即可` : "复制失败，请手动选中预览区复制");
      } catch (e) {
        showToast(`复制出错：${String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [styleStack.inline, showToast],
  );

  /* ---------------- 文件 ---------------- */
  const handleImport = useCallback(async () => {
    const file = await pickMarkdownFile();
    if (!file) return;
    setContent(file.content);
    setTitle(file.name.replace(/\.(md|markdown|txt)$/i, ""));
    showToast(`已导入 ${file.name}`);
  }, [setContent, setTitle, showToast]);

  const handleExportMd = useCallback(() => {
    downloadFile(`${title || "未命名文档"}.md`, content, "text/markdown;charset=utf-8");
  }, [title, content]);

  const handleExportHtml = useCallback(() => {
    const el = niceRef.current;
    if (!el) return;
    const inlined = buildRichHtml(el, styleStack.inline, "wechat");
    downloadFile(
      `${title || "未命名文档"}.html`,
      buildStandaloneHtml(title || "未命名文档", inlined, ""),
      "text/html;charset=utf-8",
    );
  }, [title, styleStack.inline]);

  const handlePrint = useCallback(() => {
    document.body.classList.add("printing");
    window.print();
    window.setTimeout(() => document.body.classList.remove("printing"), 800);
  }, []);

  /** 生成分享链接：正文 + 主题 + 格式全部编码进 URL 的 fragment */
  const handleShare = useCallback(async () => {
    const url = buildShareUrl({ title, content, themeId, codeThemeId, customCss, format });
    const ok = await copyPlainText(url);
    if (!ok) {
      showToast("复制失败，请手动从地址栏复制");
      return;
    }
    showToast(shareUrlHint(url) ?? `分享链接已复制（${url.length} 字符），发给同事点开即恢复全文`);
  }, [title, content, themeId, codeThemeId, customCss, format, showToast]);

  const actions: PanelActions = {
    onImport: handleImport,
    onExportMd: handleExportMd,
    onExportHtml: handleExportHtml,
    onPrint: handlePrint,
    onFormatDoc: () => {
      setContent(formatMarkdown(content));
      showToast("已格式化");
    },
    onLinkToFoot: () => {
      patch({ linkToFoot: !linkToFoot });
      showToast(linkToFoot ? "已关闭外链转脚注" : "已开启外链转脚注");
    },
    onClear: () => {
      if (!window.confirm("确定清空当前内容？此操作不可撤销。")) return;
      newDocument();
      showToast("已清空");
    },
    onShare: handleShare,
    onCopy: handleCopy,
  };

  const stats = useMemo(() => {
    const chars = content.length;
    const lines = content ? content.split("\n").length : 0;
    return { chars, lines, words: content.replace(/\s/g, "").length };
  }, [content]);

  if (!hydrated) {
    return (
      <div className="app-loading">
        <span>正在载入编辑器…</span>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ---------------- 顶栏 ---------------- */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-mark">N</span>
          <input
            className="title-input"
            value={title}
            placeholder="未命名文档"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="navbar-actions">
          <button type="button" className="nav-btn" onClick={handleImport}>
            导入
          </button>
          <button type="button" className="nav-btn" onClick={handleExportMd}>
            导出 MD
          </button>
          <button
            type="button"
            className="nav-btn"
            onClick={cycleLayout}
            title="在「双栏 / 只看预览 / 只看编辑」之间切换"
          >
            {layoutMode === "both" ? "只看预览" : layoutMode === "preview" ? "只看编辑" : "双栏"}
          </button>
          <button type="button" className="nav-btn nav-btn-primary" onClick={() => handleCopy("wechat")} disabled={busy}>
            {busy ? "复制中…" : "复制到公众号"}
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* ---------------- 左侧图标栏 ---------------- */}
        <nav className="rail">
          {RAIL.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rail-btn${activePanel === item.id ? " is-active" : ""}`}
              title={item.label}
              onClick={() => togglePanel(item.id)}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden>
                <path
                  d={item.icon}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="rail-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ---------------- 面板 ---------------- */}
        {activePanel ? (
          <aside className="panel">
            <div className="panel-head">
              <h2>{RAIL.find((r) => r.id === activePanel)?.label}</h2>
              <button type="button" className="panel-close" onClick={closePanel} title="收起面板">
                ×
              </button>
            </div>
            <div className="panel-scroll">
              <Panel
                id={activePanel}
                actions={actions}
                view={{
                  editorOpen,
                  previewOpen,
                  onToggleEditor: () => setEditorOpen((v) => !v),
                  onTogglePreview: () => setPreviewOpen((v) => !v),
                }}
              />
            </div>
          </aside>
        ) : null}

        {/* ---------------- 工作区 ---------------- */}
        <main className={`workbench${previewType === "pc" ? " is-pc" : ""}`}>
          {editorOpen ? (
            <div className="pane pane-editor">
              <div className="pane-head">
                <span>Markdown</span>
                <span className="pane-head-meta">
                  {stats.lines} 行 · {stats.chars} 字符
                </span>
              </div>
              <div className="pane-body">
                <MdEditor
                  value={content}
                  onChange={setContent}
                  onViewReady={setEditorView}
                  onLinkToFoot={actions.onLinkToFoot}
                />
              </div>
            </div>
          ) : null}

          {previewOpen ? (
            <div className="pane pane-preview">
              <div className="pane-head">
                <span>预览</span>
                <span className="pane-head-meta">
                  <button
                    type="button"
                    className={`seg${previewType === "phone" ? " is-active" : ""}`}
                    onClick={() => patch({ previewType: "phone" })}
                  >
                    手机
                  </button>
                  <button
                    type="button"
                    className={`seg${previewType === "pc" ? " is-active" : ""}`}
                    onClick={() => patch({ previewType: "pc" })}
                  >
                    电脑
                  </button>
                </span>
              </div>
              <div className="pane-body pane-body-preview">
                <PreviewPane
                  html={html}
                  css={styleStack.preview}
                  previewType={previewType}
                  niceRef={niceRef}
                  scrollRef={previewScrollRef}
                  isMacCode={isMacCode}
                />
                <div className="copy-bar">
                  {COPY_ACTIONS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="copy-btn"
                      title={a.hint}
                      onClick={() => handleCopy(a.id)}
                      disabled={busy}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* ---------------- 状态栏 ---------------- */}
      <footer className="statusbar">
        <span className="status-item">{stats.lines} 行</span>
        <span className="status-item">{stats.chars} 字符</span>
        <span className="status-item">{stats.words} 不计空白</span>
        <span className="status-spacer" />
        <label className="status-toggle">
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={(e) => patch({ syncScroll: e.target.checked })}
          />
          同步滚动
        </label>
        <button type="button" className="status-btn" onClick={loadSample}>
          载入示例
        </button>
      </footer>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
