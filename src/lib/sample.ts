/** 默认示例文档：把支持的能力都摆一遍，也顺便当功能自测用例 */
export const SAMPLE_MARKDOWN = `# 欢迎使用 Nice 编辑器

一个把 **Markdown** 排版成微信公众号 / 知乎 / 掘金可用格式的编辑器。左侧写 Markdown，右侧实时预览，点一下就能复制到公众号后台粘贴。

## 为什么需要它

微信公众号编辑器只认**内联样式**：它会丢掉 \`<style>\` 标签，也会丢掉 class 选择器。所以直接把网页 HTML 粘进去，样式全没了。

这个编辑器的做法是：渲染出 HTML 之后，用 [juice](https://github.com/Automattic/juice) 把主题 CSS **内联到每一个元素**上，再写进剪贴板。粘贴过去长什么样，预览里就是什么样。

## 基础语法

### 文本

**粗体**、*斜体*、~~删除线~~、\`行内代码\`、==高亮==、H~2~O、x^2^。

### 列表

- 无序列表
- 第二项
  - 嵌套一层
  - 再一项

1. 有序列表
2. 第二项
3. 第三项

- [x] 已完成的任务
- [ ] 未完成的任务

### 引用

> 一级引用：读一本好书，就是和许多高尚的人谈话。
>
>> 二级引用：嵌套之后会有不同的颜色。
>>
>>> 三级引用：再深一层。

### 表格

| 能力 | 说明 | 状态 |
| :--- | :--- | :--: |
| 主题 | 12 套内置主题，可自定义 CSS | ✅ |
| 代码高亮 | 6 套 highlight.js 主题 | ✅ |
| 数学公式 | MathJax SVG 输出 | ✅ |
| 外链转脚注 | 微信里外链不可点，自动转文末脚注 | ✅ |

### 代码块

\`\`\`typescript
interface Theme {
  id: string;
  name: string;
  css: string;
}

/** 把 CSS 内联到每个元素上 —— 微信只认内联样式 */
export function inlineCss(html: string, css: string): string {
  return juice.inlineContent(html, css, {
    inlinePseudoElements: true,
    preserveImportant: true,
  });
}
\`\`\`

\`\`\`diff
+ 新增的一行
- 删掉的一行
\`\`\`

### 数学公式

行内公式 $E = mc^2$，块级公式：

$$H(D_2) = -\\left(\\frac{2}{4}\\log_2 \\frac{2}{4} + \\frac{2}{4}\\log_2 \\frac{2}{4}\\right) = 1$$

### 目录

在任意位置单独写一行 \`[toc]\` 就会生成目录。

### 注音与图片说明

{漢字|かんじ} 这样的注音语法也能用。

![图片会带上说明文字](https://my-wechat.mdnice.com/logo.png)

### 横屏滑动幻灯片

<![蓝1](https://my-wechat.mdnice.com/blue.jpg),![绿2](https://my-wechat.mdnice.com/green.jpg),![红3](https://my-wechat.mdnice.com/red.jpg)>

## 常用快捷键

| 快捷键 | 功能 |
| :--- | :--- |
| \`⌘/Ctrl + B\` | 加粗 |
| \`⌘/Ctrl + I\` | 斜体 |
| \`⌘/Ctrl + K\` | 插入链接 |
| \`⌘/Ctrl + L\` | 微信外链转脚注 |
| \`⌘/Ctrl + F\` | 搜索替换 |

> 提示：外链在微信里是不能点的，用「微信外链转脚注」把 [Markdown Nice](https://www.mdnice.com) 这类链接转成文末参考资料，读者才能看到地址。

---

写完直接点右侧「复制到公众号」，去公众号后台粘贴即可。
`;
