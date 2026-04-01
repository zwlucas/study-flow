"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { mainNav } from "@/lib/navigation";
import { ChevronsLeft, ChevronsRight, Settings } from "lucide-react";
import { useEffect, useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("studyflow.sidebar.collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("studyflow.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  };

  return (
    <aside
      className={`glass-surface premium-shadow flex h-full min-h-0 shrink-0 flex-col rounded-3xl p-4 transition-[width] duration-200 ${collapsed ? "w-[88px]" : "w-[260px]"}`}
    >
      <div className="mb-8 flex items-center justify-between px-2">
        <Link href="/home" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-warm)] to-[var(--primary)] text-sm font-bold text-white shadow-lg shadow-[var(--primary)]/30">
          SF
        </span>
          {!collapsed ? <span className="text-lg font-semibold tracking-tight">StudyFlow</span> : null}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className="rounded-lg p-1 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {mainNav.map((item) => {
          const active = pathname === item.href || (item.href === "/home" && pathname === "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center rounded-2xl py-2.5 text-sm transition-colors ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl bg-[var(--primary)]/25"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <Icon
                className={`relative z-10 h-[18px] w-[18px] ${active ? "text-white" : "text-zinc-500"}`}
              />
              {!collapsed ? (
                <span
                  className={`relative z-10 font-medium ${active ? "text-white" : "text-zinc-400"}`}
                >
                  {item.label}
                </span>
              ) : (
                <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-30 -translate-y-1/2 rounded-md border border-white/10 bg-black/80 px-2 py-1 text-xs whitespace-nowrap text-zinc-200 opacity-0 transition group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
        <button
          type="button"
          className={`flex w-full items-center rounded-2xl py-2 text-sm text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300 ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
        >
          <Settings className="h-[18px] w-[18px]" />
          {!collapsed ? "Configurações" : null}
        </button>
        <div className={`glass flex rounded-2xl p-3 ${collapsed ? "justify-center" : "items-center gap-3"}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--primary)]/50 text-xs font-semibold">
            AM
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Alex Morgan</p>
              <span className="inline-flex rounded-full bg-[var(--primary)]/20 px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                Pro Member
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
