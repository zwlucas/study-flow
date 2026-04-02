import { StudyPathCanvas } from "@/features/planning/study-path-canvas";
import { DailySummarySidebar } from "@/features/planning/daily-summary-sidebar";

export default function PlanningPage() {
  return (
    <div>
      <div className="grid gap-6 xl:grid-cols-[1fr_minmax(300px,360px)]">
        <StudyPathCanvas />
        <DailySummarySidebar />
      </div>
    </div>
  );
}
