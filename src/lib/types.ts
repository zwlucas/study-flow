export type FlowSession = {
  id: string;
  subject: string;
  startedAt: string;
  durationMinutes: number;
  completed: boolean;
  focusScore: number;
};

export type TaskStatus = "backlog" | "today" | "done";

export type PlanningTask = {
  id: string;
  title: string;
  subject: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  estimatedMinutes: number;
};

export type StudyDb = {
  sessions: FlowSession[];
  tasks: PlanningTask[];
};

export type HomeOverview = {
  todayFocusMinutes: number;
  completedTasks: number;
  totalTasks: number;
  weeklyCompletion: number;
  streakDays: number;
};

export type ProgressMetrics = {
  totalStudyHours: number;
  avgFocusScore: number;
  sessionsCompleted: number;
  weeklyTrend: number[];
};
