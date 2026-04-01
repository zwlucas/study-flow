import { HomeOverview, ProgressMetrics, StudyDb } from "@/lib/types";

export function buildHomeOverview(db: StudyDb): HomeOverview {
  const completedTasks = db.tasks.filter((t) => t.status === "done").length;
  const totalTasks = db.tasks.length;
  const todayFocusMinutes = db.sessions
    .filter((s) => s.completed)
    .reduce((acc, session) => acc + session.durationMinutes, 0);

  const weeklyCompletion = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return {
    todayFocusMinutes,
    completedTasks,
    totalTasks,
    weeklyCompletion,
    streakDays: Math.max(1, Math.min(30, db.sessions.length + 2)),
  };
}

export function buildProgressMetrics(db: StudyDb): ProgressMetrics {
  const completedSessions = db.sessions.filter((s) => s.completed);
  const totalStudyMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalStudyHours = Number((totalStudyMinutes / 60).toFixed(1));
  const avgFocusScore =
    completedSessions.length === 0
      ? 0
      : Math.round(
          completedSessions.reduce((acc, s) => acc + s.focusScore, 0) / completedSessions.length,
        );

  const weeklyTrend = [28, 40, 54, 48, 66, 73, Math.max(35, avgFocusScore)];

  return {
    totalStudyHours,
    avgFocusScore,
    sessionsCompleted: completedSessions.length,
    weeklyTrend,
  };
}
