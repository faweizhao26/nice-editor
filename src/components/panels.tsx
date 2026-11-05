"use client";

import { useEditor, type PanelId } from "@/store/editor";
import { ALL_THEMES, CODE_THEMES, getTheme } from "@/lib/themes";
import { FORMAT_PRESETS, FONT_STACKS, contrastRatio, type FormatState } from "@/lib/format";
import { Btn, BtnRow, ColorField, Empty, Field, Section, SelectField, SliderField, Toggle } from "./ui";

export interface PanelActions {
  onImport: () => void;
  onExportMd: () => void;
  onExportHtml: () => void;
  onPrint: () => void;
  onFormatDoc: () => void;
  onLinkToFoot: () => void;
  onClear: () => void;
  onShare: () => void;
  onCopy: (target: "wechat" | "zhihu" | "juejin" | "csdn") => void;
}

/** 从 highlight.js 主题 CSS 里抠出底色和字色，用来画色卡 */
function codeSwatch(css: string): { bg: string; fg: string } {
  const block = /\.hljs\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const bg = /background(?:-color)?:\s*([^;]+)/.exec(block)?.[1]?.trim() ?? "#ffffff";
  const fg = /(?:^|;)\s*color:\s*([^;]+)/.exec(block)?.[1]?.trim() ?? "#333333";
  return { bg, fg };
}

/* ------------------------------------------------------------------ */

