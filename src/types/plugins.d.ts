declare module "markdown-it-imsize";
declare module "markdown-it-implicit-figures";
declare module "markdown-it-table-of-contents";
declare module "markdown-it-ruby";
declare module "markdown-it-sub";
declare module "markdown-it-sup";
declare module "markdown-it-mark";
declare module "markdown-it-task-lists";
declare module "markdown-it-footnote";
declare module "markdown-it-deflist";

interface Window {
  MathJax?: {
    typesetPromise?: (els?: HTMLElement[]) => Promise<void>;
    typesetClear?: (els?: HTMLElement[]) => void;
    startup?: { promise?: Promise<void>; typeset?: boolean; document?: unknown };
    tex?: unknown;
    svg?: unknown;
    options?: unknown;
    [key: string]: unknown;
  };
  /** 引导脚本从 `#d=…` 摘下来、待编辑器读取的分享内容 */
  __NICE_SHARE__?: string;
}
