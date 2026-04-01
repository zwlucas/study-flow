"use client";

import { isTauri } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { ContextHeader } from "@/components/layout/context-header";
import { FloatingAiChat } from "@/components/layout/floating-ai-chat";
import { PageTransition } from "@/components/layout/page-transition";
import { Sidebar } from "@/components/layout/sidebar";
import { TauriTitleBar } from "@/components/layout/tauri-title-bar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const main = (
    <>
      <Sidebar />
      <div className="min-w-0 flex-1">
        <ContextHeader />
        <PageTransition>{children}</PageTransition>
      </div>
    </>
  );

  if (!mounted) {
    return (
      <>
        <div className="flex min-h-screen gap-5 p-5">{main}</div>
        <FloatingAiChat />
      </>
    );
  }

  if (isTauri()) {
    return (
      <>
        <div className="flex h-dvh flex-col overflow-hidden bg-background">
          <TauriTitleBar />
          <div className="studyflow-scroll flex min-h-0 flex-1 gap-5 overflow-y-auto overflow-x-hidden p-5">
            {main}
          </div>
        </div>
        <FloatingAiChat />
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-screen gap-5 p-5">{main}</div>
      <FloatingAiChat />
    </>
  );
}
