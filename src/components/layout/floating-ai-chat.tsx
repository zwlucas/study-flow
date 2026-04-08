"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { Send, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";

type ChatMsg = { id: string; role: "user" | "assistant"; text: string };
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const STORAGE_KEY = "study-flow-ai-fab-position";

function fabRange(w: number, h: number, fabSize: number, margin: number) {
  const maxX = w - fabSize - margin;
  const maxY = h - fabSize - margin;
  const rangeX = maxX - margin;
  const rangeY = maxY - margin;
  return { rangeX, rangeY, maxX, maxY };
}

function positionFromNorm(xNorm: number, yNorm: number, fabSize: number, margin: number) {
  const w = typeof window !== "undefined" ? window.innerWidth : 0;
  const h = typeof window !== "undefined" ? window.innerHeight : 0;
  const { rangeX, rangeY } = fabRange(w, h, fabSize, margin);
  const nx = rangeX > 0 ? clamp(xNorm, 0, 1) : 0;
  const ny = rangeY > 0 ? clamp(yNorm, 0, 1) : 0;
  return {
    x: margin + nx * Math.max(0, rangeX),
    y: margin + ny * Math.max(0, rangeY),
  };
}

function normFromPosition(x: number, y: number, fabSize: number, margin: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const { rangeX, rangeY } = fabRange(w, h, fabSize, margin);
  return {
    xNorm: rangeX > 0 ? clamp((x - margin) / rangeX, 0, 1) : 0.5,
    yNorm: rangeY > 0 ? clamp((y - margin) / rangeY, 0, 1) : 0.5,
  };
}

