"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";

export function FocusQualityGauge() {
  const score = 92;
  const arc = Math.PI * 45;
  const dash = (score / 100) * arc;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-surface premium-shadow relative rounded-3xl p-5"
    >
      <Brain className="absolute right-5 top-5 h-5 w-5 text-[var(--primary)]" />
      <h3 className="text-sm font-semibold">Focus Quality</h3>
      <div className="relative mx-auto mt-3 flex h-[136px] flex-col items-center justify-end">
        <svg width="200" height="100" viewBox="0 0 200 100" className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-gold)" />
              <stop offset="100%" stopColor="var(--accent-warm)" />
            </linearGradient>
          </defs>
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <motion.path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${arc}`}
            initial={{ strokeDasharray: `0 ${arc}` }}
            animate={{ strokeDasharray: `${dash} ${arc}` }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute bottom-1 text-4xl font-bold">{score}</div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-sm font-semibold">Deep Work</p>
        <p className="text-xs text-zinc-400">Top 5% dos usuários</p>
      </div>
    </motion.section>
  );
}
