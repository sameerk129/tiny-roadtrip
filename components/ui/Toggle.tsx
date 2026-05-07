"use client";

interface Props {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function Toggle({ label, active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] rounded-md border transition " +
        (active
          ? "bg-white/15 border-white/40 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)]"
          : "border-white/10 text-white/55 hover:text-white/85 hover:border-white/20")
      }
    >
      {label}
    </button>
  );
}
