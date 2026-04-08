"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Check,
  Circle,
  FileText,
  Lightbulb,
  MessageSquare,
  Mic,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";

type ChatThread = {
  id: string;
  title: string;
  updatedAt: string;
};

type ChatMsg = { id: string; role: "user" | "assistant"; text: string; createdAt: string };

function formatChatListDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STORAGE_THREADS = "studyflow.ai.threads";
const STORAGE_MESSAGES = "studyflow.ai.messagesByThread";

const SEED_CHATS: ChatThread[] = [
  { id: "seed-1", title: "Plano de estudo — Era Vargas", updatedAt: new Date().toISOString() },
  { id: "seed-2", title: "Revisão antes da prova", updatedAt: new Date(Date.now() - 86400000).toISOString() },
];

const SEED_MESSAGES: Record<string, ChatMsg[]> = {
  "seed-1": [
    {
      id: "m1",
      role: "user",
      text: "Preciso de um plano de estudo para a Era Vargas esta semana.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "m2",
      role: "assistant",
      text: "Perfeito. Vou montar um mini-plano com leitura, mapa mental e questões, com foco em pontos mais cobrados.",
      createdAt: new Date().toISOString(),
    },
  ],
  "seed-2": [
    {
      id: "m3",
      role: "assistant",
      text: "Me diga a matéria e o tempo disponível que eu monto uma revisão objetiva.",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
};

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function deriveTitleFromFirstMessage(text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "Nova conversa";
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}

export function ChatView() {
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [messagesByThread, setMessagesByThread] = useState<Record<string, ChatMsg[]>>({});
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedThreads = safeJsonParse<ChatThread[]>(localStorage.getItem(STORAGE_THREADS));
    const storedMessages = safeJsonParse<Record<string, ChatMsg[]>>(localStorage.getItem(STORAGE_MESSAGES));
    const threads = storedThreads?.length ? storedThreads : SEED_CHATS;
    const msgs = storedMessages && Object.keys(storedMessages).length ? storedMessages : SEED_MESSAGES;
    setChats(threads);
    setMessagesByThread(msgs);
    setActiveChatId(threads[0]?.id ?? "");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_THREADS, JSON.stringify(chats));
  }, [mounted, chats]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messagesByThread));
  }, [mounted, messagesByThread]);

  useEffect(() => {
    if (!mounted) return;
    const prefill = searchParams.get("prefill");
    if (!prefill) return;
    // Preenche o composer (não envia automaticamente).
    setInput(prefill);
  }, [mounted, searchParams]);

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [chats],
  );

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedChats;
    return sortedChats.filter((c) => c.title.toLowerCase().includes(q));
  }, [searchQuery, sortedChats]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId),
    [chats, activeChatId],
  );

  const activeMessages = useMemo(() => messagesByThread[activeChatId] ?? [], [messagesByThread, activeChatId]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeChatId, activeMessages.length, scrollToBottom]);

  const handleNewChat = useCallback(() => {
    const id = crypto.randomUUID();
    const next: ChatThread = {
      id,
      title: "Nova conversa",
      updatedAt: new Date().toISOString(),
    };
    setChats((prev) => [next, ...prev]);
    setActiveChatId(id);
    setMessagesByThread((prev) => ({ ...prev, [id]: [] }));
    setInput("");
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    setMessagesByThread((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActiveChatId((current) => {
      if (current !== id) return current;
      const remaining = chats.filter((c) => c.id !== id);
      return remaining[0]?.id ?? "";
    });
  }, [chats]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !activeChatId) return;
    setInput("");
    const now = new Date().toISOString();
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text, createdAt: now };

    setMessagesByThread((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] ?? []), userMsg],
    }));

    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const nextTitle = c.title === "Nova conversa" ? deriveTitleFromFirstMessage(text) : c.title;
        return { ...c, title: nextTitle, updatedAt: now };
      }),
    );

    setLoading(true);
    try {
      const history = (messagesByThread[activeChatId] ?? [])
        .slice(-20)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.text }],
        }));

      const res = await api.post("/ai/chat", { message: text, history });
      const replyText: string = res.data?.reply ?? "Sem resposta.";
      const assistantMsg: ChatMsg = { id: crypto.randomUUID(), role: "assistant", text: replyText, createdAt: new Date().toISOString() };
      setMessagesByThread((prev) => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] ?? []), assistantMsg],
      }));
    } catch {
      const assistantMsg: ChatMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Não consegui conectar ao assistente. Verifique se o servidor está rodando.",
        createdAt: new Date().toISOString(),
      };
      setMessagesByThread((prev) => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] ?? []), assistantMsg],
      }));
    } finally {
      setLoading(false);
    }
  }, [activeChatId, input, loading, messagesByThread]);

  return (
    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      {/* Ambiente visual contínuo com o app — sem “box” ao redor do chat */}
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
      >
        <div className="absolute left-1/2 top-[18%] h-[min(52vh,420px)] w-[min(90vw,640px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(123,97,255,0.12),transparent_68%)]" />
        <div className="absolute right-[8%] top-[32%] h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,149,0,0.08),transparent_70%)]" />
      </div>

      {/* Navbar do chat — mantida */}
      <header className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 md:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Chat IA</h1>
            {activeChat ? (
              <p className="mt-0.5 max-w-[min(100vw-8rem,20rem)] truncate text-xs text-zinc-500">
                {activeChat.title}
              </p>
            ) : null}
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--success)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--success)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            Online
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="glass flex h-10 w-10 items-center justify-center rounded-xl text-zinc-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Buscar"
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
      </header>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1">
        {/* Coluna principal: mensagens + composer colados ao fundo */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              {activeMessages.length ? (
                activeMessages.map((m, idx) =>
                  m.role === "user" ? (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(0.12, idx * 0.01) }}
                      className="flex items-end justify-end gap-2.5"
                    >
                      <div className="max-w-[min(100%,28rem)] rounded-2xl rounded-br-md bg-[var(--primary)] px-4 py-3 text-sm leading-relaxed text-white shadow-lg shadow-[var(--primary)]/25">
                        {m.text}
                      </div>
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-warm)] to-[var(--primary)] text-xs font-bold text-white shadow-md shadow-[var(--primary)]/30"
                        aria-hidden
                      >
                        LM
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(0.12, idx * 0.01) }}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/25 text-[var(--primary)]">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 max-w-[min(100%,36rem)] flex-1">
                        <div className="rounded-2xl rounded-tl-md border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-zinc-200 backdrop-blur-sm">
                          {m.text}
                        </div>
                      </div>
                    </motion.div>
                  ),
                )
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-zinc-200">Comece uma nova conversa</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Envie uma mensagem para renomear esta conversa automaticamente.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Composer colado ao rodapé da área útil */}
          <div className="shrink-0 border-t border-white/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
            <div className="mx-auto w-full max-w-3xl">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 shadow-inner backdrop-blur-md">
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300 transition hover:bg-white/15 hover:text-white"
                  aria-label="Anexar"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  placeholder="Digite sua mensagem para o Study Flow..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void send();
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-zinc-400 transition hover:text-zinc-200"
                  aria-label="Voz"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!input.trim() || loading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/35 transition hover:brightness-110"
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2.5 text-center text-[11px] text-zinc-500">
                Pressione Enter para enviar · Shift + Enter para quebra de linha
              </p>
            </div>
          </div>
        </div>

        {/* Histórico de conversas */}
        <aside className="hidden h-full min-h-0 w-[min(100%,280px)] shrink-0 border-l border-white/[0.06] bg-transparent lg:flex lg:w-[280px] lg:flex-col lg:px-4 lg:py-5">
          <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] pb-4">
            <MessageSquare
              className="h-4 w-4 shrink-0 text-[var(--accent-gold)]"
              aria-hidden
            />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
              Histórico de chat
            </h3>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/15 py-2.5 text-sm font-medium text-[var(--primary)] transition hover:border-[var(--primary)]/55 hover:bg-[var(--primary)]/25 hover:text-white"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Novo chat
          </button>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Search className="h-4 w-4 text-zinc-500" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </div>
          <p className="mb-2 mt-5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Conversas
          </p>
          <nav
            className="min-h-0 flex-1 overflow-y-auto pr-1"
            aria-label="Conversas anteriores"
          >
            <ul className="space-y-1">
              {filteredChats.map((chat) => {
                const isActive = chat.id === activeChatId;
                return (
                  <li key={chat.id}>
                    <div
                      className={`group relative rounded-lg px-3 py-2.5 text-left transition ${
                        isActive
                          ? "border border-[var(--primary)]/35 bg-[var(--primary)]/12 text-zinc-100"
                          : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveChatId(chat.id)}
                        className="flex w-full flex-col gap-0.5 text-left"
                      >
                        <span className="line-clamp-2 text-sm font-medium leading-snug">
                          {chat.title}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {formatChatListDate(chat.updatedAt)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChat(chat.id)}
                        className="absolute right-2 top-2 hidden rounded-md p-1 text-zinc-500 transition hover:bg-white/10 hover:text-red-300 group-hover:block"
                        aria-label="Apagar conversa"
                        title="Apagar conversa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
