"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Search, Target } from "lucide-react";

const bars = [28, 45, 62, 38, 72, 55, 48, 80, 65, 42, 58, 35, 22, 18, 12, 8, 5];

import { api } from "@/lib/api";

type AnalyticsData = {
  totalFocusMinutes: number;
  sessionsCompleted: number;
  currentStreak: number;
  dailyFocus: { date: string; minutes: number }[];
};

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    api.get("/progress/analytics").then((res: any) => {
      setData(res.data.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="skeleton-shimmer h-8 w-44 rounded-lg" />
            <div className="skeleton-shimmer h-4 w-72 rounded-lg" />
          </div>
          <div className="skeleton-shimmer h-10 w-56 rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-surface premium-shadow rounded-3xl p-5">
              <div className="skeleton-shimmer h-8 w-8 rounded-lg" />
              <div className="skeleton-shimmer mt-4 h-8 w-24 rounded-lg" />
              <div className="skeleton-shimmer mt-2 h-4 w-28 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <section className="glass-surface premium-shadow rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div className="skeleton-shimmer h-6 w-48 rounded-lg" />
              <div className="skeleton-shimmer h-8 w-24 rounded-lg" />
            </div>
            <div className="mt-6 grid h-48 grid-cols-12 items-end gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-shimmer rounded-t-md"
                  style={{ height: `${30 + (i % 6) * 12}%` }}
                />
              ))}
            </div>
          </section>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <section key={i} className="glass-surface premium-shadow rounded-3xl p-5">
                <div className="skeleton-shimmer h-5 w-28 rounded-lg" />
                <div className="skeleton-shimmer mt-3 h-4 w-36 rounded-lg" />
                <div className="skeleton-shimmer mt-2 h-4 w-24 rounded-lg" />
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Estatísticas</h1>
          <p className="mt-1 text-[var(--muted)]">Acompanhe sua jornada e melhore o foco.</p>
        </div>
        <div className="flex gap-2">
          <div className="glass flex flex-1 items-center gap-2 rounded-2xl px-4 py-2 sm:min-w-[200px]">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              type="search"
              placeholder="Buscar..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
            />
          </div>
          <button type="button" className="glass flex h-10 w-10 items-center justify-center rounded-xl">
            <span className="text-lg">⚙</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Tempo total (h)",
            value: data ? (data.totalFocusMinutes / 60).toFixed(1) + "h" : "0h",
            icon: Clock,
            trend: "",
            trendUp: true,
            accent: "text-[var(--primary)]",
          },
          {
            label: "Sessões feitas",
            value: data ? String(data.sessionsCompleted) : "0",
            icon: CheckCircle2,
            trend: "",
            trendUp: true,
            accent: "text-[var(--success)]",
          },
          {
            label: "Focus score",
            value: "85%",
            icon: Target,
            trend: "+5%",
            trendUp: true,
            accent: "text-[var(--accent-warm)]",
          },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-surface premium-shadow rounded-3xl p-5"
          >
            <div className="flex items-start justify-between">
              <c.icon className={`h-8 w-8 ${c.accent}`} />
              <span
                className={`text-xs font-semibold ${c.trendUp ? "text-[var(--success)]" : "text-red-400"}`}
              >
                {c.trend}
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold">{c.value}</p>
            <p className="text-sm text-zinc-500">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface premium-shadow rounded-3xl p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Distribuição de sessões</h2>
            <div className="flex gap-1 rounded-xl bg-black/30 p-1 text-xs">
              {["Dia", "Semana", "Mês"].map((t, j) => (
                <button
                  key={t}
                  type="button"
                  className={`rounded-lg px-3 py-1.5 ${j === 1 ? "bg-[var(--primary)] text-white" : "text-zinc-500"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex h-48 items-end justify-between gap-1 border-b border-white/10 pb-1">
            {data?.dailyFocus.slice(-17).map((day, i) => {
              const maxMin = Math.max(1, ...data.dailyFocus.map(d => d.minutes));
              const heightPct = Math.max(5, (day.minutes / maxMin) * 100);
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ delay: i * 0.02, duration: 0.4 }}
                  className="min-h-[4px] flex-1 rounded-t-md bg-gradient-to-t from-[var(--primary)]/40 to-[var(--secondary)]/70"
                  title={`${day.date}: ${day.minutes} min`}
                />
              )
            }) || bars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.02, duration: 0.4 }}
                className="min-h-[4px] flex-1 rounded-t-md bg-gradient-to-t from-[var(--primary)]/40 to-[var(--secondary)]/70"
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
            <span>06</span>
            <span>22</span>
          </div>
        </motion.section>

        <div className="space-y-4">
          <motion.section
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-surface premium-shadow rounded-3xl p-5"
          >
            <h3 className="font-semibold">Nível 12</h3>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative h-16 w-16">
                <svg className="-rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeDasharray="94"
                    strokeDashoffset="28"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">12</span>
              </div>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[70%] rounded-full bg-[var(--primary)]" />
                </div>
                <p className="mt-1 text-xs text-[var(--success)]">+450 XP hoje</p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-surface premium-shadow rounded-3xl p-5"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-sm font-semibold">{data?.currentStreak || 0} dias de streak</p>
                <p className="text-xs text-zinc-500">Continue firme!</p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-surface premium-shadow relative overflow-hidden rounded-3xl p-5"
          >
            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[var(--primary)]/30 blur-2xl" />
            <div className="relative">
              <div className="mx-auto mb-3 h-20 w-20 rounded-full bg-gradient-to-br from-[var(--primary)] via-violet-600 to-indigo-900 shadow-[0_0_40px_rgba(123,97,255,0.5)]" />
              <p className="text-center text-sm text-zinc-300">
                Você está indo muito bem! Seu focus score está <strong className="text-white">5%</strong> acima de
                ontem.
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded-xl bg-white/10 py-2 text-sm font-medium transition hover:bg-white/15"
              >
                Fazer uma pergunta
              </button>
            </div>
          </motion.section>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface premium-shadow rounded-3xl p-6"
        >
          <h3 className="font-semibold">Sessões recentes</h3>
          <ul className="mt-4 space-y-3">
            <li className="flex justify-between rounded-2xl bg-white/5 px-4 py-3">
              <div>
                <p className="font-medium">Matemática avançada</p>
                <p className="text-xs text-zinc-500">Modo foco profundo</p>
              </div>
              <span className="text-sm text-[var(--secondary)]">2h 15m</span>
            </li>
            <li className="flex justify-between rounded-2xl bg-white/5 px-4 py-3">
              <div>
                <p className="font-medium">Literatura inglesa</p>
                <p className="text-xs text-zinc-500">Revisão flashcards</p>
              </div>
              <span className="text-sm text-[var(--secondary)]">45m</span>
            </li>
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-surface premium-shadow rounded-3xl p-6"
        >
          <h3 className="font-semibold">Horário mais produtivo</h3>
          <p className="mt-4 text-4xl font-bold text-white">10:00</p>
          <p className="text-sm text-zinc-500">Maior eficiência registrada</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[88%] rounded-full bg-[var(--success)]" />
          </div>
          <p className="mt-2 text-xs text-[var(--success)]">Alta eficiência</p>
        </motion.section>
      </div>
    </div>
  );
}
