import juice from "juice";

/**
 * 这一步是整个项目的核心。
 *
 * 微信 / 知乎 / 掘金的编辑器都会**丢掉 `<style>` 标签和 class 选择器**，只认元素上的
 * 内联 `style`。所以「排版」必须做两件事：
 *   1. 把主题 CSS 通过 juice 内联到每个元素上（inlineContent + inlinePseudoElements）；
 *   2. 把 MathJax 渲染出来的 `<mjx-container>` 换成目标平台认得的标签（微信保留内联
 *      SVG，知乎换成 `<img data-eeimg>`，掘金换成 equation 图片链接）。
 */

export type CopyTarget = "wechat" | "zhihu" | "juejin" | "csdn";

export interface InlineOptions {
  inlinePseudoElements?: boolean;
  preserveImportant?: boolean;
}

/** 用 juice 把 CSS 内联进 HTML */
export function inlineCss(html: string, css: string, options: InlineOptions = {}): string {
  return juice.inlineContent(html, css, {
    inlinePseudoElements: options.inlinePseudoElements ?? true,
    preserveImportant: options.preserveImportant ?? true,
  });
}

/* ------------------------------------------------------------------ *
 * 数学公式的平台适配
 * ------------------------------------------------------------------ */
function adaptMath(root: HTMLElement, target: CopyTarget): void {
  const wrappers = Array.from(root.querySelectorAll<HTMLElement>(".nice-math"));

  for (const wrapper of wrappers) {
    const latex = wrapper.getAttribute("data-formula") ?? "";
    const display = wrapper.classList.contains("nice-math-block");
    const mjx = wrapper.querySelector("mjx-container");

    if (target === "wechat" || target === "csdn") {
      // 微信只认内联 SVG：把 svg 提出来，宽高写进 style，去掉 MathJax 私有属性
      const section = document.createElement("section");
      section.setAttribute("data-formula", latex);
      section.style.display = display ? "block" : "inline-block";
      if (display) {
        section.style.textAlign = "center";
        section.style.margin = "14px 0";
        section.style.overflowX = "auto";
      } else {
        section.style.verticalAlign = "middle";
      }
      const svg = mjx?.querySelector("svg");
      if (svg) {
        const width = svg.getAttribute("width");
        const height = svg.getAttribute("height");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.removeAttribute("focusable");
        svg.removeAttribute("role");
        svg.removeAttribute("style");
        svg.setAttribute(
          "style",
          [
            width ? `width:${width}` : "",
            height ? `height:${height}` : "",
            "max-width:100%",
            display ? "" : "vertical-align:middle",
          ]
            .filter(Boolean)
            .join(";"),
        );
        section.appendChild(svg);
      } else if (mjx) {
        section.innerHTML = mjx.innerHTML;
      } else {
        section.textContent = display ? `$$${latex}$$` : `$${latex}$`;
      }
      wrapper.replaceWith(section);
    } else if (target === "zhihu") {
      // 知乎支持 LaTeX 公式图片占位：img[data-eeimg]
      const img = document.createElement("img");
      img.className = "Formula-image";
      img.setAttribute("data-eeimg", "true");
      img.setAttribute("src", "");
      img.setAttribute("alt", display && !latex.includes("\\tag") ? `${latex}\\\\` : latex);
      wrapper.replaceWith(img);
    } else if (target === "juejin") {
      const src = `https://juejin.im/equation?tex=${encodeURIComponent(latex)}`;
      const img = document.createElement("img");
      img.className = "equation";
      img.setAttribute("src", src);
      img.setAttribute("alt", "");
      if (display) {
        const figure = document.createElement("figure");
        figure.appendChild(img);
        wrapper.replaceWith(figure);
      } else {
        img.setAttribute("style", "display:inline;");
        const span = document.createElement("span");
        span.appendChild(img);
        wrapper.replaceWith(span);
      }
    }
  }

  // 兜底：没被包进 .nice-math 的 mjx-container 也要转掉，别把未知标签丢给微信
  if (target === "wechat" || target === "csdn") {
    root.querySelectorAll("mjx-container").forEach((mjx) => {
      const section = document.createElement("section");
      section.innerHTML = mjx.innerHTML;
      mjx.replaceWith(section);
    });
  }

  // MathJax 的无障碍副本 / 预览节点在微信里是噪音
  root.querySelectorAll("mjx-assistive-mml, .MathJax_Preview, .MathJax_Error").forEach((n) => n.remove());
}

