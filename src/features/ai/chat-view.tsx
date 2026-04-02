"use client";

import { motion } from "framer-motion";
import { Bell, Grid3X3, Mic, Plus, Search, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatView() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
      <div className="flex min-h-[calc(100vh-8rem)] flex-col rounded-3xl border border-white/5 bg-black/20">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 p-5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Chat IA</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--success)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--success)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              Online
            </span>
          </div>
          <div className="flex gap-2">
            <button type="button" className="glass flex h-10 w-10 items-center justify-center rounded-xl">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" className="glass flex h-10 w-10 items-center justify-center rounded-xl">
              <Bell className="h-4 w-4" />
            </button>
            <button type="button" className="glass flex h-10 w-10 items-center justify-center rounded-xl">
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[var(--primary)] px-4 py-3 text-sm shadow-lg shadow-[var(--primary)]/20"
          >
            Preciso de um plano de estudo para a Era Vargas esta semana.
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex max-w-[92%] gap-2.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/25 text-[var(--primary)] mt-1">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 overflow-x-auto rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 prose prose-invert prose-sm prose-p:leading-relaxed prose-pre:my-0 prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10">
              <div className="rounded-xl border border-white/10 bg-[var(--surface)]/80 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="m-0 font-semibold text-white">Plano de estudo: Era Vargas</h3>
                  <span className="rounded-full bg-[var(--accent-gold)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-gold)]">
                    Alta prioridade
                  </span>
                </div>
                <ul className="mt-3 space-y-2 text-zinc-400 list-none pl-0">
                  <li>✓ Leitura teórica (30 min)</li>
                  <li>✓ Mapa mental (40 min)</li>
                  <li>○ Questões (50 min)</li>
                </ul>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[35%] rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" />
                </div>
                <p className="mt-1 text-right text-xs text-zinc-500 m-0">35% completo</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white">
                  Criar plano
                </button>
                <button type="button" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white">
                  Resumir
                </button>
                <button type="button" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white">
                  Explicar
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-white/5 p-4">
          <div className="glass flex items-center gap-2 rounded-full px-3 py-2">
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <Plus className="h-4 w-4" />
            </button>
            <input
              type="text"
              placeholder="Digite sua mensagem para o Study Flow..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
            />
            <button type="button" className="flex h-9 w-9 items-center justify-center text-zinc-400">
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-600">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>

      <motion.aside
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-surface premium-shadow h-fit rounded-3xl p-6"
      >
        <h3 className="text-center font-semibold">Assistente ativo</h3>
        <div className="relative mx-auto mt-4 h-36 w-36">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--accent-gold)] via-[var(--accent-warm)] to-orange-600 opacity-90 shadow-[0_0_48px_rgba(255,149,0,0.45)] pulse-glow" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <p className="mt-4 text-center text-sm text-zinc-400">
          Analisando seu desempenho e sugerindo otimizações em tempo real.
        </p>
      </motion.aside>
    </div>
  );
}
