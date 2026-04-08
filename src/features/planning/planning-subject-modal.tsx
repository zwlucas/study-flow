"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  Atom,
  BookOpen,
  Cpu,
  FlaskConical,
  ImagePlus,
  Sigma,
  Trash2,
  X,
} from "lucide-react";

import { api } from "@/lib/api";

export const PLANNING_ICON_KEYS = [
  "BookOpen",
  "Atom",
  "Sigma",
  "Cpu",
  "FlaskConical",
] as const;

export type PlanningIconKey = (typeof PLANNING_ICON_KEYS)[number];

const ICON_PREVIEW: Record<
  PlanningIconKey,
  ComponentType<{ className?: string }>
> = {
  BookOpen,
  Atom,
  Sigma,
  Cpu,
  FlaskConical,
};

const ICON_LABELS: Record<PlanningIconKey, string> = {
  BookOpen: "Livro",
  Atom: "Átomo",
  Sigma: "Sigma",
  Cpu: "CPU",
  FlaskConical: "Química",
};

/** Ficheiro original até 10 MB (data URL em base64 fica maior). */
const MAX_COVER_FILE_BYTES = 10 * 1024 * 1024;
/** Teto para o string data URL (~10 MB binário em base64 + prefixo). */
const MAX_COVER_DATA_URL_CHARS = 15_000_000;

const LARGE_IMAGE_REQUEST = {
  timeout: 180_000,
  maxBodyLength: 20 * 1024 * 1024,
  maxContentLength: 20 * 1024 * 1024,
} as const;

export type PlanningSubjectModalInitial = {
  title: string;
  sub: string;
  icon: PlanningIconKey;
  coverImage?: string | null;
};

type PlanningSubjectModalProps = {
  open: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  suggestedPosition?: { x: number; y: number };
  editNodeId?: string;
  initial?: PlanningSubjectModalInitial | null;
  onSuccess?: () => void;
};

function normalizeIcon(key: string | undefined): PlanningIconKey {
  if (key && PLANNING_ICON_KEYS.includes(key as PlanningIconKey)) {
    return key as PlanningIconKey;
  }
  return "BookOpen";
}

export function PlanningSubjectModal({
  open,
  mode,
  onClose,
  suggestedPosition = { x: 160, y: 120 },
  editNodeId,
  initial,
  onSuccess,
}: PlanningSubjectModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [sub, setSub] = useState("");
  const [icon, setIcon] = useState<PlanningIconKey>("BookOpen");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetCreate = useCallback(() => {
    setTitle("");
    setSub("");
    setIcon("BookOpen");
    setCoverPreview(null);
    setError(null);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      resetCreate();
      const t = requestAnimationFrame(() => titleInputRef.current?.focus());
      return () => cancelAnimationFrame(t);
    }
    const ini = initial;
    setTitle(ini?.title ?? "");
    setSub(ini?.sub ?? "");
    setIcon(normalizeIcon(ini?.icon));
    setCoverPreview(ini?.coverImage ?? null);
    setError(null);
    setSubmitting(false);
    const t = requestAnimationFrame(() => titleInputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open, mode, initial, resetCreate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const panel = panelRef.current;
      if (panel && !panel.contains(e.target as Node)) onClose();
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open, onClose]);

  const onCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    if (f.size > MAX_COVER_FILE_BYTES) {
      setError("A imagem pode ter no máximo 10 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      if (reader.result.length > MAX_COVER_DATA_URL_CHARS) {
        setError("A imagem resultou demasiado grande após codificação. Tente outro formato ou ficheiro mais pequeno.");
        return;
      }
      setCoverPreview(reader.result);
      setError(null);
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const clearCover = () => {
    setCoverPreview(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError("Indique um nome para a matéria.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "create") {
        await api.post(
          "/planning/nodes",
          {
            title: t,
            sub: sub.trim(),
            icon,
            positionX: suggestedPosition.x,
            positionY: suggestedPosition.y,
            ...(coverPreview ? { coverImage: coverPreview } : {}),
          },
          coverPreview ? LARGE_IMAGE_REQUEST : undefined,
        );
      } else {
        if (!editNodeId) {
          setError("Identificador da matéria em falta.");
          return;
        }
        const hadServerCover = Boolean(initial?.coverImage);
        const payload: Record<string, unknown> = {
          title: t,
          sub: sub.trim(),
          icon,
        };
        if (coverPreview !== (initial?.coverImage ?? null)) {
          if (coverPreview) payload.coverImage = coverPreview;
          else if (hadServerCover) payload.coverImage = "";
        }
        const sendsLargeCover =
          typeof payload.coverImage === "string" &&
          payload.coverImage.length > 0;
        await api.patch(
          `/planning/nodes/${editNodeId}`,
          payload,
          sendsLargeCover ? LARGE_IMAGE_REQUEST : undefined,
        );
      }
      onSuccess?.();
      onClose();
    } catch {
      setError(
        mode === "create"
          ? "Não foi possível criar a matéria. Tente de novo."
          : "Não foi possível guardar. Tente de novo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const heading = mode === "create" ? "Nova matéria" : "Editar matéria";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/55 px-3 py-10 sm:py-16"
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[min(100%,520px)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/80 text-zinc-400 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative h-36 w-full bg-zinc-900 sm:h-40">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-900/90">
              <span className="px-4 text-center text-xs text-zinc-500">
                Capa opcional (até 10 MB) — fica guardada com a matéria
              </span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/12 bg-zinc-950/90 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 backdrop-blur-sm transition hover:border-white/22 hover:text-white">
              <ImagePlus className="h-3.5 w-3.5" />
              {coverPreview ? "Trocar imagem" : "Imagem"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onCoverFile}
              />
            </label>
            {coverPreview ? (
              <button
                type="button"
                onClick={clearCover}
                className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-zinc-950/90 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 backdrop-blur-sm transition hover:border-red-500/30 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover capa
              </button>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-5 pt-5 sm:px-6 sm:pt-6">
          <div className="max-w-[480px] pl-0 sm:pl-1">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-white sm:text-xl"
            >
              {heading}
            </h2>
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da matéria"
              className="mt-4 w-full border-0 bg-transparent text-2xl font-semibold tracking-tight text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0 sm:text-[1.65rem]"
              maxLength={200}
              autoComplete="off"
            />
            <textarea
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              placeholder="Objetivo ou descrição curta (opcional)"
              rows={3}
              maxLength={500}
              className="mt-3 w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-zinc-400 placeholder:text-zinc-600 focus:outline-none focus:ring-0"
            />

            <div className="mt-6 space-y-3 border-t border-white/8 pt-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Propriedades
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-[4.5rem] text-xs text-zinc-500">
                  Ícone
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PLANNING_ICON_KEYS.map((key) => {
                    const Ico = ICON_PREVIEW[key];
                    const active = icon === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        title={ICON_LABELS[key]}
                        onClick={() => setIcon(key)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                          active
                            ? "border-[var(--primary)]/50 bg-[var(--primary)]/15 text-[var(--primary)]"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-200"
                        }`}
                      >
                        <Ico className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {error ? (
              <p className="mt-4 text-sm text-red-400/90" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-white/8 pt-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/12 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(123,97,255,0.35)] transition hover:opacity-95 disabled:opacity-50"
              >
                {submitting
                  ? mode === "create"
                    ? "A criar…"
                    : "A guardar…"
                  : mode === "create"
                    ? "Criar matéria"
                    : "Guardar alterações"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
