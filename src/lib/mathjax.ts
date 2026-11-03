/**
 * MathJax 加载与排版。
 *
 * 用 MathJax 的 SVG 输出（tex-svg-nofont 预构建包，放在 public/mathjax/）：
 * 微信会剥掉 <style> 与 class 选择器，但**保留内联 SVG**，所以公式必须以 SVG 形式
 * 存在于 HTML 里，而不是靠 KaTeX 的字体 + CSS。
 */

const SCRIPT_ID = "nice-mathjax-script";
const SCRIPT_SRC = "/mathjax/tex-svg-nofont.js";

let loading: Promise<boolean> | null = null;

export function loadMathJax(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.MathJax?.typesetPromise) return Promise.resolve(true);
  if (loading) return loading;

  loading = new Promise<boolean>((resolve) => {
    window.MathJax = {
      tex: {
        inlineMath: [["$", "$"]],
        displayMath: [["$$", "$$"]],
        tags: "ams",
        processEscapes: true,
      },
      svg: { fontCache: "none" },
      startup: { typeset: false },
      options: {
        skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        // 关掉无障碍副本与语义增强：否则 MathJax 会去加载 4.5MB 的 sre
        // （speech-worker + 语音 mathmaps），对排版场景毫无用处。
        // 注意 menuOptions.settings 必须一起关 —— ui/menu 组件会在启动时把
        // enableEnrichment 强行改回 true（它读的是自己的 settings.enrich）。
        enableAssistiveMml: false,
        enableEnrichment: false,
        enableMenu: false,
        menuOptions: {
          settings: {
            enrich: false,
            speech: false,
            braille: false,
            assistiveMml: false,
            explorer: false,
            inTabOrder: false,
            collapsible: false,
          },
        },
      },
      sre: { speech: "none" },
    };

    const done = (n = 0) => {
      if (window.MathJax?.typesetPromise) return resolve(true);
      if (n > 150) return resolve(false);
      setTimeout(() => done(n + 1), 100);
    };

    if (document.getElementById(SCRIPT_ID)) {
      done();
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => done();
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return loading;
}

/** 对指定容器排版。失败不抛错，编辑器不应该因为公式挂了就白屏。 */
export async function typesetMath(el: HTMLElement | null): Promise<void> {
  if (!el) return;
  const ok = await loadMathJax();
  if (!ok) return;
  const MJ = window.MathJax;
  try {
    MJ?.typesetClear?.([el]);
    await MJ?.typesetPromise?.([el]);
  } catch {
    /* 公式语法错误时 MathJax 自己会渲染成红色错误文本，这里吞掉异常 */
  }
}

/** 预览里是否已经出现过公式（用于决定要不要加载 MathJax） */
export function hasMath(markdown: string): boolean {
  return /\$[^$\n]+\$|\$\$[\s\S]+?\$\$/.test(markdown);
}
