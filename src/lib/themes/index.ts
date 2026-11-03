export { BASE_CSS } from "./base";
export {
  ALL_THEMES,
  BUILTIN_THEMES,
  CUSTOM_THEME,
  DEFAULT_THEME_ID,
  buildThemeCss,
  getTheme,
  type Theme,
  type ThemePalette,
  type HeadingStyle,
} from "./builtin";
export { CODE_THEMES, DEFAULT_CODE_THEME_ID, getCodeThemeCss, scopeCodeTheme, type CodeTheme } from "./codeThemes";

import { BASE_CSS } from "./base";
import { getTheme } from "./builtin";
import { getCodeThemeCss } from "./codeThemes";
import { buildFormatCss, type FormatState } from "../format";

export interface StyleStack {
  themeId: string;
  codeThemeId: string;
  format: FormatState;
  customCss: string;
  /** Mac 窗口风格的代码块：顶部三个圆点 */
  isMacCode?: boolean;
}

/**
 * Mac 窗口风格：用 ::before 画三个圆点。
 * juice 的 inlinePseudoElements 会把它变成真实元素，所以微信里也能看到。
 */
export const MAC_CODE_CSS = `#nice pre.custom {
  position: relative;
  padding-top: 34px;
}
#nice pre.custom::before {
  content: "";
  position: absolute;
  top: 13px;
  left: 15px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ff5f57;
  box-shadow: 17px 0 0 #febc2e, 34px 0 0 #28c840;
}`;

/**
 * 组装预览 / 复制用的完整 CSS。
 * 顺序即优先级：base(结构) → theme(视觉) → format(用户微调) → code(代码高亮) → mac → custom(最后兜底)
 */
export function buildStyleStack(s: StyleStack): { preview: string; inline: string } {
  const theme = getTheme(s.themeId);
  const themeCss = s.themeId === "custom" ? "" : theme.css;
  const parts = [
    BASE_CSS,
    themeCss,
    buildFormatCss(s.format),
    getCodeThemeCss(s.codeThemeId),
    s.isMacCode ? MAC_CODE_CSS : "",
    s.customCss || "",
  ];
  const inline = parts.filter(Boolean).join("\n\n");
  return { preview: inline, inline };
}
