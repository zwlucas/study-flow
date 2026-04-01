"use client";

import { motion } from "framer-motion";
import { FileText, Music, Plus, Timer } from "lucide-react";

const actions = [
  { label: "New Task", icon: Plus, color: "text-[#ff6b6b]" },
  { label: "Pomodoro", icon: Timer, color: "text-[var(--secondary)]" },
  { label: "Lofi Mix", icon: Music, color: "text-[var(--accent-gold)]" },
  { label: "Notes", icon: FileText, color: "text-orange-400" },
];

export function QuickActions() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-surface premium-shadow rounded-3xl p-3.5"
    >
      <div className="grid grid-cols-2 gap-3.5">
        {actions.map((a) => (
          <motion.button
            key={a.label}
            type="button"
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex aspect-square w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(123,97,255,0.12),transparent_55%),linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-2 transition hover:border-white/15 hover:brightness-110"
          >
            <a.icon className={`h-[18px] w-[18px] ${a.color}`} />
            <span className="text-[11px] font-semibold tracking-tight text-zinc-200">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
