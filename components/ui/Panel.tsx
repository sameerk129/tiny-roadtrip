"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function Panel({ children, className = "", delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={
        "rounded-xl border border-white/10 bg-black/35 backdrop-blur-md " +
        "shadow-glow px-3 py-2.5 " +
        className
      }
    >
      {children}
    </motion.div>
  );
}
