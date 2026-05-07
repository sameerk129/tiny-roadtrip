"use client";

interface Props {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  hint?: string;
}

export default function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  hint,
}: Props) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.18em] text-white/60">
        <span>{label}</span>
        <span className="tabular-nums text-white/80">
          {hint ?? Math.round(value)}
        </span>
      </div>
      <input
        type="range"
        className="tr-range mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
