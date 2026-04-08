import { Suspense } from "react";
import { StudyPathCanvas } from "@/features/planning/study-path-canvas";
import { DailySummarySidebar } from "@/features/planning/daily-summary-sidebar";

function PlanningCanvasFallback() {
  return (
    <div className="flex min-h-[480px] items-center justify-center rounded-3xl border border-white/8 bg-zinc-950/40 text-sm text-zinc-500">
      Carregando mapa…
    </div>
  );
}

export default function PlanningPage() {
  return (
    <div>
      <div className="grid gap-6 xl:grid-cols-[1fr_minmax(300px,360px)]">
        <Suspense fallback={<PlanningCanvasFallback />}>
          <StudyPathCanvas />
        </Suspense>
        <DailySummarySidebar />
      </div>
    </div>
  );
}
