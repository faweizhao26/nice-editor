"use client";

import { create } from "zustand";
import { DEFAULT_FORMAT, type FormatState } from "@/lib/format";
import { SAMPLE_MARKDOWN } from "@/lib/sample";
import type { ShareDoc } from "@/lib/share";
import {
  DEFAULT_SETTINGS,
  type Draft,
  type Settings,
  loadCurrent,
  loadDrafts,
  loadSettings,
  newDraftId,
  saveCurrent,
  saveDrafts,
  saveSettings,
} from "@/lib/storage";

export type PanelId = "file" | "theme" | "code" | "format" | "function" | "view" | "help";

interface EditorStore extends Settings {
  title: string;
  content: string;
  activePanel: PanelId | null;
  drafts: Draft[];
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
    set({ title: "未命名文档", content: "", renderTick: get().renderTick + 1 });
    persist(get);
  },

  loadSample: () => {
    set({ title: "示例文档", content: SAMPLE_MARKDOWN, renderTick: get().renderTick + 1 });
    persist(get);
  },

  loadShared: (doc) => {
    set({
      title: doc.title,
      content: doc.content,
      themeId: doc.themeId,
      codeThemeId: doc.codeThemeId,
      customCss: doc.customCss,
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
}));
