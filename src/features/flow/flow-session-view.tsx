"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Layers,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Timer,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";

type FlowState = "idle" | "running" | "paused" | "completed";
type FlowMode = "focus" | "flashcards";

type FlashItem = { id: string; front: string; back: string };

/** Cartões de exemplo — futuramente ligar a decks persistidos / IA */
const DEMO_FLASHCARDS: FlashItem[] = [
  {
    id: "fc1",
    front: "O que é plasticidade sináptica?",
    back: "Capacidade das conexões neurais de fortalecer ou enfraquecer com a experiência.",
  },
  {
    id: "fc2",
    front: "Diferença entre LTP e LTD",
    back: "LTP fortalece a sinapse com repetição; LTD enfraquece quando há menos uso ou padrões inibitórios.",
  },
  {
    id: "fc3",
    front: "Papel do hipocampo na memória",
    back: "Consolidação de memórias declarativas e navegação espacial (memória episódica).",
  },
];

type Session = {
  id: string;
  title: string;
  createdAt: string;
  duration: number;
  status: string;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function FlowSessionView() {
  const searchParams = useSearchParams();
  const [flowMode, setFlowMode] = useState<FlowMode>("focus");
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interruptions, setInterruptions] = useState(0);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [timerInputMinutes, setTimerInputMinutes] = useState("25");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [difficulty, setDifficulty] = useState(3);
  const [nextAction, setNextAction] = useState("");
  const [sessionGoalMet, setSessionGoalMet] = useState(true);
  const [studyTitle, setStudyTitle] = useState("Neurociência avançada");
  const [studySubtitle, setStudySubtitle] = useState("Capítulo 4: Vias neurais e plasticidade");
  const [editingStudy, setEditingStudy] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [flashStartedAt, setFlashStartedAt] = useState<number | null>(null);

  const running = flowState === "running";
  const isFlash = flowMode === "flashcards";
  const currentCard = DEMO_FLASHCARDS[cardIndex] ?? DEMO_FLASHCARDS[0];
  const totalSeconds = targetMinutes * 60;

  useEffect(() => {
    // Integração Planning → Flow via query params (título/subtítulo).
    const topic = searchParams.get("topic")?.trim();
    const sub = searchParams.get("sub")?.trim();
    if (topic) setStudyTitle(topic);
    if (sub) setStudySubtitle(sub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/flow/sessions");
        setSessions(res.data.data);
      } catch {
        /* ignore */
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!running || isFlash) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setFlowState("completed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, isFlash]);

  const suggestedMinutes = useMemo(() => {
    if (!sessions.length) return 30;
    const completed = sessions.filter((s) => s.status === "completed" || s.status === "in_progress");
    if (!completed.length) return 30;
    const avg = completed.reduce((acc, s) => acc + s.duration, 0) / completed.length;
    return clamp(Math.round(avg / 5) * 5, 20, 55);
  }, [sessions]);

  useEffect(() => {
    setTargetMinutes(suggestedMinutes);
    setSecondsLeft(suggestedMinutes * 60);
    setTimerInputMinutes(String(suggestedMinutes));
  }, [suggestedMinutes]);

  const idealWindow = useMemo(() => {
    if (!sessions.length) return "09:00 - 11:00";
    const countByHour = new Map<number, number>();
    sessions.forEach((s) => {
      const h = new Date(s.createdAt).getHours();
      countByHour.set(h, (countByHour.get(h) ?? 0) + 1);
    });
    let bestHour = 9;
    let bestScore = -1;
    countByHour.forEach((v, h) => {
      if (v > bestScore) {
        bestHour = h;
        bestScore = v;
      }
    });
    const end = (bestHour + 2) % 24;
    return `${String(bestHour).padStart(2, "0")}:00 - ${String(end).padStart(2, "0")}:00`;
  }, [sessions]);

  const formatted = useMemo(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const circumference = 2 * Math.PI * 120;
  const offset = circumference * (1 - progress);

  const todayIso = new Date().toDateString();
  const todaySessions = useMemo(
    () => sessions.filter((s) => new Date(s.createdAt).toDateString() === todayIso && s.status === "completed"),
    [sessions, todayIso],
  );
  const todayFocusMinutes = useMemo(
    () => todaySessions.reduce((acc, s) => acc + s.duration, 0),
    [todaySessions],
  );
  const dailyGoalMinutes = 120;
  const dailyProgress = clamp(todayFocusMinutes / dailyGoalMinutes, 0, 1);
  const flowBlocksToday = todaySessions.length;
  const currentBlock = flowState === "completed" ? flowBlocksToday : flowBlocksToday + 1;

  const playCue = (freq: number, durationMs: number) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.02;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        void ctx.close();
      }, durationMs);
    } catch {
      /* ignore */
    }
  };

  const stateTheme =
    flowState === "running"
      ? {
          ring: "url(#flowRingRunning)",
          chip: "text-[var(--success)]",
          title: "Em foco profundo",
          subtitle: "Mantenha o ritmo. Você está no estado ideal de execução.",
          bg: "bg-[radial-gradient(circle_at_center,rgba(123,97,255,0.08),transparent_60%)]",
        }
      : flowState === "paused"
        ? {
            ring: "url(#flowRingPaused)",
            chip: "text-[var(--accent-warm)]",
            title: "Sessão pausada",
            subtitle: "Respire por 60 segundos e retome de onde parou.",
            bg: "bg-[radial-gradient(circle_at_center,rgba(255,149,0,0.08),transparent_60%)]",
          }
        : flowState === "completed"
          ? {
              ring: "url(#flowRingDone)",
              chip: "text-[var(--success)]",
              title: "Sessão concluída",
              subtitle: "Excelente. Faça um debrief rápido e inicie o próximo bloco.",
              bg: "bg-[radial-gradient(circle_at_center,rgba(48,209,88,0.09),transparent_60%)]",
            }
          : {
              ring: "url(#flowRingIdle)",
              chip: "text-zinc-300",
              title: "Pronto para iniciar",
              subtitle: "Defina sua intenção e entre em execução com clareza.",
              bg: "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_62%)]",
            };

  const start = () => {
    setFlowState("running");
    if (isFlash) {
      setFlashStartedAt(Date.now());
      setCardIndex(0);
      setCardFlipped(false);
    }
    playCue(520, 120);
  };
  const pause = () => setFlowState("paused");
  const resume = () => setFlowState("running");
  const reset = () => {
    setFlowState("idle");
    setSecondsLeft(targetMinutes * 60);
    setInterruptions(0);
    setDebriefOpen(false);
    setCelebrate(false);
    setFlashStartedAt(null);
    setCardIndex(0);
    setCardFlipped(false);
  };

  const modeLocked = flowState === "running" || flowState === "paused";

  const switchFlowMode = (next: FlowMode) => {
    if (next === flowMode || modeLocked) return;
    setCardIndex(0);
    setCardFlipped(false);
    setFlashStartedAt(null);
    if (flowState === "completed") setFlowState("idle");
    setFlowMode(next);
  };

  const complete = async () => {
    setFlowState("completed");
    setCelebrate(true);
    setDebriefOpen(true);
    playCue(840, 180);
    setTimeout(() => setCelebrate(false), 1200);
    try {
      const durationMinutes = isFlash
        ? Math.max(
            1,
            flashStartedAt ? Math.round((Date.now() - flashStartedAt) / 60000) : 1,
          )
        : Math.max(1, Math.round((totalSeconds - secondsLeft) / 60));
      const subject = isFlash ? `Flashcards — ${studyTitle}` : "Flow Space";
      const response = await api.post("/flow/sessions", {
        title: subject,
        duration: durationMinutes,
        tags: [isFlash ? "flashcards" : "focus"],
      });
      if (response.data?.data) {
        setSessions((prev) => [response.data.data, ...prev]);
      }
    } catch {
      /* ignore */
    }
  };

  const startTimerEdit = () => {
    if (running) {
      setFlowState("paused");
    }
    setTimerInputMinutes(String(Math.max(1, Math.round(secondsLeft / 60))));
    setIsEditingTimer(true);
  };

  const applyTimerEdit = () => {
    const parsed = Number(timerInputMinutes.replace(",", "."));
    if (!Number.isFinite(parsed)) {
      setIsEditingTimer(false);
      return;
    }
    const minutes = clamp(Math.round(parsed), 5, 180);
    setTargetMinutes(minutes);
    setSecondsLeft(minutes * 60);
    if (flowState === "completed") {
      setFlowState("idle");
    }
    setIsEditingTimer(false);
  };

  return (
    <div className="relative mx-auto max-w-2xl pb-10">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className={`glass inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium ${stateTheme.chip}`}>
          <Zap className="h-4 w-4" />
          {stateTheme.title}
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:mx-4 sm:flex-row sm:justify-center">
          <div className="glass flex items-center gap-2 rounded-2xl border border-(--accent-warm)/40 px-3 py-2 text-xs text-zinc-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-(--accent-warm)" />
            {stateTheme.subtitle}
          </div>
        </div>
        <div className="glass inline-flex items-center gap-2 self-end rounded-full px-3 py-1.5 text-xs text-zinc-300 sm:self-center">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--accent-warm) opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-(--accent-warm)" />
          </span>
          Janela ideal: {idealWindow}
        </div>
      </motion.div>

      <div className="mx-auto mb-4 w-full max-w-[540px]">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-300">
          <span className="glass rounded-full px-3 py-1.5">Bloco {currentBlock}/4</span>
          <span className="glass rounded-full px-3 py-1.5">
            Hoje: {todayFocusMinutes}/{dailyGoalMinutes} min
          </span>
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-white/10"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            Som {soundEnabled ? "on" : "off"}
          </button>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-(--primary) to-(--secondary)"
            initial={false}
            animate={{ width: `${dailyProgress * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="mx-auto mb-4 flex w-full max-w-[540px] gap-2">
        <button
          type="button"
          disabled={modeLocked}
          onClick={() => switchFlowMode("focus")}
          className={`glass flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
            flowMode === "focus"
              ? "border-(--primary)/50 bg-(--primary)/15 text-white ring-2 ring-(--primary)/35"
              : "border-white/10 text-zinc-300 hover:bg-white/5"
          } ${modeLocked ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <Timer className="h-4 w-4 shrink-0" />
          Foco (timer)
        </button>
        <button
          type="button"
          disabled={modeLocked}
          onClick={() => switchFlowMode("flashcards")}
          className={`glass flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
            flowMode === "flashcards"
              ? "border-(--secondary)/50 bg-(--secondary)/15 text-white ring-2 ring-(--secondary)/35"
              : "border-white/10 text-zinc-300 hover:bg-white/5"
          } ${modeLocked ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <Layers className="h-4 w-4 shrink-0" />
          Flashcards
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-surface premium-shadow mx-auto mb-4 flex w-full max-w-[470px] items-center gap-4 rounded-2xl border border-white/10 px-5 py-4"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--primary)/25">
          {isFlash ? <Layers className="h-5.5 w-5.5 text-(--secondary)" /> : <BookOpen className="h-5.5 w-5.5 text-(--primary)" />}
        </div>
        <div className="min-w-0 flex-1">
          {editingStudy ? (
            <div className="flex flex-col gap-2">
              <input
                value={studyTitle}
                onChange={(e) => setStudyTitle(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/35 px-2 py-1.5 text-[15px] font-semibold text-white outline-none placeholder:text-zinc-500"
                placeholder="Matéria / tópico"
                autoFocus
              />
              <input
                value={studySubtitle}
                onChange={(e) => setStudySubtitle(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/35 px-2 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-500"
                placeholder="Subtítulo (opcional)"
              />
            </div>
          ) : (
            <>
              <p className="truncate text-[17px] font-semibold leading-tight">{studyTitle}</p>
              <p className="truncate text-sm text-zinc-300/95">{studySubtitle}</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditingStudy((v) => !v)}
          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
          aria-label={editingStudy ? "Fechar edição" : "Editar matéria"}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </motion.div>

      <motion.div
        className={`relative mx-auto flex min-h-[min(100vw,500px)] w-full max-w-[min(100%,500px)] flex-col items-center justify-center py-6 sm:min-h-[500px] ${stateTheme.bg} ${!isFlash ? "aspect-square" : ""}`}
        animate={{ scale: running && !isFlash ? [1, 1.01, 1] : 1 }}
        transition={{ repeat: running && !isFlash ? Infinity : 0, duration: 3 }}
      >
        {celebrate ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 1, 0], scale: [0.9, 1.02, 1] }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-20 rounded-full border border-(--success)/40 bg-(--success)/10"
          />
        ) : null}

        {!isFlash ? (
          <>
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 280 280">
              <defs>
                <linearGradient id="flowRingRunning" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-warm)" />
                  <stop offset="50%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--secondary)" />
                </linearGradient>
                <linearGradient id="flowRingPaused" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-warm)" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id="flowRingDone" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--success)" />
                  <stop offset="100%" stopColor="#86efac" />
                </linearGradient>
                <linearGradient id="flowRingIdle" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3f3f46" />
                  <stop offset="100%" stopColor="#71717a" />
                </linearGradient>
              </defs>
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
              />
              <motion.circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke={stateTheme.ring}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={false}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.35 }}
              />
            </svg>
            <div className="relative z-10 text-center">
              {isEditingTimer ? (
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={180}
                    autoFocus
                    value={timerInputMinutes}
                    onChange={(e) => setTimerInputMinutes(e.target.value)}
                    onBlur={applyTimerEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyTimerEdit();
                      if (e.key === "Escape") setIsEditingTimer(false);
                    }}
                    className="w-28 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-center text-3xl font-bold tabular-nums text-white outline-none ring-0"
                  />
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">minutos (5-180)</p>
                </div>
              ) : (
                <button
                  type="button"
                  onDoubleClick={startTimerEdit}
                  className="group rounded-2xl px-3 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-(--primary)"
                  title="Dê dois cliques para editar"
                >
                  <p className="text-gradient-timer text-7xl font-bold tracking-tight tabular-nums sm:text-8xl">
                    {formatted}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-500 opacity-0 transition group-hover:opacity-100">
                    duplo clique para alterar
                  </p>
                </button>
              )}
              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                {flowState === "completed" ? "Concluído" : "Tempo restante"}
              </p>
            </div>
          </>
        ) : flowState === "completed" ? (
          <div className="relative z-10 flex max-w-sm flex-col items-center gap-3 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--success)/20 text-(--success)">
              <Check className="h-8 w-8" />
            </div>
            <p className="text-lg font-semibold text-white">Revisão concluída</p>
            <p className="text-sm text-zinc-400">
              {DEMO_FLASHCARDS.length} cartões no baralho · {studyTitle}
            </p>
          </div>
        ) : flowState === "idle" ? (
          <div className="relative z-10 flex max-w-sm flex-col items-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--secondary)/20 text-(--secondary)">
              <Layers className="h-8 w-8" />
            </div>
            <p className="text-lg font-semibold text-white">Revisão ativa</p>
            <p className="text-sm leading-relaxed text-zinc-400">
              Toque no cartão para virar. Use anterior/próximo para navegar. A sessão registra o tempo até concluir.
            </p>
            <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              {DEMO_FLASHCARDS.length} cartões de demonstração
            </p>
          </div>
        ) : (
          <div
            className={`relative z-10 flex w-full max-w-[360px] flex-col items-center px-4 ${flowState === "paused" ? "opacity-75" : ""}`}
          >
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-500">
              {flowState === "paused" ? "Pausado" : "Toque para virar"}
            </p>
            <div className="relative w-full [perspective:1200px]">
              <motion.button
                type="button"
                onClick={() => flowState === "running" && setCardFlipped((f) => !f)}
                disabled={flowState === "paused"}
                className="relative h-[min(280px,58vw)] w-full max-w-[340px] cursor-pointer text-left disabled:cursor-not-allowed"
              >
                <motion.div
                  className="relative h-full w-full"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: cardFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26 }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-2xl border border-white/12 bg-black/45 p-5 shadow-xl [backface-visibility:hidden]"
                    style={{ transform: "rotateY(0deg)" }}
                  >
                    <p className="text-center text-[15px] leading-snug text-zinc-100">{currentCard.front}</p>
                  </div>
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-2xl border border-(--primary)/35 bg-(--primary)/12 p-5 shadow-xl [backface-visibility:hidden]"
                    style={{ transform: "rotateY(180deg)" }}
                  >
                    <p className="text-center text-[15px] leading-snug text-zinc-100">{currentCard.back}</p>
                  </div>
                </motion.div>
              </motion.button>
            </div>
            <div className="mt-5 flex w-full max-w-[340px] items-center justify-between gap-2">
              <button
                type="button"
                disabled={cardIndex === 0}
                onClick={() => {
                  setCardIndex((i) => Math.max(0, i - 1));
                  setCardFlipped(false);
                }}
                className="glass rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-xs tabular-nums text-zinc-400">
                {cardIndex + 1} / {DEMO_FLASHCARDS.length}
              </span>
              <button
                type="button"
                disabled={cardIndex >= DEMO_FLASHCARDS.length - 1}
                onClick={() => {
                  setCardIndex((i) => Math.min(DEMO_FLASHCARDS.length - 1, i + 1));
                  setCardFlipped(false);
                }}
                className="glass rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-400">
        {isFlash ? (
          <span className="rounded-lg border border-white/10 px-2 py-1">
            Baralho: {DEMO_FLASHCARDS.length} cartões · tempo contado até concluir
          </span>
        ) : (
          <span className="rounded-lg border border-white/10 px-2 py-1">Duração sugerida: {suggestedMinutes} min</span>
        )}
        <button
          type="button"
          onClick={() => setInterruptions((v) => v + 1)}
          className="rounded-lg border border-white/10 px-2 py-1 transition hover:bg-white/5"
        >
          Registrar interrupção (+1)
        </button>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {flowState === "idle" ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={start}
            className="flex items-center gap-2 rounded-full bg-(--primary) px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-(--primary)/30"
          >
            {isFlash ? <Layers className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isFlash ? "Iniciar revisão" : "Iniciar sessão"}
          </motion.button>
        ) : null}

        {flowState === "running" ? (
          <>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={pause}
              className="glass flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
            >
              <Pause className="h-4 w-4" />
              Pausar
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={complete}
              className="flex items-center gap-2 rounded-full bg-linear-to-r from-(--accent-warm) to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25"
            >
              <Check className="h-4 w-4" />
              {isFlash ? "Concluir revisão" : "Concluir tarefa"}
            </motion.button>
          </>
        ) : null}

        {flowState === "paused" ? (
          <>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={resume}
              className="flex items-center gap-2 rounded-full bg-(--primary) px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-(--primary)/30"
            >
              <Play className="h-4 w-4" />
              Retomar
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="glass flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              Encerrar
            </motion.button>
          </>
        ) : null}

        {flowState === "completed" ? (
          <>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="flex items-center gap-2 rounded-full bg-(--success) px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-(--success)/30"
            >
              <RotateCcw className="h-4 w-4" />
              Novo bloco
            </motion.button>
            <span className="glass rounded-full px-4 py-2 text-xs text-zinc-300">
              Debrief: interrupções registradas {interruptions}
            </span>
          </>
        ) : null}
      </div>

      {debriefOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass-surface premium-shadow w-full max-w-[560px] rounded-2xl border border-white/10 p-5"
          >
            <p className="text-base font-semibold">Fechamento de ciclo</p>
            <p className="mt-1 text-xs text-zinc-400">Registre como foi este bloco para ajustar melhor os próximos.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-400">Dificuldade:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDifficulty(n)}
                  className={`rounded-lg px-2 py-1 text-xs transition ${difficulty === n ? "bg-(--primary) text-white" : "glass text-zinc-300"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-300">
              <input
                id="goal-met"
                type="checkbox"
                checked={sessionGoalMet}
                onChange={(e) => setSessionGoalMet(e.target.checked)}
                className="h-4 w-4 accent-(--primary)"
              />
              <label htmlFor="goal-met">Objetivo deste bloco foi cumprido</label>
            </div>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="Próxima ação sugerida (ex: revisar resumo por 15 min)"
              className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDebriefOpen(false)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => setDebriefOpen(false)}
                className="rounded-lg bg-(--success) px-3 py-1.5 text-xs font-semibold text-black"
              >
                Salvar debrief
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </div>
  );
}
