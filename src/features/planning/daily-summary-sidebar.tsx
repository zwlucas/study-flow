"use client";

import { motion } from "framer-motion";
import { BookOpen, Calculator, MoreHorizontal, Trophy, Zap } from "lucide-react";

const sessions = [
  { time: "14:00", title: "Cálculo I", meta: "45 min • Alta prioridade", borderColor: "#7b61ff" },
  { time: "15:00", title: "Revisão flashcards", meta: "20 min • Memória", borderColor: "#ff9500" },
  { time: "16:30", title: "Leitura — Física", meta: "60 min • Teoria", borderColor: "#30d158" },
];

const todayTasks = [
  { title: "Revisar derivadas", time: "14:00 – 15:30", icon: Calculator, accent: "text-[var(--primary)]" },
  { title: "Aula de vetores", time: "15:45 – 17:00", icon: Zap, accent: "text-[var(--secondary)]" },
  { title: "Exercícios práticos", time: "17:15 – 18:30", icon: BookOpen, accent: "text-[var(--accent-warm)]" },
  { title: "Resumo semanal", time: "19:00 – 19:45", icon: Trophy, accent: "text-[var(--accent-gold)]" },
];

function FocusRing({ value }: { value: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <div className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center">
      <svg className="-rotate-90" width="92" height="92" viewBox="0 0 92 92" aria-hidden>
        <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          stroke="url(#planning-focus-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="planning-focus-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-center text-lg font-bold text-white">{value}%</span>
    </div>
  );
}

export function DailySummarySidebar() {
  return (
    <aside className="flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-surface premium-shadow rounded-3xl p-5"
      >
        <p className="text-xs uppercase tracking-wider text-zinc-500">Resumo diário</p>
        <p className="mt-1 text-lg font-semibold text-white">Terça, 27 de março</p>
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-white/[0.04] px-3 py-3">
          <FocusRing value={85} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">Foco semanal</p>
            <p className="mt-0.5 text-xs text-zinc-500">Consistência nas últimas 7 sessões</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--accent-gold)]" />
            <span className="text-sm text-zinc-300">Tópicos vencidos</span>
          </div>
          <span className="text-sm font-bold text-white">12</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-surface premium-shadow rounded-3xl p-5"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-white">Hoje</h3>
          <button
            type="button"
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
            aria-label="Mais opções"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-4 space-y-2.5">
          {todayTasks.map((t) => {
            const Icon = t.icon;
            return (
              <li
                key={t.title}
                className="flex items-center gap-3 rounded-xl border border-white/6 bg-black/20 px-3 py-2.5"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ${t.accent}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{t.title}</p>
                  <p className="text-[11px] text-zinc-500">{t.time}</p>
                </div>
                <button
                  type="button"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 transition hover:border-white/40 hover:bg-white/5"
                  aria-label={`Concluir ${t.title}`}
                />
              </li>
            );
          })}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-surface premium-shadow flex-1 rounded-3xl p-5"
      >
        <h3 className="font-semibold uppercase tracking-wide text-zinc-400">Próximas sessões</h3>
        <ul className="mt-4 space-y-3">
          {sessions.map((s) => (
            <li
              key={s.title}
              className="rounded-xl border border-white/5 border-l-4 bg-black/20 py-3 pl-3 pr-3"
              style={{ borderLeftColor: s.borderColor }}
            >
              <p className="text-xs text-[var(--secondary)]">{s.time}</p>
              <p className="text-sm font-medium text-white">{s.title}</p>
              <p className="text-xs text-zinc-500">{s.meta}</p>
            </li>
          ))}
        </ul>
      </motion.div>
    </aside>
  );
}
