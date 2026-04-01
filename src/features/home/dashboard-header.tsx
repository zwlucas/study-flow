"use client";

import { motion } from "framer-motion";
import { Bell, Plus, Search } from "lucide-react";

export function DashboardHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Bom dia, Alex! <span className="inline-block">☀️</span>
        </h1>
        <p className="mt-1 max-w-xl text-sm text-zinc-400">
          Pronto para entrar em fluxo? Seu cérebro está aquecido para foco profundo hoje.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="glass flex h-11 w-11 items-center justify-center rounded-xl text-zinc-300 transition hover:bg-white/15"
          aria-label="Buscar"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          className="glass flex h-11 w-11 items-center justify-center rounded-xl text-zinc-300 transition hover:bg-white/15"
          aria-label="Notificações"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/35 transition hover:opacity-95"
          aria-label="Adicionar"
        >
          <Plus className="h-[18px] w-[18px]" />
        </button>
      </div>
    </motion.header>
  );
}