/* ------------------------------------------------------------------ *
 * 掘金代码块的换行问题（-webkit-box → block，<br> → \n<span/>）
 * ------------------------------------------------------------------ */
function fixJuejinCode(root: HTMLElement): void {
  root.querySelectorAll("pre.custom").forEach((pre) => {
    pre.innerHTML = pre.innerHTML
      .replace(/display:\s*-webkit-box;?/g, "display:block;")
      .replace(/<br\s*\/?>/g, "\n<span></span>")
      .replace(/&nbsp;/g, " ");
  });
}

/* ------------------------------------------------------------------ *
 * 主入口
 * ------------------------------------------------------------------ */

/**
 * 从**实时预览 DOM** 里生成可粘贴的富文本 HTML。
 *
 * @param niceEl 预览里那个 `<section id="nice">`（带 class 的干净 DOM，不含内联样式）
 * @param css    预览用的完整样式栈
 * @param target 目标平台
 */
export function buildRichHtml(niceEl: HTMLElement, css: string, target: CopyTarget): string {
  const clone = niceEl.cloneNode(true) as HTMLElement;
  clone.removeAttribute("style");
  // 每个顶层元素打上 mdnice 同款标记，方便在微信编辑器里识别来源
  Array.from(clone.children).forEach((child) => child.setAttribute("data-tool", "编辑器"));

  const raw = clone.outerHTML;
  const inlined = inlineCss(raw, css, { inlinePseudoElements: true, preserveImportant: true });

  const doc = new DOMParser().parseFromString(`<body>${inlined}</body>`, "text/html");
  const root = doc.getElementById("nice") ?? doc.body.firstElementChild ?? doc.body;
  if (!(root instanceof HTMLElement)) return inlined;

  adaptMath(root, target);
  if (target === "juejin") fixJuejinCode(root);

  return root.outerHTML;
}

/** 富文本里的纯文本版本（粘贴到不支持 HTML 的地方时用） */
export function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, "");
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.innerText || div.textContent || "").trim();
}

/* ------------------------------------------------------------------ *
 * 剪贴板
 * ------------------------------------------------------------------ */

/**
 * 复制富文本。优先用异步 Clipboard API 写 text/html；
 * 失败（Safari 旧版 / 非安全上下文）则回退到 execCommand 的经典写法。
 */
export async function copyRichText(html: string, plainText?: string): Promise<boolean> {
  const text = plainText ?? htmlToPlainText(html);

  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
  } catch {
    /* 落到 execCommand 分支 */
  }

  return legacyCopy(html, text);
}

function legacyCopy(html: string, text: string): boolean {
  let input = document.getElementById("nice-copy-input") as HTMLInputElement | null;
  if (!input) {
    input = document.createElement("input");
    input.id = "nice-copy-input";
    input.style.position = "absolute";
    input.style.left = "-9999px";
    input.style.top = "0";
    input.setAttribute("aria-hidden", "true");
    document.body.appendChild(input);
  }
  input.value = "NOTHING";
  input.setSelectionRange(0, 1);
  input.focus();

  const handler = (e: ClipboardEvent) => {
    e.preventDefault();
    e.clipboardData?.setData("text/html", html);
    e.clipboardData?.setData("text/plain", text);
    document.removeEventListener("copy", handler);
  };
  document.addEventListener("copy", handler);
  try {
    const ok = document.execCommand("copy");
    document.removeEventListener("copy", handler);
    return ok;
  } catch {
    document.removeEventListener("copy", handler);
    return false;
  }
}
