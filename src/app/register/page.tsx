"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Loader2, UserPlus } from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/register", { email, password });
      const { token, user } = response.data.data;
      
      localStorage.setItem("@studyflow:token", token);
      localStorage.setItem("@studyflow:user", JSON.stringify(user));
      
      router.push("/home");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Falha ao criar conta. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 z-[-1] flex items-center justify-center overflow-hidden">
        <div className="flow-orb-liquid-ring-calm absolute h-[600px] w-[600px] opacity-20 blur-3xl" />
        <div className="flow-orb-core-calm absolute h-[400px] w-[400px] bg-secondary opacity-20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-surface premium-shadow rounded-3xl p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
              <UserPlus className="h-8 w-8 text-secondary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Crie sua conta
            </h1>
            <p className="mt-2 text-sm text-muted">
              Comece a melhorar seu foco e produtividade
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400 ring-1 ring-red-500/20">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted ml-1" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-white/30 outline-none transition focus:border-secondary/50 focus:bg-white/10 focus:ring-1 focus:ring-secondary/50"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted ml-1" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-white/30 outline-none transition focus:border-secondary/50 focus:bg-white/10 focus:ring-1 focus:ring-secondary/50"
                  placeholder="Mínimo de 8 caracteres"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted ml-1" htmlFor="confirmPassword">
                Confirmar Senha
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-white/30 outline-none transition focus:border-secondary/50 focus:bg-white/10 focus:ring-1 focus:ring-secondary/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-secondary to-primary py-3.5 font-semibold text-white shadow-lg shadow-secondary/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-secondary hover:text-white transition-colors"
            >
              Faça login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
