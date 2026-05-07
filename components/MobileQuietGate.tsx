"use client";

// Soft full-viewport interlude: this experience is intended for desktop.
// Pure aesthetic — no alarm copy, no icons, only tone and type.

import { motion } from "framer-motion";

export default function MobileQuietGate() {
  return (
    <div
      className="fixed inset-0 z-[100] min-h-[100dvh] overflow-y-auto font-mono grain"
      aria-live="polite"
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#120818] via-[#1f0f28] to-[#2a1840]"
        aria-hidden
      />
      <div
        className="absolute bottom-[38%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,126,209,0.25)] to-transparent"
        aria-hidden
      />
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-10 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[19rem] space-y-8"
        >
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#e7e2d3]/35">
            tiny procedural roadtrip
          </p>
          <p className="text-[15px] font-light leading-[1.65] tracking-[0.04em] text-[#e7e2d3]/78">
            This stretch of road was laid for a wider horizon than your phone
            can hold.
          </p>
          <div className="mx-auto h-px w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <p className="text-[11px] leading-relaxed tracking-[0.22em] text-[#e7e2d3]/45">
            Open on desktop when the sky has room to breathe.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
