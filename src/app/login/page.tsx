"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data.data;
      
      localStorage.setItem("@studyflow:token", token);
      localStorage.setItem("@studyflow:user", JSON.stringify(user));
      
      router.push("/home");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Falha ao realizar login. Verifique suas credenciais."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 z-[-1] flex items-center justify-center overflow-hidden">
        <div className="flow-orb-liquid-ring-calm absolute h-[600px] w-[600px] opacity-20 blur-3xl" />
        <div className="flow-orb-core-calm absolute h-[400px] w-[400px] bg-primary opacity-20 blur-3xl" />
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
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-sm text-muted">
              Entre para continuar seu fluxo de estudos
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
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:bg-white/10 focus:ring-1 focus:ring-primary/50"
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
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:bg-white/10 focus:ring-1 focus:ring-primary/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient-cta mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Entrar na plataforma
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted">
            Ainda não tem uma conta?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:text-white transition-colors"
            >
              Crie agora
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
