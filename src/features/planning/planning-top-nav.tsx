"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Settings } from "lucide-react";

const links = [
  { href: "/home", label: "Dashboard" },
  { href: "/planning", label: "Plano de estudos" },
  { href: "/progress", label: "Estatísticas" },
  { href: "#", label: "Materiais" },
  { href: "#", label: "Comunidade" },
];

export function PlanningTopNav() {
  const pathname = usePathname();

  return (
    <div className="glass-surface premium-shadow mb-6 flex flex-col gap-4 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-lg font-bold text-transparent">
        Study Flow
      </span>
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.label}
              href={l.href}
              className={`relative rounded-xl px-3 py-2 ${active ? "text-white" : "text-zinc-500"}`}
            >
              {active && (
                <motion.span
                  layoutId="planning-nav"
                  className="absolute inset-0 rounded-xl bg-white/10"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10">{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2">
        <button type="button" className="glass flex h-10 w-10 items-center justify-center rounded-xl">
          <Search className="h-4 w-4" />
        </button>
        <button type="button" className="glass flex h-10 w-10 items-center justify-center rounded-xl">
          <Settings className="h-4 w-4" />
        </button>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--secondary)] to-[var(--primary)]" />
      </div>
    </div>
  );
}