export function FloatingAiChat() {
  const pathname = usePathname();
  const FAB_SIZE = 60;
  const FAB_MARGIN = 24;
  const PANEL_MAX_W = 380;
  const PANEL_MAX_H = 520;
  const PANEL_GAP = 6;
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Olá! Sou o assistente Study Flow. Pergunte sobre plano de estudos, foco ou revisão.",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const [fabPosition, setFabPosition] = useState({ x: 0, y: 0 });
  const [fabReady, setFabReady] = useState(false);
  const draggedRef = useRef(false);
  const [isDraggingFab, setIsDraggingFab] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [dragTilt, setDragTilt] = useState(0);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelSize, setPanelSize] = useState({ width: PANEL_MAX_W, height: PANEL_MAX_H });
  const fabX = useMotionValue(0);
  const fabY = useMotionValue(0);
  const springX = useSpring(fabX, { stiffness: 520, damping: 42, mass: 0.5 });
  const springY = useSpring(fabY, { stiffness: 520, damping: 42, mass: 0.5 });
  const lastViewportRef = useRef({ w: 0, h: 0 });

  const clampFabPosition = useCallback((x: number, y: number) => {
    const safeX = Number.isFinite(x) ? x : window.innerWidth - FAB_SIZE - FAB_MARGIN;
    const safeY = Number.isFinite(y) ? y : window.innerHeight - FAB_SIZE - FAB_MARGIN;
    const maxX = window.innerWidth - FAB_SIZE - FAB_MARGIN;
    const maxY = window.innerHeight - FAB_SIZE - FAB_MARGIN;
    return {
      x: Math.min(Math.max(FAB_MARGIN, safeX), Math.max(FAB_MARGIN, maxX)),
      y: Math.min(Math.max(FAB_MARGIN, safeY), Math.max(FAB_MARGIN, maxY)),
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setViewport({ w: vw, h: vh });
    lastViewportRef.current = { w: vw, h: vh };

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          xNorm?: unknown;
          yNorm?: unknown;
          x?: unknown;
          y?: unknown;
        };
        let next: { x: number; y: number };
        if (typeof parsed.xNorm === "number" && typeof parsed.yNorm === "number") {
          next = positionFromNorm(parsed.xNorm, parsed.yNorm, FAB_SIZE, FAB_MARGIN);
        } else if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const { xNorm, yNorm } = normFromPosition(parsed.x, parsed.y, FAB_SIZE, FAB_MARGIN);
          next = positionFromNorm(xNorm, yNorm, FAB_SIZE, FAB_MARGIN);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ xNorm, yNorm }));
        } else {
          next = clampFabPosition(vw - FAB_SIZE - FAB_MARGIN, vh - FAB_SIZE - FAB_MARGIN);
        }
        next = clampFabPosition(next.x, next.y);
        setFabPosition(next);
        fabX.set(next.x);
        fabY.set(next.y);
        setFabReady(true);
        return;
      } catch {
        /* ignore */
      }
    }
    const next = clampFabPosition(vw - FAB_SIZE - FAB_MARGIN, vh - FAB_SIZE - FAB_MARGIN);
    setFabPosition(next);
    fabX.set(next.x);
    fabY.set(next.y);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normFromPosition(next.x, next.y, FAB_SIZE, FAB_MARGIN)),
    );
    setFabReady(true);
  }, [clampFabPosition, fabX, fabY]);

  useEffect(() => {
    if (!fabReady || typeof window === "undefined") return;
    const onResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      const oldW = lastViewportRef.current.w || newW;
      const oldH = lastViewportRef.current.h || newH;

      setFabPosition((pos) => {
        const { rangeX: rxOld, rangeY: ryOld } = fabRange(oldW, oldH, FAB_SIZE, FAB_MARGIN);
        const xNorm = rxOld > 0 ? clamp((pos.x - FAB_MARGIN) / rxOld, 0, 1) : 1;
        const yNorm = ryOld > 0 ? clamp((pos.y - FAB_MARGIN) / ryOld, 0, 1) : 1;
        const next = positionFromNorm(xNorm, yNorm, FAB_SIZE, FAB_MARGIN);
        const clamped = clampFabPosition(next.x, next.y);
        fabX.set(clamped.x);
        fabY.set(clamped.y);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(normFromPosition(clamped.x, clamped.y, FAB_SIZE, FAB_MARGIN)),
        );
        return clamped;
      });

      lastViewportRef.current = { w: newW, h: newH };
      setViewport({ w: newW, h: newH });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampFabPosition, fabReady, fabX, fabY]);

  useEffect(() => {
    if (!fabReady || typeof window === "undefined") return;
    if (!Number.isFinite(fabPosition.x) || !Number.isFinite(fabPosition.y)) {
      const next = clampFabPosition(window.innerWidth - FAB_SIZE - FAB_MARGIN, window.innerHeight - FAB_SIZE - FAB_MARGIN);
      setFabPosition(next);
      fabX.set(next.x);
      fabY.set(next.y);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(normFromPosition(next.x, next.y, FAB_SIZE, FAB_MARGIN)),
      );
    }
  }, [clampFabPosition, fabPosition.x, fabPosition.y, fabReady, fabX, fabY]);

  useEffect(() => {
    if (!isDraggingFab || typeof window === "undefined") return;

    const onPointerMove = (event: PointerEvent) => {
      const next = clampFabPosition(
        event.clientX - dragOffsetRef.current.x,
        event.clientY - dragOffsetRef.current.y,
      );
      fabX.set(next.x);
      fabY.set(next.y);
      const dx = event.clientX - lastPointerRef.current.x;
      setDragTilt(clamp(dx * 0.35, -10, 10));
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      if (
        Math.abs(event.clientX - pointerStartRef.current.x) > 4 ||
        Math.abs(event.clientY - pointerStartRef.current.y) > 4
      ) {
        draggedRef.current = true;
      }
    };

    const onPointerUp = () => {
      setIsDraggingFab(false);
      setDragTilt(0);
      const next = clampFabPosition(fabX.get(), fabY.get());
      setFabPosition(next);
      fabX.set(next.x);
      fabY.set(next.y);
      lastViewportRef.current = { w: window.innerWidth, h: window.innerHeight };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(normFromPosition(next.x, next.y, FAB_SIZE, FAB_MARGIN)),
      );
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [clampFabPosition, fabPosition, fabX, fabY, isDraggingFab]);

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    const node = panelRef.current;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setPanelSize({ width: rect.width || PANEL_MAX_W, height: rect.height || PANEL_MAX_H });
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(node);
    return () => obs.disconnect();
  }, [open]);

  const panelPlacement = useMemo(() => {
    const anchorX = fabReady ? fabX.get() : fabPosition.x;
    const anchorY = fabReady ? fabY.get() : fabPosition.y;

    if (!viewport.w || !viewport.h) {
      return {
        left: FAB_MARGIN,
        top: FAB_MARGIN,
        width: PANEL_MAX_W,
        height: PANEL_MAX_H,
        maxHeight: PANEL_MAX_H,
      };
    }

    const width = Math.min(PANEL_MAX_W, viewport.w - FAB_MARGIN * 2);
    const maxHeight = Math.min(PANEL_MAX_H, Math.floor(viewport.h * 0.72));
    const height = Math.min(panelSize.height, maxHeight);
    const fabCenterX = anchorX + FAB_SIZE / 2;
    const fabCenterY = anchorY + FAB_SIZE / 2;

    const candidates = [
      {
        left: anchorX + FAB_SIZE + PANEL_GAP,
        top: anchorY + FAB_SIZE / 2 - height / 2,
      },
      {
        left: anchorX - width - PANEL_GAP,
        top: anchorY + FAB_SIZE / 2 - height / 2,
      },
      {
        left: anchorX + FAB_SIZE / 2 - width / 2,
        top: anchorY - height - PANEL_GAP,
      },
      {
        left: anchorX + FAB_SIZE / 2 - width / 2,
        top: anchorY + FAB_SIZE + PANEL_GAP,
      },
    ].map((c) => {
      const left = clamp(c.left, FAB_MARGIN, viewport.w - width - FAB_MARGIN);
      const top = clamp(c.top, FAB_MARGIN, viewport.h - height - FAB_MARGIN);

      const fabRect = {
        left: anchorX,
        right: anchorX + FAB_SIZE,
        top: anchorY,
        bottom: anchorY + FAB_SIZE,
      };
      const panelRect = {
        left,
        right: left + width,
        top,
        bottom: top + height,
      };

      const overlapX = Math.max(0, Math.min(fabRect.right, panelRect.right) - Math.max(fabRect.left, panelRect.left));
      const overlapY = Math.max(0, Math.min(fabRect.bottom, panelRect.bottom) - Math.max(fabRect.top, panelRect.top));
      const overlapArea = overlapX * overlapY;


      const gapX =
        panelRect.left > fabRect.right
          ? panelRect.left - fabRect.right
          : fabRect.left > panelRect.right
            ? fabRect.left - panelRect.right
            : 0;
      const gapY =
        panelRect.top > fabRect.bottom
          ? panelRect.top - fabRect.bottom
          : fabRect.top > panelRect.bottom
            ? fabRect.top - panelRect.bottom
            : 0;
      const gapDistance = Math.hypot(gapX, gapY);

      
      const score = overlapArea > 0 ? 1_000_000 + overlapArea : gapDistance;
      return { left, top, score };
    });

    const best = candidates.reduce((bestSoFar, current) =>
      current.score < bestSoFar.score ? current : bestSoFar,
    );

    return { left: best.left, top: best.top, width, height, maxHeight };
  }, [fabPosition.x, fabPosition.y, fabReady, fabX, fabY, panelSize.height, viewport.h, viewport.w]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    
    // Map current messages to Gemini history format (excluding the first welcome message if we want, or map it too)
    // The history needs to have { role: "user" | "model", parts: [{ text: string }] }
    // Note: Our local state has role "assistant", but Gemini expects "model"
    const history = messages
      .filter(m => m.id !== "welcome") // Optional: Skip the local hardcoded welcome message to save tokens
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    
    try {
      const res = await api.post("/ai/chat", { 
        message: text,
        history: history 
      });
      const data = res.data;
      
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.reply ?? "Sem resposta.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Não consegui conectar ao assistente. Verifique se o servidor está rodando.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (pathname === "/ai") return null;

  return (
    <>
      {/* Backdrop — não cobre o FAB */}
      <AnimatePresence>
        {open ? (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-150 bg-black/40 backdrop-blur-[2px]"
            aria-label="Fechar chat"
            onClick={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      {/* Painel compacto */}
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Chat com IA"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            style={{
              left: panelPlacement.left,
              top: panelPlacement.top,
              width: panelPlacement.width,
              maxHeight: panelPlacement.maxHeight,
            }}
            className="glass-surface premium-shadow fixed z-160 flex flex-col overflow-hidden rounded-3xl border border-white/12 shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--primary)/25 text-(--primary)">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">IA Study Flow</p>
                  <p className="text-[11px] text-zinc-500">Sugestões rápidas de estudo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div
              ref={listRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[88%] rounded-2xl rounded-br-sm bg-(--primary) px-4 py-2.5 text-sm text-white shadow-lg shadow-(--primary)/20">
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    </div>
                  ) : (
                    <div className="flex max-w-[92%] gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-(--primary)/25 text-(--primary) mt-1">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 overflow-x-auto rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 prose prose-invert prose-sm prose-p:leading-relaxed prose-pre:my-0 prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading ? (
                <p className="text-xs text-zinc-500">Pensando…</p>
              ) : null}
            </div>

            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/30 px-2 py-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Mensagem…"
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--primary) text-white shadow-lg shadow-(--primary)/30 disabled:opacity-40"
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* FAB — fixo na viewport, independente da rolagem da sessão */}
      <motion.button
        type="button"
        animate={{
          scale: open ? 0.88 : isDraggingFab ? 1.08 : 1,
          rotate: open ? 0 : dragTilt,
          boxShadow: isDraggingFab
            ? "0 0 44px rgba(123,97,255,0.55)"
            : open
              ? "0 0 20px rgba(123,97,255,0.30)"
              : "0 0 28px rgba(123,97,255,0.38)",
        }}
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.55 }}
        whileHover={{ scale: isDraggingFab ? 1.08 : 1.06 }}
        whileTap={{ scale: 0.96 }}
        onPointerDown={(event) => {
          if (open) return;
          draggedRef.current = false;
          setIsDraggingFab(true);
          pointerStartRef.current = { x: event.clientX, y: event.clientY };
          lastPointerRef.current = { x: event.clientX, y: event.clientY };
          dragOffsetRef.current = {
            x: event.clientX - fabPosition.x,
            y: event.clientY - fabPosition.y,
          };
        }}
        onClick={() => {
          if (draggedRef.current) return;
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        style={
          fabReady && Number.isFinite(fabPosition.x) && Number.isFinite(fabPosition.y)
            ? { left: springX, top: springY }
            : { right: FAB_MARGIN, bottom: FAB_MARGIN }
        }
        className={`fixed z-170 isolate flex h-15 w-15 items-center justify-center overflow-hidden rounded-full border-0 bg-white/7 text-white backdrop-blur-xl ${open ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
        aria-label={open ? "Fechar assistente IA" : "Abrir assistente IA"}
      >
        <motion.span
          className={`pointer-events-none absolute inset-[4px] ${
            open ? "flow-orb-liquid-ring-intense" : "flow-orb-liquid-ring-calm"
          }`}
          animate={{ opacity: open ? 1 : 0.88, scale: open ? 1.04 : 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        />
        <motion.span
          className={`pointer-events-none absolute inset-[7px] ${
            open ? "flow-orb-liquid-ring-delayed-intense" : "flow-orb-liquid-ring-delayed-calm"
          }`}
          animate={{ opacity: open ? 0.94 : 0.74, scale: open ? 1.02 : 1 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
        />
        <span
          className={`pointer-events-none absolute inset-[4px] ${
            open ? "flow-orb-shimmer-cap flow-orb-shimmer-cap-intense" : "flow-orb-shimmer-cap flow-orb-shimmer-cap-calm"
          }`}
          aria-hidden
        />
        <span
          className={`pointer-events-none absolute inset-[6px] flow-orb-shimmer-cap flow-orb-shimmer-cap-delay ${
            open ? "opacity-50" : "opacity-30"
          }`}
          aria-hidden
        />
        <motion.span
          className={`pointer-events-none absolute inset-[10px] ${
            open ? "flow-orb-core-intense" : "flow-orb-core-calm"
          }`}
          animate={{ opacity: open ? 1 : 0.86, scale: open ? 1.06 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
        />
        <motion.span
          className="relative flex h-8 w-8 items-center justify-center"
          animate={{
            scale: open ? [1, 1.06, 1] : [1, 1.03, 1],
            rotate: open ? [0, -4, 0] : [0, 2, 0],
          }}
          transition={{
            duration: open ? 2.8 : 4.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="h-7 w-7 stroke-[1.5] text-white drop-shadow-[0_0_8px_rgba(200,220,255,0.55)]" stroke="currentColor" />
        </motion.span>
      </motion.button>
    </>
  );
}
