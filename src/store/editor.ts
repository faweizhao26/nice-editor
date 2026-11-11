"use client";

import { create } from "zustand";
import { DEFAULT_FORMAT, type FormatState } from "@/lib/format";
import { SAMPLE_MARKDOWN } from "@/lib/sample";
import { compactCss, type ShareDoc } from "@/lib/share";
import {
  DEFAULT_SETTINGS,
  HISTORY_LIMIT,
  type Draft,
  type Settings,
  type Snapshot,
  loadCurrent,
  loadDrafts,
  loadHistory,
  loadSettings,
  newDraftId,
  newSnapshotId,
  saveCurrent,
  saveDrafts,
  saveHistory,
  saveSettings,
} from "@/lib/storage";

export type PanelId = "file" | "theme" | "code" | "format" | "function" | "view" | "help";

interface EditorStore extends Settings {
  title: string;
  content: string;
  activePanel: PanelId | null;
  drafts: Draft[];
  history: Snapshot[];
  hydrated: boolean;
  /** 递增后触发预览重新排版（MathJax 需要知道内容变了） */
  renderTick: number;

  hydrate: () => void;
  setTitle: (v: string) => void;
  setContent: (v: string) => void;
  patch: (p: Partial<Settings>) => void;
  setFormat: (p: Partial<FormatState>) => void;
  togglePanel: (id: PanelId) => void;
  closePanel: () => void;
  newDocument: () => void;
  loadSample: () => void;
  loadShared: (doc: ShareDoc) => void;
  saveDraft: () => void;
  openDraft: (id: string) => void;
  removeDraft: (id: string) => void;
  /** 给当前状态留一份历史快照（内容没变时会自动跳过） */
  snapshot: (reason: string) => void;
  restoreSnapshot: (id: string) => void;
  removeSnapshot: (id: string) => void;
}

function persist(get: () => EditorStore) {
  const s = get();
  saveSettings({
    themeId: s.themeId,
    codeThemeId: s.codeThemeId,
    customCss: s.customCss,
    format: s.format,
    previewType: s.previewType,
    syncScroll: s.syncScroll,
    isMacCode: s.isMacCode,
    linkToFoot: s.linkToFoot,
  });
  saveCurrent(s.title, s.content);
}

export const useEditor = create<EditorStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  title: "未命名文档",
  content: SAMPLE_MARKDOWN,
  activePanel: "theme",
  drafts: [],
  history: [],
  hydrated: false,
  renderTick: 0,

  hydrate: () => {
    if (get().hydrated) return;
    const settings = loadSettings();
    const current = loadCurrent();
    set({
      ...settings,
      title: current?.title ?? "未命名文档",
      content: current?.content ?? SAMPLE_MARKDOWN,
      drafts: loadDrafts(),
      history: loadHistory(),
      hydrated: true,
    });
  },

  setTitle: (v) => {
    set({ title: v });
    persist(get);
  },

  setContent: (v) => {
    set({ content: v });
    persist(get);
  },

  patch: (p) => {
    set(p as Partial<EditorStore>);
    persist(get);
  },

  setFormat: (p) => {
    set({ format: { ...get().format, ...p } });
    persist(get);
  },

  togglePanel: (id) => set({ activePanel: get().activePanel === id ? null : id }),
  closePanel: () => set({ activePanel: null }),

  newDocument: () => {
    get().snapshot("新建前");
    set({ title: "未命名文档", content: "", renderTick: get().renderTick + 1 });
    persist(get);
  },

  loadSample: () => {
    get().snapshot("载入示例前");
    set({ title: "示例文档", content: SAMPLE_MARKDOWN, renderTick: get().renderTick + 1 });
    persist(get);
  },

  loadShared: (doc) => {
    const s = get();
    // 打开分享链接会覆盖当前内容，先留一份（首次打开时内容还是示例文档，没什么可留的，跳过）
    if (s.content !== SAMPLE_MARKDOWN) s.snapshot("载入分享前");
    /**
     * 分享链接里的自定义 CSS 是**压缩过**的（`compactCss` 去掉了注释）。
     * 如果本地已有的 CSS 压缩后与传入的完全相同，就保留本地那份 ——
     * 否则自己换设备 / 反复打开同一条链接时，会把带注释的原始 CSS 弄丢。
     */
    const keepLocalCss =
      !!doc.customCss &&
      !!s.customCss &&
      compactCss(s.customCss) === compactCss(doc.customCss);

    set({
      title: doc.title,
      content: doc.content,
      themeId: doc.themeId,
      codeThemeId: doc.codeThemeId,
      customCss: keepLocalCss ? s.customCss : doc.customCss,
      format: { ...DEFAULT_FORMAT, ...doc.format },
      renderTick: get().renderTick + 1,
    });
    persist(get);
  },

  saveDraft: () => {
    const s = get();
    const now = Date.now();
    const existing = s.drafts.find((d) => d.title === s.title && d.content === s.content);
    const draft: Draft = {
      id: existing?.id ?? newDraftId(),
      title: s.title || "未命名文档",
      content: s.content,
      themeId: s.themeId,
      codeThemeId: s.codeThemeId,
      customCss: s.customCss,
      format: s.format,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const rest = s.drafts.filter((d) => d.id !== draft.id);
    const drafts = [draft, ...rest].sort((a, b) => b.updatedAt - a.updatedAt);
    saveDrafts(drafts);
    set({ drafts });
  },

  openDraft: (id) => {
    const draft = get().drafts.find((d) => d.id === id);
    if (!draft) return;
    get().snapshot("打开草稿前");
    set({
      title: draft.title,
      content: draft.content,
      themeId: draft.themeId,
      codeThemeId: draft.codeThemeId,
      customCss: draft.customCss,
      format: { ...DEFAULT_FORMAT, ...draft.format },
      renderTick: get().renderTick + 1,
    });
    persist(get);
  },

  removeDraft: (id) => {
    const drafts = get().drafts.filter((d) => d.id !== id);
    saveDrafts(drafts);
    set({ drafts });
  },

  snapshot: (reason) => {
    const s = get();
    if (!s.content.trim()) return; // 空文档不值得留档
    const latest = s.history[0];
    // 与最近一份完全一样就不重复留（自动快照每几分钟跑一次，不判重会瞬间填满）
    if (
      latest &&
      latest.content === s.content &&
      latest.title === s.title &&
      latest.customCss === s.customCss
    ) {
      return;
    }
    const snap: Snapshot = {
      id: newSnapshotId(),
      ts: Date.now(),
      reason,
      title: s.title,
      content: s.content,
      themeId: s.themeId,
      codeThemeId: s.codeThemeId,
      customCss: s.customCss,
      format: s.format,
    };
    const history = [snap, ...s.history].slice(0, HISTORY_LIMIT);
    saveHistory(history);
    set({ history });
  },

  restoreSnapshot: (id) => {
    const s = get();
    const snap = s.history.find((h) => h.id === id);
    if (!snap) return;
    // 先把「现在」留一份，这样回滚本身也能再回滚回去
    s.snapshot("回滚前");
    set({
      title: snap.title,
      content: snap.content,
      themeId: snap.themeId,
      codeThemeId: snap.codeThemeId,
      customCss: snap.customCss,
      format: { ...DEFAULT_FORMAT, ...snap.format },
      renderTick: get().renderTick + 1,
    });
    persist(get);
  },

  removeSnapshot: (id) => {
    const history = get().history.filter((h) => h.id !== id);
    saveHistory(history);
    set({ history });
  },
}));
