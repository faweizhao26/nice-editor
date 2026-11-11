/**
 * 正文字数统计。
 *
 * ## 为什么不用 `content.length`
 *
 * 那是**源文档**长度，把 `#`、`**`、表格竖线、`` ` ``、URL 全算进去了。
 * 实测一篇真实风格的文档：源文档 226 字符，渲染后正文只有 130 字符 ——
 * **虚高 74%**。而写公众号关心的是正文长度，所以这里按**渲染后的 HTML** 统计。
 *
 * 渲染结果由 `EditorApp` 已经算好了（`html`），这里只做取文本 + 计数，
 * 不重新解析 Markdown。
 */

export interface TextStats {
  /** 源文档行数 */
  lines: number;
  /** 源文档长度（Markdown 源码） */
  source: number;
  /** 正文字数：渲染后去掉所有空白字符的长度 */
  chars: number;
  /** 中文字数（含中文/全角标点） */
  cjk: number;
  /** 英文 / 数字单词数 */
  words: number;
  /** 预计阅读分钟数 */
  minutes: number;
}

/** 中日文字符（不含标点） */
const CJK_CHAR_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g;
/** 中文标点（、。〈〉《》「」…）与全角符号 */
const CJK_PUNCT_RE = /[\u3000-\u303f\uff01-\uff60]/g;
/** 英文 / 数字单词 */
const WORD_RE = /[A-Za-z0-9][A-Za-z0-9'’._-]*/g;

/** 从渲染后的 HTML 里取纯文本 */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|h[1-6]|li|tr|blockquote|pre|figure)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * 阅读速度：中文约 400 字/分钟，英文约 200 词/分钟。
 * 技术文章会慢一些，但这里只是给个量级参考。
 */
const CJK_PER_MIN = 400;
const WORDS_PER_MIN = 200;

export function textStats(html: string, source: string): TextStats {
  const text = htmlToText(html);
  const cjk =
    (text.match(CJK_CHAR_RE)?.length ?? 0) + (text.match(CJK_PUNCT_RE)?.length ?? 0);
  const words = text.match(WORD_RE)?.length ?? 0;
  const chars = text.replace(/\s/g, "").length;

  const minutes = Math.max(1, Math.round(cjk / CJK_PER_MIN + words / WORDS_PER_MIN));

  return {
    lines: source ? source.split("\n").length : 0,
    source: source.length,
    chars,
    cjk,
    words,
    minutes,
  };
}