function ThemePanel() {
  const themeId = useEditor((s) => s.themeId);
  const patch = useEditor((s) => s.patch);
  const customCss = useEditor((s) => s.customCss);

  return (
    <>
      <Section title="主题" desc="点击套用。主题决定配色与标题样式，复制时会整体内联到微信。">
        <div className="theme-grid">
          {ALL_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-card${themeId === t.id ? " is-active" : ""}`}
              onClick={() => patch({ themeId: t.id })}
              title={t.desc}
            >
              <span className="theme-swatch" style={{ background: t.accent }}>
                <span className="theme-swatch-bar" style={{ background: t.text }} />
              </span>
              <span className="theme-name">{t.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {themeId === "custom" ? (
        <Section title="自定义 CSS" desc="规则必须以 #nice 开头，复制时会被内联到每个元素。">
          <textarea
            className="ui-textarea ui-textarea-code"
            spellCheck={false}
            value={customCss}
            placeholder={"#nice h2 {\n  color: #1e6bb8;\n}"}
            onChange={(e) => patch({ customCss: e.target.value })}
            rows={16}
          />
        </Section>
      ) : (
        <Section title="附加 CSS" desc="叠加在当前主题之上，用来做局部微调。">
          <textarea
            className="ui-textarea ui-textarea-code"
            spellCheck={false}
            value={customCss}
            placeholder={"/* 例：#nice h2 { letter-spacing: 1px; } */"}
            onChange={(e) => patch({ customCss: e.target.value })}
            rows={8}
          />
        </Section>
      )}
    </>
  );
}

function CodeThemePanel() {
  const codeThemeId = useEditor((s) => s.codeThemeId);
  const isMacCode = useEditor((s) => s.isMacCode);
  const patch = useEditor((s) => s.patch);
  const customCss = useEditor((s) => s.customCss);

  /**
   * 自定义 CSS 是不是已经把代码块配色接管了？
   *
   * 自定义层是最后兜底层（还会统一补 `!important`），所以只要里面有涉及
   * 代码块的规则，代码主题就会被完全盖住 —— 切换主题时外观**一点都不变**。
   * 不说清楚的话用户只会以为这个面板坏了。
   *
   * `\b` 边界是必要的：否则 `.prefix` 里的 "pre" 会误判。
   */
  const codeOverridden = /\bhljs\b|\bpre\b/i.test(customCss || "");

  return (
    <>
      <Section title="代码主题" desc="代码块的高亮配色，取自 highlight.js 官方主题。">
        {codeOverridden ? (
          <p className="ui-warn">
            你的<b>自定义 CSS</b> 里已经写了代码块的规则（涉及 <b>pre</b> / <b>hljs</b>），
            它会盖住这里的主题配色 —— 切换下面任意一套都<b>不会改变外观</b>。
            想让这个面板生效，先把自定义 CSS 里 <b>pre</b> / <b>hljs</b> 相关的颜色规则删掉。
          </p>
        ) : null}

        <div className="code-list">
          {CODE_THEMES.map((t) => {
            const { bg, fg } = codeSwatch(t.css);
            return (
              <button
                key={t.id}
                type="button"
                className={`code-card${codeThemeId === t.id ? " is-active" : ""}`}
                onClick={() => patch({ codeThemeId: t.id })}
              >
                <span className="code-preview" style={{ background: bg, color: fg }}>
                  <span style={{ color: fg, opacity: 0.7 }}>const</span> a = 1;
                </span>
                <span className="code-name">{t.name}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="样式">
        <Toggle
          label="Mac 窗口风格"
          hint="代码块顶部加三个圆点"
          checked={isMacCode}
          onChange={(v) => patch({ isMacCode: v })}
        />
      </Section>
    </>
  );
}

function FormatPanel() {
  const format = useEditor((s) => s.format);
  const setFormat = useEditor((s) => s.setFormat);
  const patch = useEditor((s) => s.patch);
  const linkToFoot = useEditor((s) => s.linkToFoot);
  const themeId = useEditor((s) => s.themeId);
  const theme = getTheme(themeId);

  /**
   * 「跟随主题」时（值为空）取色器必须显示**当前主题的真实颜色**。
   * 否则暗色主题下会显示写死的浅色兜底值（页面底色显示 #ffffff），
   * 用户点一下确认就把主题底色冲成白的，而正文仍是主题的浅色 —— 白底浅字，
   * 预览里看不出来，复制到公众号才发现整篇看不清。
   */
  const themeBg = theme.bodyBg ?? "#ffffff";
  const effectiveBg = format.bodyBg || themeBg;
  const effectiveFg = format.color || theme.text;
  const contrast = contrastRatio(effectiveFg, effectiveBg);
  const lowContrast = contrast !== null && contrast < 4.5;
  const anyColorOverride = !!(format.color || format.headingColor || format.accent || format.bodyBg);

  /** 用户选中的正好是主题自己的颜色 → 当作「跟随主题」，不写死成覆盖值 */
  const clearIfTheme = (v: string, themeColor: string) =>
    v.trim().toLowerCase() === themeColor.trim().toLowerCase() ? "" : v;

  return (
    <>
      <Section title="预设">
        <BtnRow>
          {FORMAT_PRESETS.map((p) => (
            <Btn key={p.id} onClick={() => setFormat(p.format)}>
              {p.name}
            </Btn>
          ))}
        </BtnRow>
      </Section>

      <Section title="排版">
        <SliderField label="字号" value={format.fontSize} min={12} max={24} unit="px" onChange={(v) => setFormat({ fontSize: v })} />
        <SliderField label="行高" value={format.lineHeight} min={1.2} max={2.6} step={0.05} onChange={(v) => setFormat({ lineHeight: v })} />
        <SliderField label="字间距" value={format.letterSpacing} min={0} max={3} step={0.1} unit="px" onChange={(v) => setFormat({ letterSpacing: v })} />
        <SliderField label="词间距" value={format.wordSpacing} min={0} max={6} step={0.5} unit="px" onChange={(v) => setFormat({ wordSpacing: v })} />
        <SliderField label="段间距" value={format.paragraphSpacing} min={0} max={36} unit="px" onChange={(v) => setFormat({ paragraphSpacing: v })} />
        <SliderField label="首行缩进" value={format.textIndent} min={0} max={3} step={0.5} unit="em" onChange={(v) => setFormat({ textIndent: v })} />
        <SliderField label="页边距" value={format.padding} min={0} max={40} unit="px" onChange={(v) => setFormat({ padding: v })} />
        <SelectField
          label="对齐"
          value={format.textAlign}
          onChange={(v) => setFormat({ textAlign: v as FormatState["textAlign"] })}
          options={[
            { value: "left", label: "左对齐" },
            { value: "justify", label: "两端对齐" },
            { value: "center", label: "居中" },
            { value: "right", label: "右对齐" },
          ]}
        />
      </Section>

      <Section title="字体">
        <SelectField
          label="正文字体"
          value={format.fontFamily}
          onChange={(v) => setFormat({ fontFamily: v as FormatState["fontFamily"] })}
          options={[
            { value: "sans", label: "无衬线（默认）" },
            { value: "serif", label: "衬线 / 优雅" },
            { value: "mono", label: "等宽" },
            { value: "custom", label: "自定义" },
          ]}
        />
        {format.fontFamily === "custom" ? (
          <Field label="font-family">
            <input
              className="ui-input ui-input-mono"
              value={format.customFontFamily}
              placeholder={FONT_STACKS.sans.slice(0, 40) + "…"}
              onChange={(e) => setFormat({ customFontFamily: e.target.value })}
            />
          </Field>
        ) : null}
      </Section>

      <Section title="颜色" desc="留空表示跟随主题；取色器里显示的就是当前主题的实际颜色。">
        <ColorField label="正文颜色" value={format.color} fallback={theme.text} onChange={(v) => setFormat({ color: clearIfTheme(v, theme.text) })} />
        <ColorField label="标题颜色" value={format.headingColor} fallback={theme.heading} onChange={(v) => setFormat({ headingColor: clearIfTheme(v, theme.heading) })} />
        <ColorField label="主题色" value={format.accent} fallback={theme.accent} onChange={(v) => setFormat({ accent: clearIfTheme(v, theme.accent) })} />
        <ColorField label="页面底色" value={format.bodyBg} fallback={themeBg} onChange={(v) => setFormat({ bodyBg: clearIfTheme(v, themeBg) })} />

        {lowContrast ? (
          <p className="ui-warn">
            当前正文是 <b>{effectiveFg}</b>、底色是 <b>{effectiveBg}</b>，对比度只有{" "}
            <b>{contrast!.toFixed(1)}:1</b>（正文建议 ≥ 4.5），会看不清。
          </p>
        ) : null}

        {anyColorOverride ? (
          <BtnRow>
            <Btn onClick={() => setFormat({ color: "", headingColor: "", accent: "", bodyBg: "" })}>全部恢复跟随主题</Btn>
          </BtnRow>
        ) : null}
      </Section>

      <Section title="微信">
        <Toggle
          label="外链转脚注"
          hint="正文链接变成 [n]，文末生成参考资料"
          checked={linkToFoot}
          onChange={(v) => patch({ linkToFoot: v })}
        />
      </Section>
    </>
  );
}

function FilePanel({ actions }: { actions: PanelActions }) {
  const drafts = useEditor((s) => s.drafts);
  const saveDraft = useEditor((s) => s.saveDraft);
  const openDraft = useEditor((s) => s.openDraft);
  const removeDraft = useEditor((s) => s.removeDraft);
  const newDocument = useEditor((s) => s.newDocument);
  const loadSample = useEditor((s) => s.loadSample);

  return (
    <>
      <Section title="文档">
        <BtnRow>
          <Btn onClick={newDocument}>新建</Btn>
          <Btn onClick={actions.onImport}>导入 .md</Btn>
          <Btn onClick={loadSample}>载入示例</Btn>
        </BtnRow>
      </Section>

      <Section title="导出">
        <BtnRow>
          <Btn onClick={actions.onExportMd}>.md</Btn>
          <Btn onClick={actions.onExportHtml}>独立 HTML</Btn>
          <Btn onClick={actions.onPrint}>打印 / PDF</Btn>
        </BtnRow>
      </Section>

      <Section
        title="分享给同事"
        desc="把正文、主题、格式一起压进链接。链接不会发给服务器（在 # 后面），点开即恢复原文。"
      >
        <BtnRow>
          <Btn variant="primary" full onClick={actions.onShare}>
            复制分享链接
          </Btn>
        </BtnRow>
      </Section>

      <Section title="本地草稿" desc="存在浏览器 localStorage，最多 50 篇。">
        <BtnRow>
          <Btn variant="primary" full onClick={saveDraft}>
            保存当前草稿
          </Btn>
        </BtnRow>
        {drafts.length === 0 ? (
          <Empty>还没有草稿</Empty>
        ) : (
          <ul className="draft-list">
            {drafts.map((d) => (
              <li key={d.id} className="draft-item">
                <button type="button" className="draft-open" onClick={() => openDraft(d.id)}>
                  <span className="draft-title">{d.title}</span>
                  <span className="draft-meta">
                    {new Date(d.updatedAt).toLocaleString("zh-CN", { hour12: false })}
                  </span>
                </button>
                <button
                  type="button"
                  className="draft-del"
                  title="删除"
                  onClick={() => removeDraft(d.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function FunctionPanel({ actions }: { actions: PanelActions }) {
  const content = useEditor((s) => s.content);
  const chars = content.length;
  const noSpace = content.replace(/\s/g, "").length;
  const lines = content ? content.split("\n").length : 0;

  return (
    <>
      <Section title="统计">
        <ul className="stat-list">
          <li>
            <span>行数</span>
            <b>{lines}</b>
          </li>
          <li>
            <span>字符数</span>
            <b>{chars}</b>
          </li>
          <li>
            <span>不计空白</span>
            <b>{noSpace}</b>
          </li>
          <li>
            <span>预计阅读</span>
            <b>{Math.max(1, Math.round(noSpace / 400))} 分钟</b>
          </li>
        </ul>
      </Section>

      <Section
        title="处理"
        desc="一键格式化：中英文/数字之间加空格、中文与 $ 之间加空格、规范标题与列表标记、整理空行。代码块内容原样保留。快捷键 ⌥⌘F / Ctrl+Alt+F。"
      >
        <BtnRow>
          <Btn variant="primary" onClick={actions.onFormatDoc}>
            一键格式化
          </Btn>
          <Btn onClick={actions.onLinkToFoot}>外链转脚注</Btn>
          <Btn variant="danger" onClick={actions.onClear}>
            清空内容
          </Btn>
        </BtnRow>
      </Section>

      <Section title="复制">
        <BtnRow>
          <Btn variant="primary" onClick={() => actions.onCopy("wechat")}>
            公众号
          </Btn>
          <Btn onClick={() => actions.onCopy("zhihu")}>知乎</Btn>
          <Btn onClick={() => actions.onCopy("juejin")}>掘金</Btn>
          <Btn onClick={() => actions.onCopy("csdn")}>CSDN</Btn>
        </BtnRow>
      </Section>
    </>
  );
}

function ViewPanel({
  onToggleEditor,
  onTogglePreview,
  editorOpen,
  previewOpen,
}: {
  onToggleEditor: () => void;
  onTogglePreview: () => void;
  editorOpen: boolean;
  previewOpen: boolean;
}) {
  const previewType = useEditor((s) => s.previewType);
  const syncScroll = useEditor((s) => s.syncScroll);
  const patch = useEditor((s) => s.patch);

  return (
    <>
      <Section title="布局">
        <Toggle label="显示编辑区" checked={editorOpen} onChange={onToggleEditor} />
        <Toggle label="显示预览区" checked={previewOpen} onChange={onTogglePreview} />
        <Toggle label="同步滚动" checked={syncScroll} onChange={(v) => patch({ syncScroll: v })} />
      </Section>

      <Section title="预览宽度">
        <BtnRow>
          <Btn variant={previewType === "phone" ? "primary" : "default"} onClick={() => patch({ previewType: "phone" })}>
            手机
          </Btn>
          <Btn variant={previewType === "pc" ? "primary" : "default"} onClick={() => patch({ previewType: "pc" })}>
            电脑
          </Btn>
        </BtnRow>
      </Section>
    </>
  );
}

const SHORTCUTS: [string, string][] = [
  ["⌘/Ctrl + B", "加粗"],
  ["⌘/Ctrl + I", "斜体"],
  ["⌘/Ctrl + D", "删除线"],
  ["⌘/Ctrl + E", "行内代码"],
  ["⌘/Ctrl + K", "插入链接"],
  ["⌘/Ctrl + L", "外链转脚注"],
  ["⌘/Ctrl + 1/2/3", "一/二/三级标题"],
  ["⌘/Ctrl + ⇧ + 8", "无序列表"],
  ["⌘/Ctrl + ⇧ + 9", "有序列表"],
  ["⌘/Ctrl + ⇧ + .", "引用"],
  ["⌘/Ctrl + ⇧ + C", "代码块"],
  ["⌘/Ctrl + ⇧ + M", "公式块"],
  ["⌘/Ctrl + ⇧ + T", "表格"],
  ["⌘/Ctrl + F", "查找替换"],
];

const SYNTAX: [string, string][] = [
  ["**粗体** *斜体* ~~删除~~", "强调"],
  ["`行内代码`", "行内代码"],
  ["==高亮==", "高亮"],
  ["H~2~O x^2^", "下标 / 上标"],
  ["$公式$  $$块公式$$", "数学公式"],
  ["[toc]", "生成目录"],
  ["{漢字|かんじ}", "注音"],
  ["![说明](图片地址)", "图片（自动带说明）"],
  ["![图](url =200x)", "指定宽高"],
  ["<![图1](u1),![图2](u2)>", "横屏滑动"],
  ["- [x] 已完成", "任务列表"],
  ["| a | b |", "表格"],
];

function HelpPanel() {
  return (
    <>
      <Section title="快捷键">
        <ul className="kv-list">
          {SHORTCUTS.map(([k, v]) => (
            <li key={k}>
              <code>{k}</code>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="语法速查">
        <ul className="kv-list">
          {SYNTAX.map(([k, v]) => (
            <li key={k}>
              <code>{k}</code>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="关于">
        <p className="ui-section-desc" style={{ margin: 0 }}>
          复刻自 <b>Markdown Nice / mdnice</b> 的核心编辑器：Markdown → 内联样式 HTML →
          一键粘贴到公众号、知乎、掘金、CSDN。纯前端实现，草稿存在本地浏览器。
        </p>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function Panel({
  id,
  actions,
  view,
}: {
  id: PanelId;
  actions: PanelActions;
  view: { editorOpen: boolean; previewOpen: boolean; onToggleEditor: () => void; onTogglePreview: () => void };
}) {
  switch (id) {
    case "file":
      return <FilePanel actions={actions} />;
    case "theme":
      return <ThemePanel />;
    case "code":
      return <CodeThemePanel />;
    case "format":
      return <FormatPanel />;
    case "function":
      return <FunctionPanel actions={actions} />;
    case "view":
      return <ViewPanel {...view} />;
    case "help":
      return <HelpPanel />;
    default:
      return null;
  }
}
