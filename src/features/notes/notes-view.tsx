"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowUpDown,
  Calendar,
  Eye,
  FileText,
  GitBranch,
  GripVertical,
  LayoutGrid,
  Move,
  Pencil,
  Pin,
  Plus,
  Search,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import {
  applyManualReorder,
  deleteNoteById,
  formatDateKeyForTitle,
  getOrCreateDailyNote,
  getOrCreateTopicNote,
  loadNotes,
  saveNotes,
  sortNotesForDisplay,
  todayDateKey,
  type NoteRecord,
  type NoteSortMode,
} from "@/lib/notes-storage";

const NotesBlockEditor = dynamic(
  () => import("@/features/notes/notes-block-editor").then((m) => m.NotesBlockEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[min(50vh,400px)] items-center justify-center text-sm text-zinc-500">
        Carregando editor…
      </div>
    ),
  },
);

type FilterKind = "all" | "daily" | "topic";

function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Escolha uma imagem"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler a imagem"));
    reader.readAsDataURL(file);
  });
}

function SortableNoteRow({
  note,
  selectedId,
  onSelect,
}: {
  note: NoteRecord;
  selectedId: string | null;
  onSelect: (n: NoteRecord) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="list-none">
      <div
        className={cx(
          "flex w-full items-stretch gap-0.5 rounded-md transition-colors",
          selectedId === note.id ? "bg-zinc-800/50" : "hover:bg-zinc-800/25",
        )}
      >
        <button
          type="button"
          className="flex shrink-0 cursor-grab touch-none items-center justify-center px-1 text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onSelect(note)}
          className={cx(
            "flex min-w-0 flex-1 flex-col gap-0.5 py-3 pl-1 pr-2 text-left text-[13px] leading-snug",
            selectedId === note.id ? "text-zinc-100" : "text-zinc-400",
          )}
        >
          <span className="flex items-start gap-2">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5 font-medium leading-tight">
                {note.pinned ? <Pin className="h-3 w-3 shrink-0 text-amber-500/90" /> : null}
                {note.kind === "daily" && note.dateKey ? (
                  <span className="text-[10px] font-normal uppercase tracking-wide text-zinc-500">{note.dateKey}</span>
                ) : null}
                <span className="line-clamp-2">{note.title || "Sem título"}</span>
              </span>
              {note.kind === "topic" && note.nodeTitle ? (
                <span className="text-[10px] text-zinc-500 line-clamp-1">Planning · {note.nodeTitle}</span>
              ) : null}
              {note.tags.length > 0 ? (
                <span className="text-[10px] text-zinc-500 line-clamp-1">{note.tags.join(" · ")}</span>
              ) : null}
            </span>
          </span>
        </button>
      </div>
    </li>
  );
}

