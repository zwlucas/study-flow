"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { motion, useMotionValue } from "framer-motion";
import {
  Atom,
  Bell,
  BookOpen,
  Cpu,
  FlaskConical,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Sigma,
} from "lucide-react";

import { api } from "@/lib/api";

const ICONS_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Atom,
  BookOpen,
  Cpu,
  FlaskConical,
  Sigma,
};

const CARD_W = 220;
const CARD_H = 172;

type NodeItem = {
  id: string;
  title: string;
  sub: string;
  status: string;
  statusClass: string;
  progress: number;
  icon: ComponentType<{ className?: string }>;
  iconWrap: string;
  meta: string;
  current?: boolean;
  blocked?: boolean;
};

function edgeKey(a: string, b: string) {
  return a < b ? `${a}--${b}` : `${b}--${a}`;
}

/** Evita ambiguidade se um id contiver "--" (não é o caso hoje, mas fica explícito). */
function parseEdgeKey(k: string): [string, string] | null {
  const i = k.indexOf("--");
  if (i <= 0 || i === k.length - 2) return null;
  return [k.slice(0, i), k.slice(i + 2)];
}

function cubicPathBetween(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const bend = Math.min(110, Math.max(32, dist * 0.3));
  const cx1 = x1 + dx * 0.42 + nx * bend;
  const cy1 = y1 + dy * 0.42 + ny * bend;
  const cx2 = x1 + dx * 0.58 + nx * bend * 0.4;
  const cy2 = y1 + dy * 0.58 + ny * bend * 0.4;
  return `M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`;
}

const GEOM_EPS = 1e-5;

/**
 * Ponto na borda do retângulo do card onde a conexão deve sair/chegar,
 * seguindo do centro do card em direção ao outro ponto (evita linha no meio do card).
 */
function exitRectToward(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  cx: number,
  cy: number,
  tx: number,
  ty: number,
): { x: number; y: number } {
  const dx = tx - cx;
  const dy = ty - cy;
  const len = Math.hypot(dx, dy);
  if (len < GEOM_EPS) return { x: cx, y: cy };
  const dirx = dx / len;
  const diry = dy / len;
  const left = rx;
  const right = rx + rw;
  const top = ry;
  const bottom = ry + rh;
  let bestT = Infinity;

  const consider = (t: number) => {
    if (t <= GEOM_EPS) return;
    const x = cx + t * dirx;
    const y = cy + t * diry;
    if (x < left - 1e-3 || x > right + 1e-3 || y < top - 1e-3 || y > bottom + 1e-3) return;
    if (t < bestT) bestT = t;
  };

  if (Math.abs(dirx) > GEOM_EPS) {
    consider((left - cx) / dirx);
    consider((right - cx) / dirx);
  }
  if (Math.abs(diry) > GEOM_EPS) {
    consider((top - cy) / diry);
    consider((bottom - cy) / diry);
  }

  if (bestT === Infinity) return { x: cx, y: cy };
  return { x: cx + bestT * dirx, y: cy + bestT * diry };
}

type DraggableStudyCardProps = {
  n: NodeItem;
  index: number;
  position: { x: number; y: number };
  zoom: number;
  selected: boolean;
  onLinkTap: (id: string) => void;
  onDragCommit: (id: string, dx: number, dy: number) => void;
  /** Offset em espaço do mapa (já dividido pelo zoom) para redesenhar arestas durante o arrasto. */
  onDragOffset?: (id: string, dx: number, dy: number) => void;
  onDragOffsetClear?: (id: string) => void;
};

