import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function Row({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rs-row">
      <div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        {description && (
          <div
            className="text-[12.5px] mt-0.5"
            style={{ color: "hsl(var(--rs-muted-fg))" }}
          >
            {description}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">{children}</div>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className="rs-switch"
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    />
  );
}

export interface SegOption<V extends string> {
  value: V;
  label: ReactNode;
  icon?: ReactNode;
}

export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
}: {
  options: SegOption<V>[];
  value: V;
  onChange: (next: V) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const active = root.querySelector<HTMLButtonElement>(`button[data-selected="true"]`);
    if (!active) return;
    const rootRect = root.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    setPill({ left: aRect.left - rootRect.left, width: aRect.width });
  }, [value, options.length]);

  useEffect(() => {
    const onResize = () => {
      const root = rootRef.current;
      if (!root) return;
      const active = root.querySelector<HTMLButtonElement>(`button[data-selected="true"]`);
      if (!active) return;
      const rootRect = root.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      setPill({ left: aRect.left - rootRect.left, width: aRect.width });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div ref={rootRef} className="rs-seg" role="radiogroup">
      {pill && (
        <span
          className="rs-seg-pill"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-selected={opt.value === value}
          data-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  suffix = "",
  ticks,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (next: number) => void;
  label: ReactNode;
  suffix?: string;
  ticks?: number[];
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="w-[320px]">
      <div className="flex items-center justify-between mb-0.5">
        <span
          className="text-[11px] font-mono"
          style={{ color: "hsl(var(--rs-muted-fg))" }}
        >
          {label}
        </span>
        <span className="text-[13px] font-mono font-semibold tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        className="rs-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ ["--rs-pct" as string]: pct + "%" }}
      />
      {ticks && (
        <div
          className="flex justify-between mt-0.5 text-[10px] font-mono"
          style={{ color: "hsl(var(--rs-muted-fg))" }}
        >
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rs-kbd">{children}</kbd>;
}

export function SectionHero({
  eyebrow,
  title,
  description,
  illustration,
  eyebrowColor = "accent",
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  illustration: ReactNode;
  eyebrowColor?: "accent" | "danger";
}) {
  const color = eyebrowColor === "danger" ? "hsl(var(--rs-danger))" : "hsl(var(--rs-accent))";
  return (
    <div className="rs-card overflow-hidden mb-5">
      <div className="grid grid-cols-[1fr_240px]">
        <div className="p-6">
          <div
            className="flex items-center gap-2 text-[12px] uppercase tracking-[.1em] font-semibold"
            style={{ color }}
          >
            {eyebrow}
          </div>
          <h1 className="text-[22px] font-semibold mt-2">{title}</h1>
          <p
            className="text-[13px] leading-relaxed mt-1.5 max-w-md"
            style={{ color: "hsl(var(--rs-muted-fg))" }}
          >
            {description}
          </p>
        </div>
        <div
          className="relative rs-hero-ill rs-grid-bg rs-mask-fade-bottom"
          style={{ backgroundColor: "hsl(var(--rs-card))" }}
        >
          {illustration}
        </div>
      </div>
    </div>
  );
}

export function GithubMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
