import MarkdownItCtor, {
  type MarkdownIt,
  type RendererRule,
  type StateBlock,
  type StateCore,
  type StateInline,
  type Token,
} from "markdown-it";
import hljs from "highlight.js";
import markdownItFootnote from "markdown-it-footnote";
import markdownItDeflist from "markdown-it-deflist";
import markdownItImplicitFigures from "markdown-it-implicit-figures";
import markdownItToc from "markdown-it-table-of-contents";
import markdownItRuby from "markdown-it-ruby";
import markdownItSub from "markdown-it-sub";
import markdownItSup from "markdown-it-sup";
import markdownItMark from "markdown-it-mark";
import markdownItTaskLists from "markdown-it-task-lists";

/* ------------------------------------------------------------------ *
 * 一、结构类插件（决定 HTML 骨架，主题靠这些 class 做样式）
 * ------------------------------------------------------------------ */

/** 标题包上 prefix / content / suffix 三层 span，主题可加前缀后缀装饰 */
function headingSpan(md: MarkdownIt) {
  md.core.ruler.push("heading_span", (state: StateCore) => {
    for (let i = 0; i < state.tokens.length - 1; i++) {
      if (state.tokens[i].type !== "heading_open" || state.tokens[i + 1].type !== "inline") continue;
      const inline = state.tokens[i + 1];
      if (!inline.content || !inline.children) continue;
      const pre = new state.Token("html_inline", "", 0);
      pre.content = '<span class="prefix"></span><span class="content">';
      inline.children.unshift(pre);
      const post = new state.Token("html_inline", "", 0);
      post.content = '</span><span class="suffix"></span>';
      inline.children.push(post);
      i += 2;
    }
  });
}

/** 表格外套 section.table-container，方便横向滚动 / 加圆角边框 */
function tableContainer(md: MarkdownIt) {
  md.core.ruler.push("table_container", (state: StateCore) => {
    const out: Token[] = [];
    for (const token of state.tokens) {
      if (token.type === "table_open") {
        const open = new state.Token("html_inline", "", 0);
        open.content = '<section class="table-container">';
        out.push(open, token);
      } else if (token.type === "table_close") {
        const close = new state.Token("html_inline", "", 0);
        close.content = "</section>";
        out.push(token, close);
      } else {
        out.push(token);
      }
    }
    state.tokens = out;
  });
}

/** li 内再包一层 section，微信里行高、间距才可控（保留 li 自身的属性，如 task-list 的 class） */
function liSection(md: MarkdownIt) {
  md.renderer.rules.list_item_open = (tokens, idx, options, _env, self) =>
    `<li${self.renderAttrs(tokens[idx])}><section>`;
  md.renderer.rules.list_item_close = () => "</section></li>";
}

/** 多级引用加 class：nice-multiquote-1 / -2 / -3 */
function multiquote(md: MarkdownIt) {
  const walk = (tokens: Token[]) => {
    let level = 0;
    for (const token of tokens) {
      if (token.type === "blockquote_open") {
        level += 1;
        token.attrJoin("class", `nice-multiquote nice-multiquote-${Math.min(level, 3)}`);
      }
      if (token.type === "blockquote_close") level -= 1;
      if (token.children) walk(token.children);
    }
  };
  md.core.ruler.push("multiquote", (state: StateCore) => walk(state.tokens));
}

/** 横屏滑动幻灯片：<![img1,img2,img3> */
function imageFlow(md: MarkdownIt) {
  const re = /^<!(.*?)>$/;
  md.inline.ruler.before("text", "imageflow", (state: StateInline, silent: boolean) => {
    if (state.src[state.pos] !== "<" || state.src[state.pos + 1] !== "!") return false;
    const lineEnd = state.src.indexOf("\n", state.pos);
    const rest = state.src.slice(state.pos, lineEnd === -1 ? undefined : lineEnd);
    const m = re.exec(rest.trim());
    if (!m) return false;
    if (!silent) {
      const token = state.push("imageflow", "", 0);
      token.content = m[1];
    }
    state.pos += rest.length;
    return true;
  });
  md.renderer.rules.imageflow = (tokens, idx) => {
    const items = tokens[idx].content
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const m = /^!\[(.*?)\]\((.*?)\)$/.exec(s);
        if (!m) return "";
        return `<section class="nice-imageflow-item"><img src="${m[2]}" alt="${m[1]}"></section>`;
      })
      .join("");
    return `<section class="nice-imageflow"><section class="nice-imageflow-inner">${items}</section></section>`;
  };
}

