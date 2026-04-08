"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  CreditCard,
  LogOut,
  Moon,
  Sparkles,
  Receipt,
  Save,
  Shield,
  Sun,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
  plan?: string;
};

type PlanTier = "Free" | "Pro" | "Ultra";

function getInitials(nameOrEmail?: string) {
  const s = (nameOrEmail ?? "").trim();
  if (!s) return "SF";
  const parts = s.split(/\s+/).filter(Boolean);
  const base = parts.length >= 2 ? parts[0][0] + parts[1][0] : s.slice(0, 2);
  return base.toUpperCase();
}

function maskEmail(value: string) {
  const s = value.trim();
  if (!s || s === "—") return s;
  const at = s.indexOf("@");
  if (at <= 1) return s;
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  const first = local[0];
  const last = local.length > 2 ? local[local.length - 1] : "";
  const masked = `${first}${"•".repeat(Math.max(2, local.length - 2))}${last}`;
  return `${masked}@${domain}`;
}

function safeParseUser(raw: string | null): StoredUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

/** CTA do comparador: plano atual vs ação explícita. */
function planComparisonCta(
  current: PlanTier,
  tier: PlanTier,
): { kind: "current" } | { kind: "action"; label: string } {
  if (current === tier) return { kind: "current" };
  if (tier === "Free") return { kind: "action", label: "Voltar para Free" };
  if (tier === "Pro") return { kind: "action", label: "Mudar para Pro" };
  return { kind: "action", label: "Mudar para Ultra" };
}

