"use client";

import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Clock } from "lucide-react";

const items = [
  { icon: Clock, title: "Horário ideal", desc: "Comece às 10:00 para máxima retenção." },
  { icon: BookOpen, title: "Revisão sugerida", desc: "Álgebra linear — flashcards pendentes." },
];

export function AiInsightsWidget() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-surface premium-shadow rounded-3xl p-5"
    >
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <span>✨</span> AI Insights
      </h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/25 px-3 py-2.5"
          >
            <div className="flex min-w-0 items-start gap-3">
              <item.icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[var(--secondary)]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="truncate text-[11px] text-zinc-400">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
