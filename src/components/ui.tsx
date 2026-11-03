"use client";

import type { ReactNode } from "react";

export function Section({ title, children, desc }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="ui-section">
      <h3 className="ui-section-title">{title}</h3>
      {desc ? <p className="ui-section-desc">{desc}</p> : null}
      <div className="ui-section-body">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  inline,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  inline?: boolean;
}) {
  return (
    <label className={`ui-field${inline ? " ui-field-inline" : ""}`}>
      <span className="ui-field-label">
        {label}
        {hint ? <em className="ui-field-hint">{hint}</em> : null}
      </span>
      <span className="ui-field-control">{children}</span>
    </label>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label} hint={`${value}${unit}`}>
      <input
        className="ui-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  fallback = "#1e6bb8",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  fallback?: string;
}) {
  return (
    <Field label={label}>
      <span className="ui-color">
        <input
          type="color"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <input
          className="ui-input ui-input-mono"
          type="text"
          value={value}
          placeholder="跟随主题"
          onChange={(e) => onChange(e.target.value)}
        />
        {value ? (
          <button type="button" className="ui-mini" onClick={() => onChange("")} title="恢复主题默认">
            ×
          </button>
        ) : null}
      </span>
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <select className="ui-input" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="ui-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="ui-toggle-track" aria-hidden />
      <span className="ui-toggle-text">
        {label}
        {hint ? <em className="ui-field-hint">{hint}</em> : null}
      </span>
    </label>
  );
}

export function Btn({
  children,
  onClick,
  variant = "default",
  full,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "ghost" | "danger";
  full?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      className={`ui-btn ui-btn-${variant}${full ? " ui-btn-full" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function BtnRow({ children }: { children: ReactNode }) {
  return <div className="ui-btn-row">{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="ui-empty">{children}</p>;
}
