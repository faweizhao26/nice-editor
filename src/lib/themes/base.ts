/**
 * 结构基线：所有主题共用。
 * 只做「骨架归一化」——把 markdown 生成的 HTML 结构（table-container / li>section /
 * pre.custom / footnotes / imageflow 等）整理成微信能正确渲染的形态，不涉及配色。
 * 主题 CSS 会在它之后加载，因此同名属性会被主题覆盖。
 */
export const BASE_CSS = `
/* ---------- 全局 ---------- */
#nice {
  word-break: break-word;
  word-wrap: break-word;
  text-align: left;
  font-family: -apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
#nice section {
  display: block;
}
#nice p {
  margin: 0;
}
#nice .prefix,
#nice .suffix {
  display: none;
}

/* ---------- 图片 ---------- */
#nice img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
  border-radius: 4px;
}
#nice figure {
  margin: 0;
}
#nice figcaption {
  text-align: center;
  font-size: 13px;
  color: #9a9a9a;
  margin-top: 6px;
  line-height: 1.5;
}

/* ---------- 表格 ---------- */
#nice .table-container {
  display: block;
  width: 100%;
  overflow-x: auto;
  margin: 12px 0;
}
#nice table {
  border-collapse: collapse;
  width: 100%;
  font-size: 14px;
  line-height: 1.6;
}
#nice table th,
#nice table td {
  border: 1px solid #e6e6e6;
  padding: 7px 10px;
  text-align: left;
  vertical-align: top;
}
#nice table thead th {
  font-weight: 600;
}

/* ---------- 代码块 ---------- */
#nice pre.custom {
  display: block;
  overflow-x: auto;
  margin: 12px 0;
  padding: 14px 16px;
  border-radius: 6px;
  -webkit-overflow-scrolling: touch;
}
#nice pre.custom code.hljs {
  display: block;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.7;
  white-space: normal;
  /* 代码内容里的缩进/对齐已经转成 &nbsp;，词间是普通空格。
     这里用 normal 让长行在空格处正常折行；只有单个超长 token（URL 之类）
     才用 overflow-wrap 强制断开。用 break-all 会把正常代码拦腰截断。 */
  word-break: normal;
  overflow-wrap: break-word;
  background: none;
  padding: 0;
  border: none;
}

/* ---------- 行内代码 ---------- */
#nice code:not(.hljs) {
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 0.9em;
  padding: 2px 5px;
  margin: 0 2px;
  border-radius: 4px;
}

/* ---------- 列表 ---------- */
#nice ul,
#nice ol {
  margin: 10px 0;
  padding-left: 26px;
}
#nice li {
  margin: 4px 0;
  line-height: 1.75;
}
#nice li > section {
  display: block;
}
#nice li > section > p {
  margin: 0;
}
#nice ul.task-list,
#nice ul.contains-task-list {
  list-style: none;
  padding-left: 6px;
}
#nice li.task-list-item,
#nice ul.contains-task-list > li {
  list-style: none;
}
#nice li.task-list-item input,
#nice ul.contains-task-list input[type="checkbox"] {
  margin-right: 6px;
  vertical-align: middle;
}

/* ---------- 引用 ---------- */
#nice blockquote {
  margin: 12px 0;
}
#nice blockquote p {
  margin: 0;
}
#nice .nice-multiquote-2 {
  margin: 8px 0;
}
#nice .nice-multiquote-3 {
  margin: 6px 0;
}

/* ---------- 分隔线 ---------- */
#nice hr {
  border: none;
  height: 1px;
  margin: 22px 0;
}

/* ---------- 脚注 / 参考资料 ---------- */
/* 标题文字由 ::before 提供（mdnice 的做法），这样用户的自定义 CSS 里
   #nice .footnotes-sep::before { content: "…" } 能直接换掉文案。
   原来是 display:none + 单独一个 .footnotes-title 元素，用户想改文案
   只能去猜 .footnotes-title，且 ::before 永远不显示。
   ⚠️ 本文件是反引号模板字符串，注释里不要出现反引号。 */
#nice .footnotes-sep {
  display: block;
  margin: 24px 0 8px;
  padding: 0;
  border: none;
}
#nice .footnotes-sep::before {
  content: "参考资料";
  display: inline-block;
  padding-left: 8px;
  border-left: 4px solid currentColor;
  font-size: 15px;
  font-weight: 700;
}
#nice .footnotes {
  display: block;
  font-size: 13px;
  line-height: 1.7;
  margin-top: 8px;
}
/* 保留 .footnotes-title 的规则，兼容仍引用它的主题；元素本身已不再输出 */
#nice .footnotes-title {
  display: none;
}
#nice .footnotes-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}
/* ⚠️ 类名必须是 .footnote-item：渲染出的是 <li class="footnote-item">，
   写成 .nice-footnote-item 永远匹配不到（以前就是，规则是死的）。 */
#nice .footnote-item {
  /* 编号和正文同一行。
     正文被 markdown-it-footnote 包成 <p>（块级元素），不设 flex 的话
     <p> 必然另起一行，编号就孤零零占一行 —— 而 mdnice 也是同样的
     HTML 结构（<span class="footnote-num">[1] </span><p>…</p>），
     它靠的就是这里的 flex + 下面的 display:inline。
     flex-wrap 是为了多段脚注：第二段起会另起一行占满整行。 */
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  list-style: none;
  margin: 4px 0;
  word-break: break-all;
}
#nice .footnote-num {
  /* 只有 flex 子项才认 width —— 用户 CSS 里的 width: 7% 靠这条生效 */
  flex: 0 0 auto;
  font-weight: 600;
}
#nice .footnote-item p {
  display: inline;
  /* ⚠️ 基准必须是 0，不能是 auto。
     flex-wrap 的换行判定用的是「假设主尺寸」（= flex-basis），
     写 auto 时它就是内容宽度 —— 正文一长，编号+正文放不下就整段
     掉到下一行，编号又孤零零占一行。写 0 则恒定先放同一行再撑满。 */
  flex: 1 1 0;
  /* flex 子项默认 min-width:auto，长 URL 会把容器撑破 */
  min-width: 0;
  margin: 0;
}
#nice .footnote-item p + p {
  flex-basis: 100%;
}
#nice .footnote-ref {
  font-size: 0.75em;
  vertical-align: super;
  line-height: 0;
}

/* ---------- 横屏滑动幻灯片 ---------- */
#nice .nice-imageflow {
  display: block;
  overflow-x: auto;
  margin: 14px 0;
}
#nice .nice-imageflow-inner {
  display: flex;
  gap: 8px;
  width: max-content;
}
#nice .nice-imageflow-item {
  flex: 0 0 auto;
  width: 68vw;
  max-width: 320px;
}
#nice .nice-imageflow-item img {
  width: 100%;
  height: auto;
}

/* ---------- 注音 ---------- */
#nice ruby rt {
  font-size: 0.6em;
  color: #9a9a9a;
}

/* ---------- 高亮 ==文字== ---------- */
#nice mark {
  padding: 0 2px;
  border-radius: 2px;
}

/* ---------- 数学公式 ---------- */
#nice mjx-container {
  display: inline-block;
  max-width: 100%;
  overflow-x: auto;
  vertical-align: middle;
}
#nice mjx-container[display="true"] {
  display: block;
  text-align: center;
  margin: 14px 0;
  overflow-x: auto;
}
#nice mjx-container svg {
  max-width: 100%;
}

/* ---------- TOC ---------- */
#nice .table-of-contents {
  display: block;
  margin: 14px 0;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
}
#nice .table-of-contents ul {
  margin: 0;
  padding-left: 18px;
  list-style: none;
}
#nice .table-of-contents li {
  margin: 5px 0;
  line-height: 1.6;
}
#nice .table-of-contents a {
  text-decoration: none;
  border: none;
}

/* ---------- 定义列表 ---------- */
#nice dl {
  margin: 12px 0;
}
#nice dt {
  font-weight: 600;
  margin-top: 8px;
}
#nice dd {
  margin: 0 0 0 18px;
}
`;
