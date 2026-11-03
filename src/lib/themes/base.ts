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
  word-break: break-all;
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
#nice .footnotes-sep {
  display: none;
}
#nice .footnotes {
  display: block;
  font-size: 13px;
  line-height: 1.7;
  margin-top: 24px;
}
#nice .footnotes-title {
  font-size: 14px;
  margin: 0 0 8px;
  font-weight: 600;
}
#nice .footnotes-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}
#nice .nice-footnote-item {
  list-style: none;
  margin: 4px 0;
  word-break: break-all;
}
#nice .footnote-num {
  font-weight: 600;
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
