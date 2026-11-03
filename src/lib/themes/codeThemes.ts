/**
 * 代码高亮主题：取自 highlight.js 自带样式表（BSD-3-Clause）。
 * 由 scripts/gen-code-themes.mjs 生成，请勿手改。
 */

export interface CodeTheme {
  id: string;
  name: string;
  css: string;
}

const atomOneDark = `
pre code.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em
}
code.hljs {
  padding: 3px 5px
}
/*

Atom One Dark by Daniel Gamage
Original One Dark Syntax theme from https://github.com/atom/one-dark-syntax

base:    #282c34
mono-1:  #abb2bf
mono-2:  #818896
mono-3:  #5c6370
hue-1:   #56b6c2
hue-2:   #61aeee
hue-3:   #c678dd
hue-4:   #98c379
hue-5:   #e06c75
hue-5-2: #be5046
hue-6:   #d19a66
hue-6-2: #e6c07b

*/
.hljs {
  color: #abb2bf;
  background: #282c34
}
.hljs-comment,
.hljs-quote {
  color: #5c6370;
  font-style: italic
}
.hljs-doctag,
.hljs-keyword,
.hljs-formula {
  color: #c678dd
}
.hljs-section,
.hljs-name,
.hljs-selector-tag,
.hljs-deletion,
.hljs-subst {
  color: #e06c75
}
.hljs-literal {
  color: #56b6c2
}
.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta .hljs-string {
  color: #98c379
}
.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-number {
  color: #d19a66
}
.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-meta,
.hljs-selector-id,
.hljs-title {
  color: #61aeee
}
.hljs-built_in,
.hljs-title.class_,
.hljs-class .hljs-title {
  color: #e6c07b
}
.hljs-emphasis {
  font-style: italic
}
.hljs-strong {
  font-weight: bold
}
.hljs-link {
  text-decoration: underline
}
`;

const atomOneLight = `
pre code.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em
}
code.hljs {
  padding: 3px 5px
}
/*

Atom One Light by Daniel Gamage
Original One Light Syntax theme from https://github.com/atom/one-light-syntax

base:    #fafafa
mono-1:  #383a42
mono-2:  #686b77
mono-3:  #a0a1a7
hue-1:   #0184bb
hue-2:   #4078f2
hue-3:   #a626a4
hue-4:   #50a14f
hue-5:   #e45649
hue-5-2: #c91243
hue-6:   #986801
hue-6-2: #c18401

*/
.hljs {
  color: #383a42;
  background: #fafafa
}
.hljs-comment,
.hljs-quote {
  color: #a0a1a7;
  font-style: italic
}
.hljs-doctag,
.hljs-keyword,
.hljs-formula {
  color: #a626a4
}
.hljs-section,
.hljs-name,
.hljs-selector-tag,
.hljs-deletion,
.hljs-subst {
  color: #e45649
}
.hljs-literal {
  color: #0184bb
}
.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta .hljs-string {
  color: #50a14f
}
.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-number {
  color: #986801
}
.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-meta,
.hljs-selector-id,
.hljs-title {
  color: #4078f2
}
.hljs-built_in,
.hljs-title.class_,
.hljs-class .hljs-title {
  color: #c18401
}
.hljs-emphasis {
  font-style: italic
}
.hljs-strong {
  font-weight: bold
}
.hljs-link {
  text-decoration: underline
}
`;

const monokai = `
pre code.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em
}
code.hljs {
  padding: 3px 5px
}
/*
Monokai style - ported by Luigi Maselli - http://grigio.org
*/
.hljs {
  background: #272822;
  color: #ddd
}
.hljs-tag,
.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-strong,
.hljs-number,
.hljs-name {
  color: #f92672
}
.hljs-code {
  color: #66d9ef
}
.hljs-attribute,
.hljs-attr,
.hljs-symbol,
.hljs-regexp,
.hljs-link {
  color: #bf79db
}
.hljs-string,
.hljs-bullet,
.hljs-subst,
.hljs-title,
.hljs-section,
.hljs-emphasis,
.hljs-type,
.hljs-built_in,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-addition,
.hljs-variable,
.hljs-template-tag,
.hljs-template-variable {
  color: #a6e22e
}
.hljs-title.class_,
.hljs-class .hljs-title {
  color: white
}
.hljs-comment,
.hljs-quote,
.hljs-deletion,
.hljs-meta {
  color: #75715e
}
.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-doctag,
.hljs-title,
.hljs-section,
.hljs-type,
.hljs-selector-id {
  font-weight: bold
}
`;

