/**
 * 给自定义 CSS 的每条声明补上 `!important`。
 *
 * ## 为什么必须这么做
 *
 * 自定义 CSS 是样式栈的**最后一层**，但它只能靠「顺序」赢，而 CSS 里
 * **优先级压过顺序**。基础层 / 主题层用了更具体的选择器，例如：
 *
 *   #nice pre.custom      (1 id + 1 class + 1 元素)  ← 代码块底色、内边距、圆角
 *   #nice code:not(.hljs) (1 id + 1 class + 1 元素)  ← 行内代码配色
 *   #nice pre.custom code.hljs                       ← 代码字号
 *
 * 用户写的 `#nice pre` / `#nice p code` 只有 (1 id + 0 class + …)，排在后面也赢不了。
 * 表现就是「我明明写了，怎么没生效」—— 静默失效，最难查。
 *
 * 应用自身各层**不使用任何 `!important`**（可 grep 验证），所以给自定义层统一补上
 * `!important` 就能保证它稳定压过下面所有层。这正是「自定义 = 最后兜底层」应有的语义。
 *
 * 用户自己写的 `!important` 原样保留，不重复添加。
 */
export function forceImportant(css: string): string {
  if (!css) return "";

  let out = "";
  let buf = "";
  let depth = 0;
  let quote: string | null = null;
  let inComment = false;

  /** 把缓冲里的「一条声明」处理掉 */
  const flush = () => {
    const t = buf.trim();
    // ⚠️ `content` 必须排除：juice 的 inlinePseudoElements 会把
    //    `content: "引用链接"` 变成一个真实文本节点，如果值里带了
    //    `!important`，公众号里就会显示成「引用链接 !important」。
    //    它也不需要靠 !important 取胜 —— 基础层没有任何 !important，
    //    同优先级下自定义层排在后面就能赢。
    const prop = t.split(":")[0]?.trim().toLowerCase();
    if (!t || !t.includes(":") || prop === "content" || /!\s*important\s*$/i.test(t)) {
      out += buf;
    } else {
      out += buf.replace(/\s*$/, "") + " !important";
    }
    buf = "";
  };

  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    const next = css[i + 1];

    if (inComment) {
      out += c;
      if (c === "*" && next === "/") {
        out += next;
        i += 1;
        inComment = false;
      }
      continue;
    }
    if (quote) {
      buf += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === "/" && next === "*") {
      inComment = true;
      out += c;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      buf += c;
      continue;
    }
    // 选择器部分（还没进花括号）直接透传，只处理花括号内的声明
    if (c === "{") {
      depth += 1;
      out += buf + "{";
      buf = "";
      continue;
    }
    if (c === "}") {
      flush();
      depth -= 1;
      out += "}";
      continue;
    }
    if (c === ";" && depth > 0) {
      flush();
      out += ";";
      continue;
    }
    buf += c;
  }
  flush();
  return out;
}
