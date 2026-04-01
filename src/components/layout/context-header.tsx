"use client";

import { motion } from "framer-motion";
import { Download, Play, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const config = {
  "/flow": {
    title: "Flow Space",
    subtitle: "Controle sua sessão profunda com ritmo e consistência.",
    action: "Iniciar bloco",
    icon: Play,
  },
  "/progress": {
    title: "Progress",
    subtitle: "Acompanhe evolução, consistência e qualidade de execução.",
    action: "Exportar relatório",
    icon: Download,
  },
} as const;

export function ContextHeader() {
  const pathname = usePathname();
  if (pathname === "/flow" || pathname === "/planning") return null;
  const item = config[pathname as keyof typeof config];

  if (!item) return null;

  const hasCta = "action" in item && "icon" in item;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-surface premium-shadow mb-5 flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{item.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{item.subtitle}</p>
      </div>
      {hasCta ? (
        <button
          type="button"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-(--primary)/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--primary)/30 sm:self-center"
        >
          {(() => {
            const ActionIcon = item.icon;
            return <ActionIcon className="h-4 w-4" />;
          })()}
          {item.action}
          <Sparkles className="h-3.5 w-3.5 text-(--accent-gold)" />
        </button>
      ) : null}
    </motion.header>
  );
}