function DraggableStudyCard({
  n,
  index: i,
  position: pos,
  zoom,
  selected,
  onLinkTap,
  onDragCommit,
  onDragOffset,
  onDragOffsetClear,
}: DraggableStudyCardProps) {
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [justReleased, setJustReleased] = useState(false);
  const landTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = n.icon;
  const pct = Math.round(n.progress * 100);
  const z = zoom > 0 ? zoom : 1;

  useEffect(() => {
    return () => {
      if (landTimerRef.current) clearTimeout(landTimerRef.current);
    };
  }, []);

  const flashLanded = () => {
    setJustReleased(true);
    if (landTimerRef.current) clearTimeout(landTimerRef.current);
    landTimerRef.current = setTimeout(() => setJustReleased(false), 620);
  };

  const outerShadow =
    isDragging
      ? "0 28px 64px rgba(0,0,0,0.55), 0 0 0 2px rgba(90,200,250,0.55), 0 0 48px rgba(90,200,250,0.2)"
      : justReleased
        ? "0 20px 52px rgba(0,0,0,0.45), 0 0 0 2px rgba(90,200,250,0.4), 0 0 36px rgba(90,200,250,0.18)"
        : selected
          ? "0 16px 48px rgba(0,0,0,0.42), 0 0 0 2px rgba(123,97,255,0.55), 0 0 32px rgba(123,97,255,0.2)"
          : "0 10px 36px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.07)";

  const innerBorder =
    isDragging
      ? "rgba(90, 200, 250, 0.55)"
      : justReleased
        ? "rgba(90, 200, 250, 0.42)"
        : selected
          ? "rgba(123, 97, 255, 0.48)"
          : "rgba(255, 255, 255, 0.1)";

  const innerBg =
    isDragging
      ? "rgba(24, 32, 48, 0.82)"
      : selected
        ? "rgba(22, 18, 38, 0.78)"
        : "rgba(21, 21, 21, 0.65)";

  const springLayout = { type: "spring" as const, stiffness: 360, damping: 32, mass: 0.82 };
  const springSnap = { type: "spring" as const, stiffness: 480, damping: 36, mass: 0.72 };

  const scaleAnimated =
    isDragging
      ? 1.042
      : justReleased
        ? [1.032, 1.004, 1]
        : selected
          ? 1.018
          : 1;

  return (
    <motion.div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        x: dragX,
        y: dragY,
        width: CARD_W,
        height: CARD_H,
      }}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragTransition={{ bounceStiffness: 520, bounceDamping: 32, power: 0.25 }}
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{
        opacity: 1,
        scale: scaleAnimated,
        y: 0,
        rotate: isDragging ? -0.45 : 0,
        boxShadow: outerShadow,
        zIndex: isDragging ? 50 : selected ? 12 : 8,
      }}
      transition={{
        opacity: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        y: { delay: i * 0.04, ...springLayout },
        scale: justReleased
          ? { duration: 0.62, times: [0, 0.48, 1], ease: [0.33, 1, 0.68, 1] }
          : isDragging
            ? springSnap
            : springLayout,
        boxShadow: { ...springLayout, restDelta: 0.008 },
        rotate: springSnap,
        zIndex: { duration: 0 },
      }}
      whileHover={
        isDragging
          ? undefined
          : {
              scale: selected ? 1.028 : 1.014,
              transition: { type: "spring", stiffness: 420, damping: 30 },
            }
      }
      whileTap={{ scale: 0.985, transition: { type: "spring", stiffness: 620, damping: 38 } }}
      whileDrag={{ cursor: "grabbing" }}
      onPointerDown={(e) => e.stopPropagation()}
      onDragStart={() => setIsDragging(true)}
      onDrag={(_, info) => {
        onDragOffset?.(n.id, info.offset.x / z, info.offset.y / z);
      }}
      onTap={() => onLinkTap(n.id)}
      onDragEnd={() => {
        onDragCommit(n.id, dragX.get() / z, dragY.get() / z);
        onDragOffsetClear?.(n.id);
        dragX.set(0);
        dragY.set(0);
        setIsDragging(false);
        flashLanded();
      }}
      className="cursor-grab rounded-2xl"
    >
      {n.current ? (
        <span className="absolute -top-2.5 left-3 z-10 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-[var(--primary)]/35">
          Atual
        </span>
      ) : null}
      <motion.div
        className="relative h-full rounded-2xl border p-4 backdrop-blur-[24px]"
        animate={{
          borderColor: innerBorder,
          backgroundColor: innerBg,
          opacity: justReleased && !isDragging ? [1, 0.94, 0.98, 1] : 1,
        }}
        transition={{
          borderColor: springLayout,
          backgroundColor: springLayout,
          opacity:
            justReleased && !isDragging
              ? { duration: 0.55, times: [0, 0.28, 0.62, 1], ease: [0.45, 0, 0.55, 1] }
              : springLayout,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${n.statusClass}`}>
            {n.status}
          </span>
        </div>
        <h3 className="mt-3 font-semibold text-white">{n.title}</h3>
        <p className="text-xs text-zinc-500">{n.sub}</p>
        <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-zinc-500">{n.meta}</span>
          <span className={`font-semibold ${n.blocked ? "text-zinc-600" : "text-white"}`}>
            {n.blocked ? "—" : `${pct}%`}
          </span>
        </div>
        <div
          className={`mt-2 h-1.5 overflow-hidden rounded-full ${n.blocked ? "border border-dashed border-white/10 bg-transparent" : "bg-white/10"}`}
        >
          {!n.blocked ? (
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.15 + i * 0.04, duration: 0.55, ease: "easeOut" }}
            />
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function StudyPathCanvas() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panSession = useRef({ sx: 0, sy: 0, px: 0, py: 0 });
  const panningRef = useRef(false);

  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [edges, setEdges] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get("/planning/roadmap").then((res: any) => {
      const data = res.data.data;
      if (data) {
        const fetchedNodes: NodeItem[] = data.nodes.map((n: any) => ({
          ...n,
          icon: ICONS_MAP[n.icon] || BookOpen,
        }));
        setNodes(fetchedNodes);

        const newPositions: Record<string, { x: number; y: number }> = {};
        data.nodes.forEach((n: any) => {
          newPositions[n.id] = { x: n.positionX, y: n.positionY };
        });
        setPositions(newPositions);

        const newEdges = new Set<string>();
        data.edges.forEach((e: any) => {
          newEdges.add(edgeKey(e.sourceId, e.targetId));
        });
        setEdges(newEdges);
      }
    }).catch(() => {});
  }, []);

  const [linkPending, setLinkPending] = useState<string | null>(null);
  /** Extremidade “livre” do preview de ligação (coordenadas do SVG / mapa). */
  const [linkPreviewEnd, setLinkPreviewEnd] = useState<{ x: number; y: number } | null>(null);
  /** Espelha o primeiro toque da associação; evita setEdges dentro do updater de setLinkPending (Strict Mode / batch). */
  const linkAnchorRef = useRef<string | null>(null);
  const edgesSvgRef = useRef<SVGSVGElement | null>(null);
  /** Deslocamento atual do drag (mapa), até o commit em `positions`. */
  const liveDragOffsetRef = useRef<Record<string, { dx: number; dy: number }>>({});
  const dragLinesRafRef = useRef<number | null>(null);
  const [dragLinesRevision, setDragLinesRevision] = useState(0);

  const scheduleEdgesRedraw = useCallback(() => {
    if (dragLinesRafRef.current != null) return;
    dragLinesRafRef.current = requestAnimationFrame(() => {
      dragLinesRafRef.current = null;
      setDragLinesRevision((v) => v + 1);
    });
  }, []);

  const setCardDragOffset = useCallback(
    (id: string, dx: number, dy: number) => {
      liveDragOffsetRef.current[id] = { dx, dy };
      scheduleEdgesRedraw();
    },
    [scheduleEdgesRedraw],
  );

  const clearCardDragOffset = useCallback((id: string) => {
    delete liveDragOffsetRef.current[id];
    if (dragLinesRafRef.current != null) {
      cancelAnimationFrame(dragLinesRafRef.current);
      dragLinesRafRef.current = null;
    }
    setDragLinesRevision((v) => v + 1);
  }, []);

  const clearAllCardDragOffsets = useCallback(() => {
    liveDragOffsetRef.current = {};
    if (dragLinesRafRef.current != null) {
      cancelAnimationFrame(dragLinesRafRef.current);
      dragLinesRafRef.current = null;
    }
    setDragLinesRevision((v) => v + 1);
  }, []);

  useEffect(() => {
    return () => {
      if (dragLinesRafRef.current != null) cancelAnimationFrame(dragLinesRafRef.current);
    };
  }, []);

  const setZoomClamped = (next: number) => {
    setZoom(Math.min(1.15, Math.max(0.78, next)));
  };

  const clearLinkSelection = useCallback(() => {
    linkAnchorRef.current = null;
    setLinkPending(null);
    setLinkPreviewEnd(null);
  }, []);

  const handleLinkTap = useCallback((id: string) => {
    const anchor = linkAnchorRef.current;
    if (anchor === null) {
      linkAnchorRef.current = id;
      setLinkPending(id);
      return;
    }
    if (anchor === id) {
      clearLinkSelection();
      return;
    }
    const k = edgeKey(anchor, id);
    setEdges((current) => {
      const next = new Set(current);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

    api.post("/planning/edges", {
      sourceId: anchor,
      targetId: id
    }).catch(() => {});

    linkAnchorRef.current = null;
    setLinkPending(null);
  }, [clearLinkSelection]);

  useEffect(() => {
    if (!linkPending) {
      setLinkPreviewEnd(null);
      return;
    }
    const p = positions[linkPending];
    if (p) {
      setLinkPreviewEnd({ x: p.x + CARD_W / 2, y: p.y + CARD_H / 2 });
    }

    const onMove = (e: PointerEvent) => {
      const svg = edgesSvgRef.current;
      if (!svg) return;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const loc = point.matrixTransform(ctm.inverse());
      setLinkPreviewEnd({ x: loc.x, y: loc.y });
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [linkPending]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!panningRef.current) return;
      setPan({
        x: panSession.current.px + (e.clientX - panSession.current.sx),
        y: panSession.current.py + (e.clientY - panSession.current.sy),
      });
    };
    const end = () => {
      panningRef.current = false;
      setIsPanning(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const onMapPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    clearLinkSelection();
    panningRef.current = true;
    setIsPanning(true);
    panSession.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  };

  const edgePaths = useMemo(() => {
    const posNow = (id: string) => {
      const p = positions[id] ?? { x: 0, y: 0 };
      const l = liveDragOffsetRef.current[id];
      return l ? { x: p.x + l.dx, y: p.y + l.dy } : p;
    };
    const list: { key: string; d: string }[] = [];
    for (const k of edges) {
      const parsed = parseEdgeKey(k);
      if (!parsed) continue;
      const [a, b] = parsed;
      const pa = posNow(a);
      const pb = posNow(b);
      const caX = pa.x + CARD_W / 2;
      const caY = pa.y + CARD_H / 2;
      const cbX = pb.x + CARD_W / 2;
      const cbY = pb.y + CARD_H / 2;
      const pA = exitRectToward(pa.x, pa.y, CARD_W, CARD_H, caX, caY, cbX, cbY);
      const pB = exitRectToward(pb.x, pb.y, CARD_W, CARD_H, cbX, cbY, caX, caY);
      list.push({
        key: k,
        d: cubicPathBetween(pA.x, pA.y, pB.x, pB.y),
      });
    }
    return list;
  }, [edges, positions, dragLinesRevision]);

  const linkPreviewPath = useMemo(() => {
    if (!linkPending || !linkPreviewEnd) return null;
    const base = positions[linkPending] ?? { x: 0, y: 0 };
    const l = liveDragOffsetRef.current[linkPending];
    const p = l ? { x: base.x + l.dx, y: base.y + l.dy } : base;
    const cX = p.x + CARD_W / 2;
    const cY = p.y + CARD_H / 2;
    const pA = exitRectToward(p.x, p.y, CARD_W, CARD_H, cX, cY, linkPreviewEnd.x, linkPreviewEnd.y);
    return cubicPathBetween(pA.x, pA.y, linkPreviewEnd.x, linkPreviewEnd.y);
  }, [linkPending, linkPreviewEnd, positions, dragLinesRevision]);

  return (
    <div className="relative flex min-h-[600px] flex-col overflow-hidden rounded-3xl border border-white/8 bg-zinc-950/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-20 flex flex-col gap-4 border-b border-white/6 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Plano de estudos</h2>
            <p className="text-xs text-zinc-500">Seu mapa de aprendizado e conexões entre matérias</p>
            {linkPending ? (
              <p className="mt-2 text-[11px] font-medium text-[var(--primary)]">
                Toque em outra matéria para associar ou desassociar. Toque de novo na mesma para cancelar.
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-zinc-600">
                Arraste os cards. Toque em um e depois em outro para ligar ou desligar uma linha.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="glass flex h-10 w-10 items-center justify-center rounded-xl text-zinc-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Buscar matéria"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="glass flex h-10 w-10 items-center justify-center rounded-xl text-zinc-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Notificações"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 self-start rounded-2xl bg-gradient-to-r from-[var(--primary)] to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(123,97,255,0.45),0_8px_24px_rgba(0,0,0,0.35)] sm:self-center"
        >
          <Plus className="h-4 w-4" />
          Nova matéria
        </motion.button>
      </div>

      <div className="relative z-10 flex-1 overflow-hidden px-3 pb-44 pt-4 max-sm:pb-52 sm:px-5 sm:pb-32">
        <div
          role="application"
          aria-label="Mapa de estudos — arraste o fundo para mover o mapa ou arraste os cards"
          className={`relative min-h-[440px] cursor-grab touch-none select-none ${isPanning ? "cursor-grabbing" : ""}`}
          onPointerDown={onMapPointerDown}
          style={{ touchAction: "none" }}
        >
          <div
            className={`relative mx-auto min-h-[560px] w-full max-w-6xl will-change-transform ${isPanning ? "" : "transition-transform duration-200 ease-out"}`}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <svg
              ref={edgesSvgRef}
              className="pointer-events-none absolute left-0 top-0 z-[1] h-full min-h-[560px] w-full overflow-visible"
              aria-hidden
            >
              {edgePaths.map(({ key, d }) => (
                <g key={key}>
                  <path
                    d={d}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.14)"
                    strokeWidth={2.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="#5a5470"
                    strokeWidth={1.85}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              ))}
              {linkPreviewPath ? (
                <g opacity={0.58} className="pointer-events-none">
                  <path
                    d={linkPreviewPath}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.18)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={linkPreviewPath}
                    fill="none"
                    stroke="#7a7394"
                    strokeWidth={1.65}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              ) : null}
            </svg>

            {nodes.map((n, i) => {
              const pos = positions[n.id] ?? { x: 0, y: 0 };
              const selected = linkPending === n.id;
              return (
                <DraggableStudyCard
                  key={n.id}
                  n={n}
                  index={i}
                  position={pos}
                  zoom={zoom}
                  selected={selected}
                  onLinkTap={handleLinkTap}
                  onDragCommit={(id, dx, dy) => {
                    setPositions((prev) => {
                      const p = prev[id] ?? { x: 0, y: 0 };
                      const newX = p.x + dx;
                      const newY = p.y + dy;
                      api.patch(`/planning/nodes/${id}/position`, { x: newX, y: newY }).catch(() => {});
                      return { ...prev, [id]: { x: newX, y: newY } };
                    });
                  }}
                  onDragOffset={setCardDragOffset}
                  onDragOffsetClear={clearCardDragOffset}
                />
              );
            })}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="absolute bottom-5 left-4 z-20 max-w-[min(100%-2rem,400px)] overflow-hidden rounded-2xl border border-white/10 bg-black/45 p-4 shadow-[0_0_40px_rgba(123,97,255,0.12)] backdrop-blur-xl sm:left-6"
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--primary)]/25 blur-2xl"
          aria-hidden
        />
        <p className="relative text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">
          AI Insight
        </p>
        <p className="relative mt-2 text-sm leading-relaxed text-zinc-300">
          Com base no seu desempenho em Cálculo, sugiro reforçar Física mecânica antes de avançar para
          integrais mais profundas.
        </p>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-white/15 bg-transparent px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            Ignorar
          </button>
          <button
            type="button"
            className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-100"
          >
            Reorganizar
          </button>
        </div>
      </motion.div>

      <div className="absolute bottom-5 right-4 z-20 flex flex-col items-end gap-3 sm:right-6">
        <div className="glass flex flex-col gap-1 rounded-xl border border-white/10 p-1">
          <button
            type="button"
            onClick={() => setZoomClamped(zoom + 0.07)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Aumentar zoom"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomClamped(zoom - 0.07)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Diminuir zoom"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
              clearAllCardDragOffsets();
              clearLinkSelection();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Recentralizar mapa"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        <div className="glass-surface flex items-center gap-3 rounded-xl border border-white/8 px-3 py-2 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            Principal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-warm)]" />
            Secundário
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
            Concluído
          </span>
        </div>
      </div>
    </div>
  );
}