export function NotesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nodeFromUrl = searchParams.get("node");
  const topicFromUrl = searchParams.get("topic");

  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKind>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<NoteSortMode>("updated");
  const [tagInput, setTagInput] = useState("");
  const [diaryDate, setDiaryDate] = useState(todayDateKey());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [adjustCover, setAdjustCover] = useState(false);
  const [coverDragPreview, setCoverDragPreview] = useState<{ x: number; y: number } | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverDragRef = useRef<{
    pointerId: number;
    startPx: number;
    startPy: number;
    startX: number;
    startY: number;
  } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNoteRef = useRef<NoteRecord | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setMounted(true);
    setNotes(loadNotes());
    setDiaryDate(todayDateKey());
  }, []);

  useEffect(() => {
    setPreviewOpen(false);
    setAdjustCover(false);
  }, [selectedId]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [previewOpen]);

  useEffect(() => {
    if (!mounted) return;
    if (!nodeFromUrl) return;
    const { notes: next, note } = getOrCreateTopicNote(nodeFromUrl, topicFromUrl ?? "");
    setNotes(next);
    setSelectedId(note.id);
    setFilter("topic");
  }, [mounted, nodeFromUrl, topicFromUrl]);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId],
  );

  const filtered = useMemo(() => {
    let list = notes;
    if (filter === "daily") list = list.filter((n) => n.kind === "daily");
    if (filter === "topic") list = list.filter((n) => n.kind === "topic");
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((n) => {
        const inTags = n.tags.some((t) => t.toLowerCase().includes(q));
        return (
          inTags ||
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.nodeTitle?.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return sortNotesForDisplay(list, sortMode, notes);
  }, [notes, filter, query, sortMode]);

  const flushSave = useCallback(() => {
    const pending = pendingNoteRef.current;
    if (!pending) return;
    pendingNoteRef.current = null;
    const all = loadNotes();
    const idx = all.findIndex((n) => n.id === pending.id);
    const updated: NoteRecord = { ...pending, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      const copy = [...all];
      copy[idx] = updated;
      saveNotes(copy);
      setNotes(copy);
    } else {
      saveNotes([updated, ...all]);
      setNotes([updated, ...all]);
    }
  }, []);

  const scheduleSave = useCallback(
    (note: NoteRecord) => {
      pendingNoteRef.current = note;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        flushSave();
      }, 400);
    },
    [flushSave],
  );

  const onMarkdownChangeStable = useCallback(
    (md: string) => {
      if (!selected) return;
      const merged: NoteRecord = { ...selected, content: md, tags: selected.tags };
      scheduleSave(merged);
      setNotes((prev) => prev.map((n) => (n.id === merged.id ? { ...n, content: md } : n)));
    },
    [selected, scheduleSave],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const pending = pendingNoteRef.current;
      if (!pending) return;
      pendingNoteRef.current = null;
      const all = loadNotes();
      const idx = all.findIndex((n) => n.id === pending.id);
      const updated: NoteRecord = { ...pending, updatedAt: new Date().toISOString() };
      if (idx >= 0) {
        const copy = [...all];
        copy[idx] = updated;
        saveNotes(copy);
      } else {
        saveNotes([updated, ...all]);
      }
    };
  }, []);

  const updateSelected = useCallback(
    (patch: Partial<NoteRecord>) => {
      if (!selected) return;
      const merged: NoteRecord = {
        ...selected,
        ...patch,
        tags: patch.tags ?? selected.tags,
      };
      scheduleSave(merged);
      setNotes((prev) => prev.map((n) => (n.id === merged.id ? { ...n, ...patch, tags: merged.tags } : n)));
    },
    [selected, scheduleSave],
  );

  const applyCoverFromFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file || !selected) return;
      try {
        const data = await readImageFileAsDataUrl(file);
        updateSelected({ coverImage: data, coverPosX: 50, coverPosY: 50 });
        setAdjustCover(false);
        setCoverDragPreview(null);
      } catch {
        /* ignorar */
      }
    },
    [selected, updateSelected],
  );

  const clearCover = useCallback(() => {
    if (!selected) return;
    updateSelected({ coverImage: undefined, coverPosX: undefined, coverPosY: undefined });
    setAdjustCover(false);
    setCoverDragPreview(null);
  }, [selected, updateSelected]);

  const onCoverPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!adjustCover || !selected?.coverImage) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      coverDragRef.current = {
        pointerId: e.pointerId,
        startPx: e.clientX,
        startPy: e.clientY,
        startX: selected.coverPosX ?? 50,
        startY: selected.coverPosY ?? 50,
      };
      setCoverDragPreview({ x: selected.coverPosX ?? 50, y: selected.coverPosY ?? 50 });
    },
    [adjustCover, selected],
  );

  const onCoverPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = coverDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    e.preventDefault();
    const dx = e.clientX - d.startPx;
    const dy = e.clientY - d.startPy;
    const scale = 0.2;
    setCoverDragPreview({
      x: clamp(d.startX - dx * scale, 0, 100),
      y: clamp(d.startY - dy * scale, 0, 100),
    });
  }, []);

  const onCoverPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = coverDragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      coverDragRef.current = null;
      const dx = e.clientX - d.startPx;
      const dy = e.clientY - d.startPy;
      const scale = 0.2;
      const nx = clamp(d.startX - dx * scale, 0, 100);
      const ny = clamp(d.startY - dy * scale, 0, 100);
      updateSelected({ coverPosX: nx, coverPosY: ny });
      setCoverDragPreview(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [updateSelected],
  );

  useEffect(() => {
    if (!adjustCover) setCoverDragPreview(null);
  }, [adjustCover]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const ids = filtered.map((n) => n.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const newOrder = arrayMove(ids, oldIndex, newIndex);
      const next = applyManualReorder(notes, ids, newOrder);
      saveNotes(next);
      setNotes(next);
      setSortMode("manual");
    },
    [filtered, notes],
  );

  const selectNote = useCallback(
    (n: NoteRecord) => {
      setSelectedId(n.id);
      if (n.kind === "topic" && n.nodeId) {
        const params = new URLSearchParams();
        params.set("node", n.nodeId);
        if (n.nodeTitle) params.set("topic", n.nodeTitle);
        router.replace(`/notes?${params.toString()}`, { scroll: false });
      } else {
        router.replace("/notes", { scroll: false });
      }
    },
    [router],
  );

  const openDiaryForDate = useCallback((dateKey: string) => {
    const { notes: next, note } = getOrCreateDailyNote(dateKey);
    setNotes(next);
    setSelectedId(note.id);
    setFilter("daily");
  }, []);

  const openToday = useCallback(() => {
    const key = todayDateKey();
    setDiaryDate(key);
    openDiaryForDate(key);
  }, [openDiaryForDate]);

  const newTopicStub = useCallback(() => {
    const now = new Date().toISOString();
    const note: NoteRecord = {
      id: crypto.randomUUID(),
      kind: "topic",
      title: "Sem título",
      content: "",
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    const all = [note, ...loadNotes()];
    saveNotes(all);
    setNotes(all);
    setSelectedId(note.id);
    setFilter("topic");
  }, []);

  const removeSelected = useCallback(() => {
    if (!selected) return;
    flushSave();
    const next = deleteNoteById(selected.id);
    setNotes(next);
    setSelectedId(next[0]?.id ?? null);
  }, [selected, flushSave]);

  const togglePin = useCallback(() => {
    if (!selected) return;
    const nextNote = { ...selected, pinned: !selected.pinned };
    scheduleSave(nextNote);
    setNotes((prev) => prev.map((n) => (n.id === nextNote.id ? nextNote : n)));
  }, [selected, scheduleSave]);

  const addTagFromInput = useCallback(() => {
    if (!selected) return;
    const t = tagInput.trim();
    if (!t) return;
    if (selected.tags.includes(t)) {
      setTagInput("");
      return;
    }
    updateSelected({ tags: [...selected.tags, t] });
    setTagInput("");
  }, [selected, tagInput, updateSelected]);

  const removeTag = useCallback(
    (tag: string) => {
      if (!selected) return;
      updateSelected({ tags: selected.tags.filter((x) => x !== tag) });
    },
    [selected, updateSelected],
  );

  const onTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTagFromInput();
      }
    },
    [addTagFromInput],
  );

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-500">
        Carregando notas…
      </div>
    );
  }

  return (
    <div className="flex min-h-[min(100dvh,960px)] flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-zinc-800/40 bg-zinc-950 lg:w-[300px] lg:border-r lg:border-b-0">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-zinc-500" />
            <h2 className="text-[13px] font-medium tracking-tight text-zinc-300">Notas</h2>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-600">Diário, páginas e tags · local</p>
        </div>

        <div className="space-y-2 px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openToday}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800/60 px-3 py-2 text-[11px] font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              <Calendar className="h-3.5 w-3.5" />
              Hoje
            </button>
            <button
              type="button"
              onClick={newTopicStub}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800/80 px-3 py-2 text-[11px] font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova página
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="notes-diary-date">
              Data do diário
            </label>
            <input
              id="notes-diary-date"
              type="date"
              value={diaryDate}
              onChange={(e) => {
                const v = e.target.value;
                setDiaryDate(v);
                if (v) openDiaryForDate(v);
              }}
              className="h-9 w-full rounded-md border border-zinc-800/80 bg-zinc-950 px-2 text-[11px] text-zinc-300 outline-none focus-visible:ring-1 focus-visible:ring-zinc-600"
            />
          </div>
        </div>

        <div className="border-t border-zinc-900 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="h-9 w-full rounded-md border border-zinc-900 bg-zinc-950/80 pl-9 pr-2 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as NoteSortMode)}
              className="h-9 w-full rounded-md border border-zinc-900 bg-zinc-950/80 px-2 text-[11px] text-zinc-400 outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
              aria-label="Ordenar lista"
            >
              <option value="updated">Última edição</option>
              <option value="title">Título (A–Z)</option>
              <option value="date">Data (diário)</option>
              <option value="manual">Personalizada</option>
            </select>
          </div>
        </div>

        <div className="flex gap-0.5 border-t border-zinc-900 px-2 py-2">
          {(
            [
              ["all", "Todas", LayoutGrid],
              ["daily", "Diário", Calendar],
              ["topic", "Assuntos", FileText],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cx(
                "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-2 text-[10px] font-medium transition-colors",
                filter === k ? "bg-zinc-800/50 text-zinc-200" : "text-zinc-600 hover:bg-zinc-900 hover:text-zinc-400",
              )}
            >
              <Icon className="h-3 w-3 shrink-0 opacity-80" />
              {label}
            </button>
          ))}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((n) => n.id)} strategy={verticalListSortingStrategy}>
            <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-6">
              {filtered.map((n) => (
                <SortableNoteRow key={n.id} note={n} selectedId={selectedId} onSelect={selectNote} />
              ))}
              {filtered.length === 0 ? (
                <li className="py-12 text-center text-[11px] text-zinc-600">Nenhuma nota nesta vista.</li>
              ) : null}
            </ul>
          </SortableContext>
        </DndContext>
      </aside>

      <section className="relative flex min-h-[min(85vh,900px)] min-w-0 flex-1 flex-col border-t border-zinc-900 bg-[#0c0c0e] lg:border-t-0">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-zinc-600">
            <StickyNote className="h-10 w-10 opacity-25" />
            <p className="text-sm">Escolha uma página na lista ou crie uma nova.</p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {(() => {
              const coverPx = coverDragPreview?.x ?? selected.coverPosX ?? 50;
              const coverPy = coverDragPreview?.y ?? selected.coverPosY ?? 50;
              const hasCover = Boolean(selected.coverImage);
              return (
                <div className="shrink-0">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-hidden
                    tabIndex={-1}
                    onChange={(e) => {
                      void applyCoverFromFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />

                  {/* Capa full-width (estilo Notion) */}
                  {hasCover ? (
                    <div className="group/coverhead relative h-[240px] w-full shrink-0 overflow-hidden sm:h-[280px] md:h-[300px]">
                      <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-[background-position] duration-100"
                        style={{
                          backgroundImage: `url(${selected.coverImage})`,
                          backgroundPosition: `${coverPx}% ${coverPy}%`,
                        }}
                      />
                      {!adjustCover ? (
                        <div
                          className={cx(
                            "absolute right-2 top-2 z-20 flex flex-wrap items-center justify-end gap-0.5 transition-opacity sm:right-4 sm:top-3",
                            "opacity-100",
                            "md:opacity-0 md:group-hover/coverhead:opacity-100 md:group-focus-within/coverhead:opacity-100",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setAdjustCover(true)}
                            className="rounded px-2 py-1 text-[12px] text-white/90 transition hover:bg-black/40"
                          >
                            Reposicionar
                          </button>
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="rounded px-2 py-1 text-[12px] text-white/90 transition hover:bg-black/40"
                          >
                            Alterar capa
                          </button>
                          <button
                            type="button"
                            onClick={clearCover}
                            className="rounded px-2 py-1 text-[12px] text-red-200/90 transition hover:bg-black/40"
                          >
                            Remover
                          </button>
                        </div>
                      ) : null}
                      {adjustCover ? (
                        <div
                          className="absolute inset-0 z-30 touch-none"
                          style={{ cursor: "grab" }}
                          onPointerDown={onCoverPointerDown}
                          onPointerMove={onCoverPointerMove}
                          onPointerUp={onCoverPointerUp}
                          onPointerCancel={onCoverPointerUp}
                        >
                          <div className="pointer-events-none flex justify-center pt-4">
                            <span className="rounded bg-black/50 px-2 py-1 text-[12px] text-zinc-100">
                              Arraste para reposicionar
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Coluna da página — largura e ritmo tipo Notion */}
                  <div
                    className={cx(
                      "notes-notion-header relative mx-auto flex w-full max-w-[900px] flex-col border-b border-zinc-800/50 pl-0 pr-4 pb-10 sm:pl-1 sm:pr-8 md:pl-2 md:pr-16",
                      hasCover ? "pt-5 sm:pt-6" : "pt-10 sm:pt-12",
                    )}
                  >
                    <div className="flex items-start gap-1">
                      <input
                        type="text"
                        value={selected.title}
                        onChange={(e) => updateSelected({ title: e.target.value })}
                        className="min-w-0 flex-1 border-0 bg-transparent py-1 font-sans text-[2rem] font-bold leading-tight tracking-[-0.02em] text-zinc-100 placeholder:text-zinc-600 outline-none sm:text-[2.5rem] md:text-[2.75rem] md:leading-[1.15]"
                        placeholder="Sem título"
                      />
                      <div className="flex shrink-0 gap-0 opacity-70 transition-opacity hover:opacity-100">
                        <button
                          type="button"
                          onClick={togglePin}
                          className={cx(
                            "rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300",
                            selected.pinned && "text-amber-500/90 opacity-100",
                          )}
                          aria-label="Fixar"
                        >
                          <Pin className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={removeSelected}
                          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-950/40 hover:text-red-400/90"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    </div>

                    {hasCover && adjustCover ? (
                      <button
                        type="button"
                        onClick={() => setAdjustCover(false)}
                        className="mt-3 w-fit rounded-md bg-zinc-800/80 px-2.5 py-1.5 text-[13px] text-zinc-200 transition hover:bg-zinc-700/80"
                      >
                        Concluir reposição
                      </button>
                    ) : null}

                    {/* Propriedades — encostadas à esquerda da coluna */}
                    <div className="mt-1 flex w-full flex-wrap items-center justify-start gap-x-2 gap-y-1 self-start text-left text-[13px] leading-relaxed text-zinc-500">
                      {!hasCover ? (
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="rounded px-0.5 py-0.5 text-zinc-500 underline decoration-zinc-600 underline-offset-2 transition hover:bg-zinc-800/40 hover:text-zinc-400"
                        >
                          Adicionar capa
                        </button>
                      ) : null}
                      {selected.kind === "daily" && selected.dateKey ? (
                        <span>{formatDateKeyForTitle(selected.dateKey)}</span>
                      ) : null}
                      {selected.kind === "topic" && selected.nodeId ? (
                        <>
                          <span className="flex flex-wrap items-center gap-x-1.5">
                            <span>Planning</span>
                            <code className="rounded bg-zinc-800/80 px-1 py-px font-mono text-[12px] text-zinc-400">
                              {selected.nodeId.slice(0, 8)}…
                            </code>
                          </span>
                          <button
                            type="button"
                            onClick={() => router.push(`/planning?node=${encodeURIComponent(selected.nodeId!)}`)}
                            className="inline-flex items-center gap-1 rounded px-0.5 py-0.5 text-zinc-500 underline decoration-zinc-600 underline-offset-2 transition hover:bg-zinc-800/40 hover:text-zinc-400"
                          >
                            <GitBranch className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                            Abrir no Flow
                          </button>
                        </>
                      ) : null}
                    </div>

                    {/* Etiquetas — chips suaves */}
                    <div className="mt-4 flex min-h-[32px] flex-wrap items-center gap-1.5">
                      {selected.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex h-7 max-w-full items-center gap-0.5 rounded-[4px] bg-zinc-800/55 pl-2 pr-1 text-[13px] text-zinc-300"
                        >
                          <span className="truncate">{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="flex shrink-0 rounded p-0.5 text-zinc-500 transition hover:bg-zinc-700/80 hover:text-zinc-200"
                            aria-label={`Remover tag ${tag}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                      <div className="flex h-7 min-w-32 max-w-[220px] flex-1 items-stretch gap-1 border-b border-zinc-700/80 focus-within:border-zinc-500">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={onTagKeyDown}
                          placeholder="Adicionar etiqueta…"
                          className="min-w-0 flex-1 border-0 bg-transparent px-0.5 text-[13px] text-zinc-300 placeholder:text-zinc-600 outline-none"
                        />
                        <button
                          type="button"
                          onClick={addTagFromInput}
                          className="shrink-0 px-1 text-[12px] text-zinc-500 transition hover:text-zinc-300"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="relative flex min-h-0 flex-1 flex-col border-t border-zinc-900">
              <div className="shrink-0 border-b border-zinc-900/80 bg-[#0c0c0e]/80 py-2.5 pl-0 pr-4 backdrop-blur-sm sm:pl-1 sm:pr-8 md:pl-2 md:pr-16">
                <div className="mx-auto flex w-full max-w-[900px] items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Editar
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[11px] font-medium text-zinc-200 shadow-sm transition hover:border-zinc-700 hover:bg-zinc-800/80"
                  >
                    <Eye className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                    Pré-visualizar
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pb-10 pl-0 pr-4 sm:pl-1 sm:pr-8 md:pl-2 md:pr-16">
                <div className="mx-auto w-full max-w-[900px]">
                  <NotesBlockEditor
                    key={selected.id}
                    initialMarkdown={selected.content}
                    onMarkdownChange={onMarkdownChangeStable}
                  />
                </div>
              </div>

              {previewOpen ? (
                <div
                  className="fixed inset-0 z-100 flex flex-col bg-zinc-950"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Pré-visualização da nota"
                >
                  <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur-md md:px-8">
                    <span className="text-sm font-medium text-zinc-200">Pré-visualização</span>
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(false)}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      Fechar
                    </button>
                  </header>
                  <div className="notes-md-scroll min-h-0 flex-1 overflow-y-auto bg-[#09090b]">
                    <article className="notes-md mx-auto w-full max-w-[700px] px-4 py-8 pb-16 text-[15px] leading-[1.65] md:px-10 md:py-10">
                      <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-medium prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-100">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[[rehypeHighlight, { detect: true }]]}
                        >
                          {selected.content || "*Sem conteúdo ainda.*"}
                        </ReactMarkdown>
                      </div>
                    </article>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
