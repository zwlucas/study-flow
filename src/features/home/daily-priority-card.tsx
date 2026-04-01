"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

export function DailyPriorityCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="glass-surface premium-shadow relative h-full min-h-[188px] overflow-hidden rounded-3xl p-5 lg:col-span-3"
    >
      <div className="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[var(--primary)]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-8 text-6xl font-black text-white/[0.03]">
        SF
      </div>
      <span className="inline-flex rounded-full bg-[var(--accent-warm)]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
        Daily Priority
      </span>
      <p className="mt-3 text-sm text-zinc-400">Physics — Chapter 4</p>
      <h2 className="mt-1 max-w-lg text-2xl font-semibold leading-tight md:text-[2rem]">
        Quantum Mechanics &amp; Wave Function Analysis
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
        Revise equações de Schrödinger e a interpretação da função de onda antes da sessão de
        exercícios guiados.
      </p>
      <div className="mt-4 flex flex-wrap gap-6 text-sm">
        <span className="text-[var(--secondary)]">45m tempo estimado</span>
        <span className="text-[var(--primary)]">Alto nível de foco</span>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        className="btn-gradient-cta mt-4 flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/30"
      >
        <Play className="h-4 w-4 fill-current" />
        Iniciar modo foco
      </motion.button>
    </motion.section>
  );
}
