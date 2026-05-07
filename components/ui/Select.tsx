"use client";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}

export default function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">
        {label}
      </div>
      <div className="mt-1 relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full appearance-none bg-white/5 hover:bg-white/10 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-white/30 transition"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink">
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
