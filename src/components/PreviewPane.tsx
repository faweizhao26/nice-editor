"use client";

import { type RefObject } from "react";

interface Props {
  html: string;
  css: string;
  previewType: "phone" | "pc";
  niceRef: RefObject<HTMLElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
  isMacCode: boolean;
}

export default function PreviewPane({ html, css, previewType, niceRef, scrollRef, isMacCode }: Props) {
  return (
    <div className="preview-wrap">
      {/* 主题样式栈：只在预览区生效，作用域全部是 #nice */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="preview-scroll" ref={scrollRef}>
        <div className={`preview-stage preview-stage-${previewType}${isMacCode ? " is-mac-code" : ""}`}>
          <section
            id="nice"
            ref={niceRef}
            className="nice-preview"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        <div className="preview-bottom-space" />
      </div>
    </div>
  );
}