/* ------------------------------------------------------------------ *
 * 二、图片尺寸：![图](url =200x) / =40%x / =x200
 *     自己实现而不用 markdown-it-imsize —— 后者会拖进 image-size，
 *     里面有 `require("fs")`，在浏览器端会直接构建失败。
 * ------------------------------------------------------------------ */
function parseImageSize(spec: string): { width?: string; height?: string } | null {
  if (!spec.startsWith("=")) return null;
  const body = spec.slice(1).replace(/x$/i, "");
  if (!body) return null;
  const [rawW, rawH] = body.split("x");
  const width = rawW && /^\d+(\.\d+)?%?$/.test(rawW) ? rawW : undefined;
  const height = rawH && /^\d+(\.\d+)?%?$/.test(rawH) ? rawH : undefined;
  if (!width && !height) return null;
  return { width, height };
}

function imageSize(md: MarkdownIt) {
  const fallback: RendererRule = (tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options);
  const base = md.renderer.rules.image ?? fallback;

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const title = token.attrGet("title");
    let src = token.attrGet("src");
    let spec: string | null = null;

    if (typeof title === "string" && title.startsWith("=")) {
      spec = title;
      token.attrSet("title", "");
    } else if (typeof src === "string") {
      // 也允许把尺寸直接写在地址后面：url =200x
      const m = /^(.*?)\s+(=\S+)$/.exec(src);
      if (m && parseImageSize(m[2])) {
        spec = m[2];
        src = m[1];
        token.attrSet("src", src);
      }
    }

    const size = spec ? parseImageSize(spec) : null;
    if (size) {
      const style: string[] = [];
      if (size.width) {
        if (size.width.endsWith("%")) style.push(`width:${size.width}`);
        else token.attrSet("width", size.width);
      }
      if (size.height) {
        if (size.height.endsWith("%")) style.push(`height:${size.height}`);
        else token.attrSet("height", size.height);
      }
      if (style.length) {
        const prev = token.attrGet("style");
        token.attrSet("style", `${typeof prev === "string" ? prev + ";" : ""}${style.join(";")}`);
      }
    }

    return base(tokens, idx, options, env, self);
  };
}

/* ------------------------------------------------------------------ *
 * 三、微信外链转脚注（可选开启）
 *     [文字](url) → 文字[1]，正文末尾自动生成「参考资料」列表
 * ------------------------------------------------------------------ */
function linkFoot(md: MarkdownIt) {
  md.core.ruler.push("link_foot_collect", (state: StateCore) => {
    const env = state.env as { __footLinks?: string[] };
    env.__footLinks = [];
    const walk = (tokens: Token[]) => {
      for (const token of tokens) {
        if (token.type === "link_open") {
          const href = token.attrGet("href");
          const url = typeof href === "string" ? href : null;
          if (url && /^https?:\/\//i.test(url)) {
            token.meta = { ...(token.meta ?? {}), foot: url };
          }
        }
        if (token.children) walk(token.children);
      }
    };
    walk(state.tokens);
  });

  const renderLinkOpen: RendererRule = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const foot = token.meta?.foot as string | undefined;
    if (foot) {
      const bag = env as { __footLinks?: string[] } | undefined;
      const list = (bag ?? {}).__footLinks ?? [];
      if (bag) bag.__footLinks = list;
      let n = list.indexOf(foot);
      if (n === -1) {
        list.push(foot);
        n = list.length - 1;
      }
      token.attrSet("data-foot", String(n + 1));
      token.attrJoin("class", "nice-foot-link");
      return `<span class="footnote-word">${self.renderToken(tokens, idx, options)}`;
    }
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_open = renderLinkOpen;
  md.renderer.rules.link_close = (tokens, idx, options, _env, self) => {
    let open = idx - 1;
    while (open >= 0 && tokens[open].type !== "link_open") open -= 1;
    const paired = tokens[open];
    if (paired?.meta?.foot) {
      return `${self.renderToken(tokens, idx, options)}</span><sup class="footnote-ref">[${paired.attrGet("data-foot")}]</sup>`;
    }
    return self.renderToken(tokens, idx, options);
  };

  /** 在正文末尾追加「参考资料」区块 */
  const originalRender = md.renderer.render.bind(md.renderer);
  md.renderer.render = (tokens, options, env) => {
    const html = originalRender(tokens, options, env);
    const list = (env as { __footLinks?: string[] } | undefined)?.__footLinks ?? [];
    if (!list.length) return html;
    const items = list
      .map(
        (url, i) =>
          `<li class="nice-footnote-item"><span class="footnote-num">[${i + 1}] </span><span class="footnote-content">${url}</span></li>`,
      )
      .join("");
    return `${html}<h3 class="footnotes-sep"></h3><section class="footnotes"><h4 class="footnotes-title">参考资料</h4><ol class="footnotes-list">${items}</ol></section>`;
  };
}

