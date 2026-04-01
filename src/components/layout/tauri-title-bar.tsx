"use client";

import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Copy, Minus, Square, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

function WinControlButton({
  onClick,
  label,
  className,
  children,
}: {
  onClick: () => void;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-9 w-[46px] shrink-0 items-center justify-center text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function TauriTitleBar() {
  const [mounted, setMounted] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const refreshMaximized = useCallback(async () => {
    if (!isTauri()) return;
    try {
      const w = getCurrentWindow();
      setMaximized(await w.isMaximized());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    void refreshMaximized();
  }, [refreshMaximized]);

  const minimize = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch {
      /* ignore */
    }
  };

  const toggleMax = async () => {
    try {
      const w = getCurrentWindow();
      await w.toggleMaximize();
      await refreshMaximized();
    } catch {
      /* ignore */
    }
  };

  const close = async () => {
    try {
      await getCurrentWindow().close();
    } catch {
      /* ignore */
    }
  };

  if (!mounted || !isTauri()) return null;

  return (
    <header className="glass-surface shrink-0 select-none border-x-0 border-t-0 border-b border-white/10 text-foreground">
      <div className="flex h-9 items-stretch">
        <div
          className="flex min-w-0 flex-1 items-center gap-2.5 pl-3"
          data-tauri-drag-region
          data-tauri-drag-region-titlebar
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-(--accent-warm) to-(--primary) text-[8px] font-bold leading-none text-white shadow-sm">
            SF
          </span>
          <span className="truncate text-[13px] font-medium tracking-tight text-zinc-200">Study Flow</span>
        </div>
        <div className="flex shrink-0 items-stretch">
          <WinControlButton onClick={minimize} label="Minimizar">
            <Minus className="h-3.5 w-3.5" strokeWidth={1.25} />
          </WinControlButton>
          <WinControlButton onClick={toggleMax} label={maximized ? "Restaurar" : "Maximizar"}>
            {maximized ? (
              <Copy className="h-3 w-3" strokeWidth={1.25} />
            ) : (
              <Square className="h-3 w-3" strokeWidth={1.25} />
            )}
          </WinControlButton>
          <WinControlButton
            onClick={close}
            label="Fechar"
            className="hover:bg-[#c42b1c] hover:text-white"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.25} />
          </WinControlButton>
        </div>
      </div>
    </header>
  );
}
