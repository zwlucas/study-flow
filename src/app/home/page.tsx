import { DashboardHeader } from "@/features/home/dashboard-header";
import { DailyPriorityCard } from "@/features/home/daily-priority-card";
import { WeeklyGoalRing } from "@/features/home/weekly-goal-ring";
import { AiInsightsWidget } from "@/features/home/ai-insights-widget";
import { QuickActions } from "@/features/home/quick-actions";
import { FocusQualityGauge } from "@/features/home/focus-quality-gauge";

export default function HomePage() {
  return (
    <div className="grid min-h-[calc(100vh-2rem)] grid-rows-[auto_auto_1fr] gap-4 pb-3">
      <DashboardHeader />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DailyPriorityCard />
        <WeeklyGoalRing />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 xl:grid-cols-[1.35fr_1fr_1fr]">
        <AiInsightsWidget />
        <QuickActions />
        <FocusQualityGauge />
      </div>
    </div>
  );
}