/* ------------------------------------------------------------------ *
 * 三、代码块高亮：微信必须用 <br/> + &nbsp; 保住空白
 * ------------------------------------------------------------------ */
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * 只对文本节点做空白替换，避免把标签内的空格也换掉（那会直接破坏 HTML）。
 */
export function toWeChatCode(html: string): string {
  return html
    .split(/(<span[^>]*>|<\/span>)/)
    .map((part) =>
      part.startsWith("<")
        ? part
        : part
            .replace(/ {2}/g, "&nbsp;&nbsp;")
            .replace(/ /g, "&nbsp;")
            .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
            .replace(/\n/g, "<br/>"),
    )
    .join("");
}

export function highlightCode(code: string, lang: string): string {
  const language = lang && hljs.getLanguage(lang) ? lang : "";
  if (!language) return toWeChatCode(escapeHtml(code));
  try {
    return toWeChatCode(hljs.highlight(code, { language, ignoreIllegals: true }).value);
  } catch {
    return toWeChatCode(escapeHtml(code));
  }
}

/* ------------------------------------------------------------------ *
 * 四、数学公式：只标记，交给 MathJax 排版成 SVG（微信能保留）
 * ------------------------------------------------------------------ */
function math(md: MarkdownIt) {
  function isValidDelim(state: StateInline, pos: number) {
    let canOpen = true;
    let canClose = true;
    const prev = pos > 0 ? state.src.charCodeAt(pos - 1) : -1;
    const next = pos + 1 <= state.posMax ? state.src.charCodeAt(pos + 1) : -1;
    if (prev === 0x20 || prev === 0x09 || (next >= 0x30 && next <= 0x39)) canClose = false;
    if (next === 0x20 || next === 0x09) canOpen = false;
    return { canOpen, canClose };
  }

  md.inline.ruler.after("escape", "math_inline", (state: StateInline, silent: boolean) => {
    if (state.src[state.pos] !== "$") return false;
    if (!isValidDelim(state, state.pos).canOpen) {
      if (!silent) state.pending += "$";
      state.pos += 1;
      return true;
    }
    const start = state.pos + 1;
    let match = start;
    while ((match = state.src.indexOf("$", match)) !== -1) {
      let p = match - 1;
      while (state.src[p] === "\\") p -= 1;
      if ((match - p) % 2 === 1) break;
      match += 1;
    }
    if (match === -1) {
      if (!silent) state.pending += "$";
      state.pos = start;
      return true;
    }
    if (match - start === 0) {
      if (!silent) state.pending += "$$";
      state.pos = start + 1;
      return true;
    }
    if (!isValidDelim(state, match).canClose) {
      if (!silent) state.pending += "$";
      state.pos = start;
      return true;
    }
    if (!silent) {
      const token = state.push("math_inline", "math", 0);
      token.markup = "$";
      token.content = state.src.slice(start, match);
    }
    state.pos = match + 1;
    return true;
  });

  md.block.ruler.after(
    "blockquote",
    "math_block",
    (state: StateBlock, start: number, end: number, silent: boolean) => {
      let pos = state.bMarks[start] + state.tShift[start];
      const max = state.eMarks[start];
      if (pos + 2 > max) return false;
      if (state.src.slice(pos, pos + 2) !== "$$") return false;
      pos += 2;
      let firstLine = state.src.slice(pos, max);
      if (silent) return true;
      let found = false;
      if (firstLine.trim().slice(-2) === "$$") {
        firstLine = firstLine.trim().slice(0, -2);
        found = true;
      }
      let next = start;
      let lastLine = "";
      for (; !found; ) {
        next += 1;
        if (next >= end) break;
        const p = state.bMarks[next] + state.tShift[next];
        const m = state.eMarks[next];
        if (p < m && state.tShift[next] < state.blkIndent) break;
        if (state.src.slice(p, m).trim().slice(-2) === "$$") {
          lastLine = state.src.slice(p, state.src.slice(0, m).lastIndexOf("$$"));
          found = true;
        }
      }
      state.line = next + 1;
      const token = state.push("math_block", "math", 0);
      token.block = true;
      token.content =
        (firstLine && firstLine.trim() ? firstLine + "\n" : "") +
        state.getLines(start + 1, next, state.tShift[start], true) +
        (lastLine && lastLine.trim() ? lastLine : "");
      token.map = [start, state.line];
      token.markup = "$$";
      return true;
    },
    { alt: ["paragraph", "reference", "blockquote", "list"] },
  );

  // 包一层带 data-formula 的容器：复制到知乎/掘金时需要拿回原始 LaTeX
  md.renderer.rules.math_inline = (tokens, idx) => {
    const latex = tokens[idx].content;
    return `<span class="nice-math nice-math-inline" data-formula="${escapeAttr(latex)}">$${latex}$</span>`;
  };
  md.renderer.rules.math_block = (tokens, idx) => {
    const latex = tokens[idx].content;
    return `<section class="nice-math nice-math-block" data-formula="${escapeAttr(latex)}">$$${latex}$$</section>\n`;
  };
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ------------------------------------------------------------------ *
 * 五、脚注渲染成微信能显示的扁平结构
 * ------------------------------------------------------------------ */
function footnote(md: MarkdownIt) {
  md.use(markdownItFootnote);
  md.renderer.rules.footnote_ref = (tokens, idx, options, env, self) =>
    `<sup class="footnote-ref">${self.rules.footnote_caption(tokens, idx, options, env, self)}</sup>`;
  md.renderer.rules.footnote_block_open = () =>
    '<h3 class="footnotes-sep"></h3>\n<section class="footnotes">\n<h4 class="footnotes-title">脚注</h4>\n<ol class="footnotes-list">\n';
  md.renderer.rules.footnote_block_close = () => "</ol>\n</section>\n";
  md.renderer.rules.footnote_open = (tokens, idx, options, env, self) => {
    const id = self.rules.footnote_anchor_name(tokens, idx, options, env, self);
    return `<li id="fn${id}" class="footnote-item"><span class="footnote-num">[${id}] </span>`;
  };
  md.renderer.rules.footnote_close = () => "</li>\n";
  md.renderer.rules.footnote_anchor = () => "";
}

/* ------------------------------------------------------------------ *
 * 导出：按选项创建 parser
 *   linkToFoot —— 微信外链转脚注（默认关闭）
 * ------------------------------------------------------------------ */
export interface ParserOptions {
  linkToFoot?: boolean;
}

const cache = new Map<string, MarkdownIt>();

export function createParser(options: ParserOptions = {}): MarkdownIt {
  const key = JSON.stringify(options);
  const cached = cache.get(key);
  if (cached) return cached;

  const md = new MarkdownItCtor({
    html: true,
    linkify: false,
    breaks: false,
    highlight: (str, lang) =>
      `<pre class="custom"><code class="hljs">${highlightCode(str, lang)}</code></pre>`,
  });

  md.use(headingSpan)
    .use(tableContainer)
    .use(math)
    .use(markdownItToc, {
      includeLevel: [2, 3],
      markerPattern: /^\[toc\]/im,
      transformLink: () => "",
      listType: "ul",
    })
    .use(markdownItRuby)
    .use(imageSize)
    .use(markdownItImplicitFigures, { figcaption: true })
    .use(markdownItDeflist)
    .use(liSection)
    .use(imageFlow)
    .use(multiquote)
    .use(footnote)
    .use(markdownItSub)
    .use(markdownItSup)
    .use(markdownItMark)
    .use(markdownItTaskLists, { enabled: true, label: true });

  if (options.linkToFoot) md.use(linkFoot);

  cache.set(key, md);
  return md;
}

export const parser = createParser();
export default parser;