const github = `
pre code.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em
}
code.hljs {
  padding: 3px 5px
}
/*!
  Theme: GitHub
  Description: Light theme as seen on github.com
  Author: github.com
  Maintainer: @Hirse
  Updated: 2021-05-15

  Outdated base version: https://github.com/primer/github-syntax-light
  Current colors taken from GitHub's CSS
*/
.hljs {
  color: #24292e;
  background: #ffffff
}
.hljs-doctag,
.hljs-keyword,
.hljs-meta .hljs-keyword,
.hljs-template-tag,
.hljs-template-variable,
.hljs-type,
.hljs-variable.language_ {
  /* prettylights-syntax-keyword */
  color: #d73a49
}
.hljs-title,
.hljs-title.class_,
.hljs-title.class_.inherited__,
.hljs-title.function_ {
  /* prettylights-syntax-entity */
  color: #6f42c1
}
.hljs-attr,
.hljs-attribute,
.hljs-literal,
.hljs-meta,
.hljs-number,
.hljs-operator,
.hljs-variable,
.hljs-selector-attr,
.hljs-selector-class,
.hljs-selector-id {
  /* prettylights-syntax-constant */
  color: #005cc5
}
.hljs-regexp,
.hljs-string,
.hljs-meta .hljs-string {
  /* prettylights-syntax-string */
  color: #032f62
}
.hljs-built_in,
.hljs-symbol {
  /* prettylights-syntax-variable */
  color: #e36209
}
.hljs-comment,
.hljs-code,
.hljs-formula {
  /* prettylights-syntax-comment */
  color: #6a737d
}
.hljs-name,
.hljs-quote,
.hljs-selector-tag,
.hljs-selector-pseudo {
  /* prettylights-syntax-entity-tag */
  color: #22863a
}
.hljs-subst {
  /* prettylights-syntax-storage-modifier-import */
  color: #24292e
}
.hljs-section {
  /* prettylights-syntax-markup-heading */
  color: #005cc5;
  font-weight: bold
}
.hljs-bullet {
  /* prettylights-syntax-markup-list */
  color: #735c0f
}
.hljs-emphasis {
  /* prettylights-syntax-markup-italic */
  color: #24292e;
  font-style: italic
}
.hljs-strong {
  /* prettylights-syntax-markup-bold */
  color: #24292e;
  font-weight: bold
}
.hljs-addition {
  /* prettylights-syntax-markup-inserted */
  color: #22863a;
  background-color: #f0fff4
}
.hljs-deletion {
  /* prettylights-syntax-markup-deleted */
  color: #b31d28;
  background-color: #ffeef0
}
.hljs-char.escape_,
.hljs-link,
.hljs-params,
.hljs-property,
.hljs-punctuation,
.hljs-tag {
  /* purposely ignored */
  
}
`;

const vs2015 = `
pre code.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em
}
code.hljs {
  padding: 3px 5px
}
/*
 * Visual Studio 2015 dark style
 * Author: Nicolas LLOBERA <nllobera@gmail.com>
 */
.hljs {
  background: #1E1E1E;
  color: #DCDCDC
}
.hljs-keyword,
.hljs-literal,
.hljs-symbol,
.hljs-name {
  color: #569CD6
}
.hljs-link {
  color: #569CD6;
  text-decoration: underline
}
.hljs-built_in,
.hljs-type {
  color: #4EC9B0
}
.hljs-number,
.hljs-class {
  color: #B8D7A3
}
.hljs-string,
.hljs-meta .hljs-string {
  color: #D69D85
}
.hljs-regexp,
.hljs-template-tag {
  color: #9A5334
}
.hljs-subst,
.hljs-function,
.hljs-title,
.hljs-params,
.hljs-formula {
  color: #DCDCDC
}
.hljs-comment,
.hljs-quote {
  color: #57A64A;
  font-style: italic
}
.hljs-doctag {
  color: #608B4E
}
.hljs-meta,
.hljs-meta .hljs-keyword,
.hljs-tag {
  color: #9B9B9B
}
.hljs-variable,
.hljs-template-variable {
  color: #BD63C5
}
.hljs-attr,
.hljs-attribute {
  color: #9CDCFE
}
.hljs-section {
  color: gold
}
.hljs-emphasis {
  font-style: italic
}
.hljs-strong {
  font-weight: bold
}
/*.hljs-code {
  font-family:'Monospace';
}*/
.hljs-bullet,
.hljs-selector-tag,
.hljs-selector-id,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo {
  color: #D7BA7D
}
.hljs-addition {
  background-color: #144212;
  display: inline-block;
  width: 100%
}
.hljs-deletion {
  background-color: #600;
  display: inline-block;
  width: 100%
}
`;

