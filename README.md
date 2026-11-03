# Nice 编辑器

复刻 [Markdown Nice / mdnice](https://github.com/mdnice/markdown-nice) 的**核心编辑器**：
写 Markdown → 实时排版预览 → 一键复制到微信公众号 / 知乎 / 掘金 / CSDN，粘贴即成型。

纯前端实现，不需要后端：草稿和偏好全部存在浏览器 localStorage 里。

---

## 一、它到底解决了什么问题

这是整个项目唯一值得理解的一点：

> **微信公众号编辑器会丢掉 `<style>` 标签，也会丢掉 class 选择器，只认元素上的内联 `style`。**

所以「把网页 HTML 粘进公众号」必然掉样式。mdnice 的做法（也是本项目的做法）是：

```
Markdown
  → markdown-it 渲染成带 class 的 HTML
  → 套上主题 CSS（作用域 #nice）
  → juice 把 CSS 内联到每一个元素上          ← 关键一步
  → 写进剪贴板（text/html + text/plain）
  → 粘到公众号后台，样式原样保留
```

数学公式另有一层处理：微信不支持 MathJax/KaTeX 的字体与 CSS，但**保留内联 SVG**。
所以公式用 MathJax 的 SVG 输出，复制时把 `<mjx-container>` 换成带内联样式的
`<section><svg>…</svg></section>`。知乎则换成 `<img data-eeimg>`，
掘金换成 `https://juejin.im/equation?tex=…` 图片。

代码块的空白用 `<br/>` + `&nbsp;` 保住（`src/lib/markdown.ts` 的 `toWeChatCode`），
这是微信里代码缩进不塌的关键。

---

## 二、快速开始

```bash
npm install          # 装依赖（postinstall 会把 MathJax 包拷进 public/mathjax）
npm run dev          # 开发：http://localhost:3000
npm run build        # 构建静态站点到 out/
npm run typecheck    # 类型检查
```

### 部署到 GitHub Pages（本项目实际的部署方式）

线上地址：**https://faweizhao26.github.io/nice-editor/**

用的是 **gh-pages 分支**模式，不是 `actions/deploy-pages`：

- 推 `main` → 工作流 `npm ci` + `BASE_PATH=/nice-editor npm run build` → 把 `out/`
  以孤儿提交强推到 `gh-pages` 分支 → Pages 自动重建。
- **为什么不用 `actions/deploy-pages`**：新建仓库首次启用 Pages 需要管理员权限，
  工作流里的 `GITHUB_TOKEN` 会以 `Create Pages site failed. Error: Resource not
  accessible by integration` 失败，即使 `configure-pages` 加了 `enablement: true`。
  而**把产物推到 `gh-pages` 分支，GitHub 会自己把 Pages 打开**（实测新建空仓库也生效），
  一个键都不用点。
- 产物分支带 `.nojekyll`，避免 Jekyll 吞掉 `_next/`。

**项目站点（`https://<user>.github.io/<repo>/`）必须设 basePath**，否则 `/_next/...` 会 404。
工作流里从 `github.event.repository.name` 取，本地想模拟时手动给：

```bash
BASE_PATH=/nice-editor npm run build     # 模拟项目站点
npm run build                            # 根路径部署（Vercel / 自定义域名）留空即可
```

想本地验证「挂在子路径下」的效果：

```bash
mkdir -p /tmp/pages-root/nice-editor && cp -R out/. /tmp/pages-root/nice-editor/
cd /tmp/pages-root && python3 -m http.server 4322
# 打开 http://127.0.0.1:4322/nice-editor/
```

`deploy.sh` 是换仓库/首次部署用的一键脚本：

```bash
./deploy.sh <owner>/<repo>    # 本地先校验构建，再配 remote 并推送
```

---

## 三、目录结构

```
src/
├─ app/
│  ├─ layout.tsx            根布局（zh-CN、主题色、元信息）
│  ├─ page.tsx              入口，只挂 EditorApp
│  └─ globals.css           应用外壳样式（面板、编辑器、预览框、打印样式）
├─ components/
│  ├─ EditorApp.tsx         总装：布局、同步滚动、复制、导入导出、Toast
│  ├─ MdEditor.tsx          CodeMirror 6 编辑器 + 快捷键
│  ├─ PreviewPane.tsx       预览区（注入主题 <style> + 渲染 #nice）
│  ├─ panels.tsx            7 个面板：文件 / 主题 / 代码主题 / 格式 / 功能 / 视图 / 帮助
│  ├─ ui.tsx                面板用的小控件（滑块、色块、开关…）
│  └─ editor/
│     ├─ commands.ts        加粗、标题、列表、外链转脚注、格式化
│     └─ theme.ts           编辑器配色
├─ lib/
│  ├─ markdown.ts           markdown-it 及全部插件（含自写插件）
│  ├─ inline.ts             juice 内联 + 各平台公式适配 + 剪贴板  ★核心
│  ├─ mathjax.ts            MathJax 加载与排版
│  ├─ themes/               base（结构）/ builtin（12 套主题）/ codeThemes（代码高亮）
│  ├─ format.ts             「格式」层：字号、行高、字距、缩进、颜色…
│  ├─ formatDoc.ts          「格式化文档」的 Markdown 规整逻辑
│  ├─ storage.ts            localStorage 草稿、设置、导入导出、独立 HTML
│  └─ sample.ts             默认示例文档（同时当功能自测用例）
├─ store/editor.ts          zustand 状态（内容、主题、格式、草稿、持久化）
└─ types/plugins.d.ts       旧插件的类型声明 + MathJax 全局类型
```

---

## 四、功能

**编辑**

- CodeMirror 6，Markdown 语法高亮、行内查找替换（⌘F）
- 快捷键：⌘B 加粗 / ⌘I 斜体 / ⌘D 删除线 / ⌘E 行内代码 / ⌘K 链接 / ⌘1-3 标题 /
  ⌘⇧8 无序 / ⌘⇧9 有序 / ⌘⇧. 引用 / ⌘⇧C 代码块 / ⌘⇧M 公式 / ⌘⇧T 表格 / ⌘L 外链转脚注
- 编辑器 ↔ 预览同步滚动（可关）
- 布局三态：双栏 / 只看预览 / 只看编辑

**排版**

- 12 套内置主题 + 自定义 CSS（自己写 `#nice …` 规则）
- 6 套代码高亮主题（取自 highlight.js）+ Mac 窗口风格
- 「格式」层可调：字号、行高、字间距、词间距、段间距、首行缩进、对齐、页边距、
  正文/标题/主题色、页面底色，另有 5 个预设
- 预览宽度：手机 375px / 电脑 677px（公众号正文宽度，所见即所得）

**Markdown 语法**

标题、列表、任务列表、引用（三级嵌套不同配色）、表格、脚注、定义列表、删除线、
高亮 `==x==`、上标 `x^2^`、下标 `H~2~O`、注音 `{漢字|かんじ}`、图片说明、
图片尺寸 `![图](url =200x)`、横屏滑动 `<![图1](u1),![图2](u2)>`、`[toc]` 目录、
数学公式 `$行内$` 与 `$$块级$$`。

**输出**

- 复制到公众号 / 知乎 / 掘金 / CSDN（各平台的公式会被转成对应格式）
- 微信外链转脚注：正文链接变 `[n]`，文末自动生成「参考资料」
- 导出 `.md`、导出**已内联样式的独立 HTML**（双击可看，也能贴进别的 CMS）
- 打印 / 导出 PDF（只打印正文，自动隐藏全部界面）
- 本地草稿：保存 / 打开 / 删除，最多 50 篇
- **分享链接**：把正文 + 主题 + 格式压进 URL 发给同事，点开即恢复

---

## 四·一、分享链接怎么工作

「文件」面板 → **复制分享链接**，得到形如
`https://…/nice-editor/#d=N4IgxiBcIMQASCJrQc…` 的地址。

- 内容放在 **fragment（`#` 后面）**，浏览器不会把它发给服务器 —— 纯静态站点没有后端，
  文章也永远不会落到 GitHub Pages 的日志里。
- 正文 + 标题 + 主题 + 代码主题 + 自定义 CSS + 格式微调一起编码；**只写非默认值**，
  链接能短一截是一截。
- 压缩用 lz-string。它的字母表含 `+` 和 `$`，直接 `encodeURIComponent` 会把链接撑大约 2%，
  所以改成等长替换（`+`→`.`、`$`→`_`），结果全落在 URL 安全字符集内，
  任何聊天工具都不会改写。
- 打开分享链接后，**hash 由 `src/app/layout.tsx` 里的一段引导脚本在 React 之前清掉**。
  这一点很关键：如果用 `useEffect` 清，Next 的路由器会在 hydration 时把 hash 写回去，
  刷新页面就会反复用分享内容覆盖你已经编辑过的正文。
- 长度参考：1700 字的中文文章 → 链接约 2700 字符；超过 8000 字符会提示改用 `.md` 文件。

---

## 五、加一套主题

在 `src/lib/themes/builtin.ts` 的 `PALETTES` 里加一条：

```ts
{
  id: "my-theme",
  name: "我的主题",
  desc: "一句话描述",
  accent: "#1e6bb8",        // 主题列表色块 + 标题/列表符号/强调色
  text: "#2b2b2b",
  heading: "#1a1a1a",
  sub: "#9a9a9a",
  link: "#1e6bb8",
  inlineCodeBg: "#f2f2f2",
  inlineCodeColor: "#c7254e",
  quoteBg: "#f7f7f7",
  quoteBorder: "#1e6bb8",
  quoteColor: "#5a5a5a",
  tableHeadBg: "#f2f4f7",
  tableBorder: "#e2e5e9",
  divider: "#e0e0e0",
  headingStyle: "underline", // plain | underline | bar | pill | boxed | center
}
```

`buildThemeCss()` 会把它展开成完整主题。写主题时的三条硬性约束：

1. **不能有 CSS 变量**（`var(--x)`）—— juice 不解析，微信也不认；
2. **选择器必须挂在 `#nice` 下**，否则复制时匹配不到；
3. **别用依赖运行时状态的选择器**（`:hover` 之类）——预览正常，复制后失效。
   `:nth-child` 是可以的，juice 会算出结果再内联。

## 六、加一套代码高亮主题

```bash
# 1. 编辑 scripts/gen-code-themes.mjs 的 STYLES 数组
# 2. 重新生成
npm run gen:code-themes
```

生成时会自动剥掉 CSS 注释、丢掉 `pre code.hljs` 布局规则、把 `.hljs` 的底色挂到
`#nice pre.custom` 上、给 token 类名加作用域。

---

## 七、与 mdnice 的差异

| | mdnice | 本项目 |
| :--- | :--- | :--- |
| 技术栈 | React 16 + MobX + antd 3 + webpack 4 | Next.js 16 + React 19 + TS + zustand |
| 编辑器 | CodeMirror 5（`@uiw/react-codemirror` v1） | CodeMirror 6 |
| 状态 / 持久化 | 部分依赖服务端（登录、图床、主题市场） | 纯前端，localStorage |
| 主题来源 | 服务端 `api.mdnice.com/themes` | 仓库内置 12 套，可自定义 |
| 数学公式 | MathJax v3 `tex-svg-full` | MathJax v4 `tex-svg-nofont` |
| 图片上传 | 阿里云 OSS / 七牛 / GitHub / Gitee / 图壳 | 未做（见下） |
| 社区 / 会员 | 有 | 无（本次只复刻核心编辑器） |

## 八、已知限制

- **没有图床**：图片需要自己填外链地址。要做的话在 `MdEditor` 的粘贴/拖拽回调里加
  一个上传适配器，把返回的 URL 插进选区即可。
- **没有账号体系**：草稿只在本机浏览器里，换设备不同步。同事之间传文章用「分享链接」或导出的 `.md`。
- **手机是「能看」级别**：面板默认收起、复制条挪到屏幕底部，但没有做「编辑/预览分页签」那套完整响应式。
  写文章建议还是在电脑上。
- **MathJax 只在文档里出现 `$` 公式时才加载**（约 870KB，首屏不受影响）。
- **PC 预览是固定 677px**：窗口不够宽时预览区横向滚动，而不是把预览压窄——
  压窄就失去「所见即所得」的意义了。建议把窗口拉宽或收起左侧面板。
- 复杂公式（`\ce{}`、`\require{}` 等 TeX 扩展）依赖 MathJax 默认扩展集，个别宏包可能不支持。

## 九、许可

代码为本次复刻新写。其中：

- 代码高亮配色取自 [highlight.js](https://github.com/highlightjs/highlight.js)（BSD-3-Clause）；
- MathJax 由 `mathjax` npm 包提供（Apache-2.0）；
- 参考了 [mdnice/markdown-nice](https://github.com/mdnice/markdown-nice) 的实现思路
  （GPL-3.0）。**本项目未复制其源码**，主题 CSS 与插件均为重写；
  若打算商用，仍建议先确认这条边界。
