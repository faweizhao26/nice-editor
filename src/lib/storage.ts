import { DEFAULT_FORMAT, type FormatState } from "./format";
import { DEFAULT_CODE_THEME_ID } from "./themes/codeThemes";
import { DEFAULT_THEME_ID } from "./themes/builtin";

/**
 * 纯前端持久化：全部落在 localStorage，不依赖任何后端。
 *  - nice:drafts   草稿列表（含正文），最多保留 50 篇
 *  - nice:history  本地历史快照（自动留档，可回滚），最多 30 份
 *  - nice:settings 主题 / 格式 / 视图等偏好
 *  - nice:current  当前正在编辑的内容，刷新不丢
 */

export interface Draft {
  id: string;
  title: string;
  content: string;
  themeId: string;
  codeThemeId: string;
  customCss: string;
  format: FormatState;
  createdAt: number;
  updatedAt: number;
}

/**
 * 本地历史快照。
 *
 * 为什么需要：`保存当前草稿` 是**按标题覆盖**的 —— 一键格式化、清空、手滑之后，
 * 草稿里的旧版本就没了，只有会话内的 ⌘Z 能救。快照是自动留的，不依赖用户记得点保存。
 */
export interface Snapshot {
  id: string;
  ts: number;
  title: string;
  content: string;
  themeId: string;
  codeThemeId: string;
  customCss: string;
  format: FormatState;
  /** 为什么留的这份快照，显示在列表里（如「格式化前」「清空前」「自动」） */
  reason: string;
}

export interface Settings {
  themeId: string;
  codeThemeId: string;
  customCss: string;
  format: FormatState;
  previewType: "phone" | "pc";
  syncScroll: boolean;
  isMacCode: boolean;
  /** 微信外链转脚注：开启后正文链接变成 [n]，文末生成「参考资料」 */
  linkToFoot: boolean;
}

export const SETTINGS_KEY = "nice:settings";
export const DRAFTS_KEY = "nice:drafts";
export const HISTORY_KEY = "nice:history";
export const CURRENT_KEY = "nice:current";
const MAX_DRAFTS = 50;
const MAX_HISTORY = 30;

export const DEFAULT_SETTINGS: Settings = {
  themeId: DEFAULT_THEME_ID,
  codeThemeId: DEFAULT_CODE_THEME_ID,
  customCss: "",
  format: DEFAULT_FORMAT,
  previewType: "phone",
  syncScroll: true,
  isMacCode: false,
  linkToFoot: false,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const canStore = () => typeof window !== "undefined" && !!window.localStorage;

export function loadSettings(): Settings {
  if (!canStore()) return DEFAULT_SETTINGS;
  const stored = safeParse<Partial<Settings>>(window.localStorage.getItem(SETTINGS_KEY), {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    format: { ...DEFAULT_FORMAT, ...(stored.format ?? {}) },
  };
}

export function saveSettings(s: Settings): void {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* 配额满了就算了，不能因为存偏好失败把编辑器搞挂 */
  }
}

export function loadDrafts(): Draft[] {
  if (!canStore()) return [];
  const list = safeParse<Draft[]>(window.localStorage.getItem(DRAFTS_KEY), []);
  return Array.isArray(list) ? list : [];
}

export function saveDrafts(list: Draft[]): void {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(list.slice(0, MAX_DRAFTS)));
  } catch {
    /* 忽略 */
  }
}

export function newDraftId(): string {
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadHistory(): Snapshot[] {
  if (!canStore()) return [];
  const list = safeParse<Snapshot[]>(window.localStorage.getItem(HISTORY_KEY), []);
  return Array.isArray(list) ? list : [];
}

export function saveHistory(list: Snapshot[]): void {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
  } catch {
    /* 配额满了：历史是锦上添花，不能因为它把正文存不进去 */
  }
}

export function newSnapshotId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const HISTORY_LIMIT = MAX_HISTORY;

export function loadCurrent(): { title: string; content: string } | null {
  if (!canStore()) return null;
  return safeParse<{ title: string; content: string } | null>(window.localStorage.getItem(CURRENT_KEY), null);
}

export function saveCurrent(title: string, content: string): void {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(CURRENT_KEY, JSON.stringify({ title, content }));
  } catch {
    /* 忽略 */
  }
}

/* ------------------------------------------------------------------ *
 * 文件导入导出
 * ------------------------------------------------------------------ */
export function downloadFile(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function pickMarkdownFile(): Promise<{ name: string; content: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt,text/markdown,text/plain";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const content = await file.text();
      resolve({ name: file.name, content });
    };
    input.click();
  });
}

/** 导出成一份自带样式的独立 HTML（双击就能看，也能直接贴进别的 CMS） */
export function buildStandaloneHtml(title: string, bodyHtml: string, css: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/[<>&]/g, "")}</title>
<style>
  body { margin: 0; padding: 24px 12px; background: #f5f5f5; }
  .nice-page { max-width: 677px; margin: 0 auto; background: #fff; padding: 20px 0; border-radius: 8px; }
${css}
</style>
</head>
<body>
<div class="nice-page">
${bodyHtml}
</div>
</body>
</html>`;
}