const xcode = `
pre code.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em
}
code.hljs {
  padding: 3px 5px
}
/*

XCode style (c) Angel Garcia <angelgarcia.mail@gmail.com>

*/
.hljs {
  background: #fff;
  color: black
}
/* Gray DOCTYPE selectors like WebKit */
.xml .hljs-meta {
  color: #c0c0c0
}
.hljs-comment,
.hljs-quote {
  color: #007400
}
.hljs-tag,
.hljs-attribute,
.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-name {
  color: #aa0d91
}
.hljs-variable,
.hljs-template-variable {
  color: #3F6E74
}
.hljs-code,
.hljs-string,
.hljs-meta .hljs-string {
  color: #c41a16
}
.hljs-regexp,
.hljs-link {
  color: #0E0EFF
}
.hljs-title,
.hljs-symbol,
.hljs-bullet,
.hljs-number {
  color: #1c00cf
}
.hljs-section,
.hljs-meta {
  color: #643820
}
.hljs-title.class_,
.hljs-class .hljs-title,
.hljs-type,
.hljs-built_in,
.hljs-params {
  color: #5c2699
}
.hljs-attr {
  color: #836C28
}
.hljs-subst {
  color: #000
}
.hljs-formula {
  background-color: #eee;
  font-style: italic
}
.hljs-addition {
  background-color: #baeeba
}
.hljs-deletion {
  background-color: #ffc8bd
}
.hljs-selector-id,
.hljs-selector-class {
  color: #9b703f
}
.hljs-doctag,
.hljs-strong {
  font-weight: bold
}
.hljs-emphasis {
  font-style: italic
}
`;

export const CODE_THEMES: CodeTheme[] = [
  { id: "atomOneDark", name: "Atom One Dark", css: atomOneDark },
  { id: "atomOneLight", name: "Atom One Light", css: atomOneLight },
  { id: "monokai", name: "Monokai", css: monokai },
  { id: "github", name: "GitHub", css: github },
  { id: "vs2015", name: "VS 2015", css: vs2015 },
  { id: "xcode", name: "Xcode", css: xcode },
];

export const DEFAULT_CODE_THEME_ID = "atomOneDark";

/**
 * 把 highlight.js 的样式改写进编辑器作用域。
 *
 * 注意：必须先剥掉 CSS 注释再按规则切分 —— highlight.js 的样式表里
 * 注释紧贴在下一条规则前面，不剥掉的话注释会被当成选择器的一部分，
 * 结果 .hljs 的 background 声明被拼成非法选择器而整条失效（代码块会没有底色）。
 */
export function scopeCodeTheme(css: string): string {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return clean.replace(/([^{}]+)\{([^{}]*)\}/g, (_m, sel: string, body: string) => {
    const sels = sel
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !/^(pre\s+)?code\.hljs$/.test(s))
      .map((s) => (s === ".hljs" ? "#nice pre.custom" : `#nice ${s}`));
    return sels.length ? `${sels.join(", ")}{ ${body} }` : "";
  });
}

export function getCodeThemeCss(id: string): string {
  const theme = CODE_THEMES.find((t) => t.id === id) ?? CODE_THEMES[0];
  return scopeCodeTheme(theme.css);
}
