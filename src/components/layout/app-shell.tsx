"use client";

import { isTauri } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ContextHeader } from "@/components/layout/context-header";
import { FloatingAiChat } from "@/components/layout/floating-ai-chat";
import { PageTransition } from "@/components/layout/page-transition";
import { Sidebar } from "@/components/layout/sidebar";
import { TauriTitleBar } from "@/components/layout/tauri-title-bar";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mounted, setMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/";

  useEffect(() => {
    setMounted(true);
    
    const token = localStorage.getItem("@studyflow:token");
    
    if (!token && !isAuthRoute) {
      router.replace("/login");
    } else if (token && (pathname === "/login" || pathname === "/register")) {
      router.replace("/home");
    } else {
      setIsCheckingAuth(false);
    }
  }, [pathname, isAuthRoute, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted || isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {isTauri() && <TauriTitleBar />}
        <div className="flex-1 overflow-auto">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    );
  }

  const main = (
    <>
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] p-4 md:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <div className="md:hidden p-4 border-b border-white/10 flex items-center justify-between glass-surface z-30 relative">
          <span className="font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-warm)] to-[var(--primary)] text-xs font-bold text-white shadow-lg shadow-[var(--primary)]/30">
              SF
            </span>
            StudyFlow
          </span>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl glass text-zinc-300 hover:bg-white/10 transition"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-0 studyflow-scroll">
          <ContextHeader />
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </>
  );

  if (isTauri()) {
    return (
      <>
        <div className="flex h-dvh flex-col overflow-hidden bg-background">
          <TauriTitleBar />
          <div className="studyflow-scroll flex min-h-0 flex-1 md:gap-5 overflow-hidden md:p-5">
            {main}
          </div>
        </div>
        <FloatingAiChat />
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-screen h-screen md:gap-5 md:p-5 overflow-hidden">{main}</div>
      <FloatingAiChat />
    </>
  );
}