function SettingsCard({
  icon,
  title,
  description,
  children,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="glass-surface premium-shadow rounded-3xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-zinc-400">{description}</p> : null}
          </div>
        </div>
        {right ? <div className="flex items-center gap-3">{right}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function SettingsView() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<PlanTier>("Free");
  const [saving, setSaving] = useState(false);

  const [theme, setTheme] = useState<"system" | "dark" | "light">("dark");
  const [notifications, setNotifications] = useState(true);
  const [privacyFocusMode, setPrivacyFocusMode] = useState(false);
  const [maskSensitive, setMaskSensitive] = useState(true);
  const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = safeParseUser(localStorage.getItem("@studyflow:user"));
    setUser(u);
    setName(u?.name ?? "");
    const rawPlan = (u?.plan ?? "Free").trim();
    setPlan(rawPlan === "Pro" || rawPlan === "Ultra" || rawPlan === "Free" ? rawPlan : "Free");

    const t = localStorage.getItem("studyflow.settings.theme");
    if (t === "system" || t === "dark" || t === "light") setTheme(t);
    const n = localStorage.getItem("studyflow.settings.notifications");
    if (n === "0" || n === "1") setNotifications(n === "1");
    const p = localStorage.getItem("studyflow.settings.privacyFocusMode");
    if (p === "0" || p === "1") setPrivacyFocusMode(p === "1");
    const m = localStorage.getItem("studyflow.settings.maskSensitive");
    if (m === "0" || m === "1") setMaskSensitive(m === "1");
  }, []);

  /** Evita scroll da página por trás; modal em portal (fixed relativo à viewport). */
  useEffect(() => {
    if (!mounted || !planDrawerOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [mounted, planDrawerOpen]);

  const emailRaw = user?.email ?? "—";
  const email = useMemo(
    () => (maskSensitive ? maskEmail(emailRaw) : emailRaw),
    [emailRaw, maskSensitive],
  );
  const initials = useMemo(() => getInitials(user?.name || user?.email), [user?.email, user?.name]);
  const planLabel = useMemo(() => (plan?.trim() ? plan.trim() : "Free") as PlanTier, [plan]);

  const planMeta = useMemo(() => {
    const renewAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 23); // mock (23 dias)
    const renewalLabel = renewAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    const tiers: Record<PlanTier, { priceLabel: string; features: string[]; limits: { label: string; value: string }[] }> =
      {
        Free: {
          priceLabel: "R$ 0/mês",
          features: ["Chat IA básico", "Planning e calendário", "Analytics essenciais", "Backup local"],
          limits: [
            { label: "Mensagens IA / dia", value: "20" },
            { label: "Projetos/planos ativos", value: "3" },
            { label: "Exportações / mês", value: "1" },
          ],
        },
        Pro: {
          priceLabel: "R$ 19,90/mês",
          features: ["Chat IA avançado", "Histórico ilimitado", "Analytics detalhado", "Exportações ilimitadas"],
          limits: [
            { label: "Mensagens IA / dia", value: "200" },
            { label: "Projetos/planos ativos", value: "Ilimitado" },
            { label: "Exportações / mês", value: "Ilimitado" },
          ],
        },
        Ultra: {
          priceLabel: "R$ 39,90/mês",
          features: ["Tudo do Pro", "Sugestões em tempo real", "Modelos premium", "Prioridade no suporte"],
          limits: [
            { label: "Mensagens IA / dia", value: "Ilimitado" },
            { label: "Projetos/planos ativos", value: "Ilimitado" },
            { label: "Exportações / mês", value: "Ilimitado" },
          ],
        },
      };
    const usage = [
      { label: "Mensagens IA (hoje)", current: 7, max: planLabel === "Free" ? 20 : planLabel === "Pro" ? 200 : 999 },
      { label: "Exportações (mês)", current: 0, max: planLabel === "Free" ? 1 : 999 },
    ];
    return { renewalLabel, tiers, usage };
  }, [planLabel]);

  const planBadge = useMemo(() => {
    const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold";
    if (planLabel === "Ultra") {
      return {
        className: `${base} bg-[var(--accent-gold)]/18 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20`,
        dot: "bg-[var(--accent-gold)]",
      };
    }
    if (planLabel === "Pro") {
      return {
        className: `${base} bg-[var(--primary)]/18 text-[var(--primary)] border border-[var(--primary)]/20`,
        dot: "bg-[var(--primary)]",
      };
    }
    return {
      className: `${base} bg-white/5 text-zinc-300 border border-white/10`,
      dot: "bg-zinc-400",
    };
  }, [planLabel]);

  const saveProfile = async () => {
    if (!mounted) return;
    setSaving(true);
    try {
      const next: StoredUser = { ...(user ?? {}), name: name.trim(), plan: planLabel };
      localStorage.setItem("@studyflow:user", JSON.stringify(next));
      setUser(next);

      localStorage.setItem("studyflow.settings.theme", theme);
      localStorage.setItem("studyflow.settings.notifications", notifications ? "1" : "0");
      localStorage.setItem("studyflow.settings.privacyFocusMode", privacyFocusMode ? "1" : "0");
      localStorage.setItem("studyflow.settings.maskSensitive", maskSensitive ? "1" : "0");
    } finally {
      setSaving(false);
    }
  };

  const closePlanDrawer = useCallback(() => setPlanDrawerOpen(false), []);

  const selectPlan = useCallback(
    (tier: PlanTier) => {
      if (!mounted) return;
      setPlan(tier);
      const next: StoredUser = { ...(user ?? {}), name: name.trim(), plan: tier };
      localStorage.setItem("@studyflow:user", JSON.stringify(next));
      setUser(next);
      setPlanDrawerOpen(false);
    },
    [mounted, name, user],
  );

  const logout = () => {
    if (!mounted) return;
    localStorage.removeItem("@studyflow:token");
    localStorage.removeItem("@studyflow:user");
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Configurações</h1>
          <p className="mt-1 text-[var(--muted)]">
            Ajuste sua conta, preferências e privacidade.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveProfile}
            disabled={!mounted || saving}
            className="btn-gradient-cta inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SettingsCard
            icon={<User className="h-6 w-6 text-primary" />}
            title="Conta"
            description="Seus dados básicos."
            right={
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-warm)] to-[var(--primary)] text-xs font-bold text-white shadow-md shadow-[var(--primary)]/30">
                {initials}
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="ml-1 text-sm font-medium text-muted" htmlFor="settings-name">
                  Nome
                </label>
                <input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:bg-white/10 focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="ml-1 text-sm font-medium text-muted" htmlFor="settings-email">
                  E-mail
                </label>
                <input
                  id="settings-email"
                  value={email}
                  disabled
                  className="block w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-300 outline-none"
                />
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={<CreditCard className="h-6 w-6 text-[var(--accent-gold)]" />}
            title="Plano"
            description="Recursos, limites e cobrança."
            right={
              <div className={planBadge.className}>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${planBadge.dot}`} />
                <span>{planLabel}</span>
              </div>
            }
          >
            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Seu plano atual</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Renovação em <span className="text-zinc-200">{planMeta.renewalLabel}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{planMeta.tiers[planLabel].priceLabel}</p>
                    <button
                      type="button"
                      onClick={() => setPlanDrawerOpen(true)}
                      className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white"
                    >
                      <Sparkles className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden />
                      Comparar planos
                      <ChevronRight className="h-4 w-4 text-zinc-400" aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Recursos incluídos</p>
                    <ul className="mt-2 space-y-2">
                      {planMeta.tiers[planLabel].features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-zinc-200">
                          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-lg bg-[var(--primary)]/15 text-[var(--primary)]">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <span className="leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Limites</p>
                    <div className="mt-2 space-y-2">
                      {planMeta.tiers[planLabel].limits.map((l) => (
                        <div key={l.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          <span className="text-xs text-zinc-400">{l.label}</span>
                          <span className="text-xs font-semibold text-white">{l.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Uso atual</p>
                  <div className="mt-2 space-y-2">
                    {planMeta.usage.map((u) => {
                      const pct = Math.min(100, Math.round((u.current / u.max) * 100));
                      const maxLabel = u.max >= 900 ? "∞" : String(u.max);
                      return (
                        <div key={u.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-400">{u.label}</span>
                            <span className="text-xs font-semibold text-white">
                              {u.current}/{maxLabel}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-[var(--primary)]/35 hover:bg-[var(--primary)]/10 hover:text-white"
                  >
                    Gerenciar plano
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-[var(--primary)]/35 hover:bg-[var(--primary)]/10 hover:text-white"
                  >
                    Fazer upgrade
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-zinc-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">Histórico de pagamentos</p>
                    <p className="mt-0.5 text-xs text-zinc-400">Nenhuma cobrança encontrada.</p>
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                  <div className="grid grid-cols-[1fr_110px_88px] gap-3 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <span>Descrição</span>
                    <span>Data</span>
                    <span className="text-right">Valor</span>
                  </div>
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm font-medium text-zinc-200">Sem pagamentos ainda</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Quando houver cobranças, elas aparecerão aqui com recibos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>
        </div>

        <aside className="space-y-4">
          <SettingsCard
            icon={<Sun className="h-6 w-6 text-secondary" />}
            title="Preferências"
            description="Tema e notificações."
          >
            <div className="flex items-center gap-3">
              <div className="sr-only">Preferências</div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">Tema</p>
                  <p className="mt-0.5 text-xs text-zinc-500">System, escuro ou claro.</p>
                </div>
                <div className="flex shrink-0 gap-1 rounded-xl bg-black/25 p-1">
                  {[
                    { id: "system" as const, label: "Auto", icon: Shield },
                    { id: "dark" as const, label: "Dark", icon: Moon },
                    { id: "light" as const, label: "Light", icon: Sun },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = theme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id)}
                        className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "bg-[var(--primary)]/20 text-white"
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">Notificações</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Alertas e lembretes do app.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
              </label>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={<Shield className="h-6 w-6 text-[var(--accent-gold)]" />}
            title="Privacidade e segurança"
            description="Controles rápidos."
          >
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">Modo foco (privado)</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Oculta textos sensíveis em widgets.</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyFocusMode}
                  onChange={(e) => setPrivacyFocusMode(e.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">Ocultar dados sensíveis</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Mascara seu e-mail na interface.</p>
                </div>
                <input
                  type="checkbox"
                  checked={maskSensitive}
                  onChange={(e) => setMaskSensitive(e.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
              </label>

              <button
                type="button"
                onClick={logout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-200"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </div>
          </SettingsCard>
        </aside>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-xs text-zinc-500"
      >
        Dica: alterações são salvas localmente por enquanto.
      </motion.p>

      {mounted && planDrawerOpen
        ? createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center overscroll-contain p-4 sm:p-6">
          <motion.button
            type="button"
            onClick={closePlanDrawer}
            className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Fechar"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="glass-surface premium-shadow relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Comparação de planos"
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-base font-semibold text-white">Benefícios e comparação</p>
                <p className="mt-1 text-sm text-zinc-400">Escolha o plano ideal para seu fluxo.</p>
              </div>
              <button
                type="button"
                onClick={closePlanDrawer}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:pb-8">
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-4 lg:items-stretch">
                {(["Free", "Pro", "Ultra"] as const).map((tier) => {
                  const active = tier === planLabel;
                  const meta = planMeta.tiers[tier];
                  const cta = planComparisonCta(planLabel, tier);
                  const isPro = tier === "Pro";
                  return (
                    <div
                      key={tier}
                      className={`relative flex flex-col rounded-2xl border p-4 sm:p-5 ${
                        isPro ? "pt-7 sm:pt-8" : ""
                      } ${
                        isPro
                          ? "border-[var(--primary)]/40 bg-[var(--primary)]/8 shadow-[0_0_0_1px_rgba(124,58,237,0.15),0_12px_40px_-12px_rgba(124,58,237,0.35)]"
                          : active && !isPro
                            ? "border-[var(--primary)]/30 bg-[var(--primary)]/6"
                            : "border-white/[0.08] bg-white/[0.03]"
                      }`}
                    >
                      {isPro ? (
                        <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[var(--primary)]/35 bg-[var(--primary)]/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-100 shadow-[0_0_20px_rgba(124,58,237,0.35)]">
                          Mais popular
                        </span>
                      ) : null}

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">{tier}</p>
                          <p className="mt-1 text-base font-bold tracking-tight text-zinc-100">
                            {meta.priceLabel}
                          </p>
                        </div>
                        {active ? (
                          <span className="inline-flex shrink-0 rounded-full bg-[var(--primary)]/20 px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
                            Seu plano
                          </span>
                        ) : null}
                      </div>

                      <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                        {meta.features.slice(0, 4).map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                            <span className="leading-snug">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                          Limites
                        </p>
                        {meta.limits.slice(0, 3).map((l) => (
                          <div
                            key={l.label}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-zinc-500">{l.label}</span>
                            <span className="font-semibold text-zinc-100">{l.value}</span>
                          </div>
                        ))}
                      </div>

                      {cta.kind === "current" ? (
                        <button
                          type="button"
                          className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold text-zinc-200"
                        >
                          Plano atual
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => selectPlan(tier)}
                          className="btn-gradient-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
                        >
                          {cta.label}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <footer className="shrink-0 border-t border-white/10 px-5 py-3 sm:px-6">
              <p className="text-center text-[11px] text-zinc-500">
                Ao escolher um plano, a alteração é aplicada automaticamente ao perfil local.
              </p>
            </footer>
          </motion.div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

