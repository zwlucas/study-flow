export type NoteKind = "daily" | "topic";

export type NoteRecord = {
  id: string;
  kind: NoteKind;
  title: string;
  content: string;
  /** YYYY-MM-DD — apenas `daily` */
  dateKey?: string;
  /** ID do nó do roadmap — apenas `topic` */
  nodeId?: string;
  /** Título denormalizado para referência do Planning */
  nodeTitle?: string;
  /** Tags livres (assuntos sem Planning) */
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  /** Capa atrás do título (data URL ou URL) — não entra na área Editar */
  coverImage?: string;
  /** Posição da capa em % (0–100), para `background-position` */
  coverPosX?: number;
  coverPosY?: number;
};

const STORAGE_KEY = "studyflow.notes.v1";

/** Template Markdown ao criar um novo diário (seções fixas). */
export const DAILY_NOTE_TEMPLATE = `## Objetivo

- [ ] 

## O que estudei

- 

## Dúvidas

- 
`;

export function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateKeyForTitle(dateKey: string): string {
  const [y, mo, da] = dateKey.split("-").map(Number);
  if (!y || !mo || !da) return dateKey;
  return new Date(y, mo - 1, da).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeNote(raw: NoteRecord & { tags?: string[] }): NoteRecord {
  return {
    ...raw,
    tags: Array.isArray(raw.tags) ? raw.tags.map((t) => String(t).trim()).filter(Boolean) : [],
  };
}

export function loadNotes(): NoteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as (NoteRecord & { tags?: string[] })[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((n) =>
      normalizeNote({
        ...n,
        tags: n.tags ?? [],
      }),
    );
  } catch {
    return [];
  }
}

export function saveNotes(notes: NoteRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function getOrCreateDailyNote(dateKey: string): { notes: NoteRecord[]; note: NoteRecord } {
  const all = loadNotes();
  const found = all.find((n) => n.kind === "daily" && n.dateKey === dateKey);
  if (found) return { notes: all, note: found };
  const now = new Date().toISOString();
  const note: NoteRecord = {
    id: crypto.randomUUID(),
    kind: "daily",
    title: `Diário — ${formatDateKeyForTitle(dateKey)}`,
    content: DAILY_NOTE_TEMPLATE,
    dateKey,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  const notes = [note, ...all];
  saveNotes(notes);
  return { notes, note };
}

export function getOrCreateTopicNote(nodeId: string, nodeTitle: string): { notes: NoteRecord[]; note: NoteRecord } {
  const all = loadNotes();
  const found = all.find((n) => n.kind === "topic" && n.nodeId === nodeId);
  const now = new Date().toISOString();
  if (found) {
    const planningTitle = nodeTitle.trim();
    if (planningTitle && found.nodeTitle !== planningTitle) {
      const updated: NoteRecord = {
        ...found,
        nodeTitle: planningTitle,
        updatedAt: now,
      };
      const next = all.map((n) => (n.id === updated.id ? updated : n));
      saveNotes(next);
      return { notes: next, note: updated };
    }
    return { notes: all, note: found };
  }
  const t = nodeTitle.trim() || "Assunto";
  const note: NoteRecord = {
    id: crypto.randomUUID(),
    kind: "topic",
    title: t,
    content: "",
    nodeId,
    nodeTitle: t,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  const notes = [note, ...all];
  saveNotes(notes);
  return { notes, note };
}

export function deleteNoteById(id: string): NoteRecord[] {
  const all = loadNotes().filter((n) => n.id !== id);
  saveNotes(all);
  return all;
}

export type NoteSortMode = "updated" | "title" | "date" | "manual";

/** Reordena o array completo mantendo a ordem relativa dos itens fora do subconjunto. */
export function applyManualReorder(
  fullNotes: NoteRecord[],
  visibleOrderedIds: string[],
  newVisibleOrder: string[],
): NoteRecord[] {
  const visibleSet = new Set(visibleOrderedIds);
  const byId = new Map(fullNotes.map((n) => [n.id, n]));
  const out: NoteRecord[] = [];
  let injected = false;
  for (const n of fullNotes) {
    if (!visibleSet.has(n.id)) {
      out.push(n);
      continue;
    }
    if (!injected) {
      for (const id of newVisibleOrder) {
        const note = byId.get(id);
        if (note) out.push(note);
      }
      injected = true;
    }
  }
  return out;
}

/** Ordenação para a lista (fixados primeiro). */
export function sortNotesForDisplay(
  list: NoteRecord[],
  mode: NoteSortMode,
  /** Ordem canónica do armazenamento (para `mode === "manual"`). */
  storageOrder?: NoteRecord[],
): NoteRecord[] {
  if (mode === "manual" && storageOrder?.length) {
    const orderMap = new Map(storageOrder.map((n, i) => [n.id, i]));
    return [...list].sort((a, b) => {
      const pa = a.pinned ? 0 : 1;
      const pb = b.pinned ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0);
    });
  }

  const pinnedRank = (a: NoteRecord, b: NoteRecord) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  };

  return [...list].sort((a, b) => {
    const pr = pinnedRank(a, b);
    if (pr !== 0) return pr;

    if (mode === "title") {
      return a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
    }

    if (mode === "date") {
      const da = a.kind === "daily" && a.dateKey ? a.dateKey : "";
      const db = b.kind === "daily" && b.dateKey ? b.dateKey : "";
      if (da && db) return db.localeCompare(da);
      if (da && !db) return -1;
      if (!da && db) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
