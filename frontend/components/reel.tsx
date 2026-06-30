"use client";

import { motion } from "framer-motion";

export function Reel({ spin, active }: { spin: "left" | "right"; active: boolean }) {
  return (
    <div className="relative aspect-square rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 sm:p-4">
      <motion.div
        aria-hidden
        animate={{ rotate: active ? (spin === "left" ? -360 : 360) : 0 }}
        transition={{ duration: 9, repeat: active ? Infinity : 0, ease: "linear" }}
        className="relative h-full w-full rounded-full border border-ink-200 bg-[rgb(var(--paper-200))]"
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="absolute left-1/2 top-1/2 h-2.5 w-[38%] origin-left rounded-full bg-ink-300/45"
            style={{ transform: `rotate(${index * 120}deg) translateX(0.45rem)` }}
          />
        ))}
        <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-700" />
      </motion.div>
    </div>
  );
}
