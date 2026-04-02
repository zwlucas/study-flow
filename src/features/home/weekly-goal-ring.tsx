"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

const pct = 75;
const circumference = 2 * Math.PI * 52;
const offset = circumference - (pct / 100) * circumference;

export function WeeklyGoalRing() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-surface premium-shadow relative h-full min-h-[188px] rounded-3xl p-5 xl:col-span-1"
    >
      <Flame className="absolute right-5 top-5 h-5 w-5 text-[var(--accent-warm)]" />
      <div className="flex flex-col items-center">
        <div className="relative h-36 w-36">
          <svg className="-rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="10"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--secondary)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{pct}%</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Completo</span>
          </div>
        </div>
        <p className="mt-2 text-center text-sm text-zinc-400">24,5h tempo total de estudo</p>
      </div>
    </motion.section>
  );
}
