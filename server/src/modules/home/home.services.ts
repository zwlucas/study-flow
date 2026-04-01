import { db } from "../../db";
import { flowSessions, tasks } from "../../db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

export class HomeService {
  async getSummary(userId: string) {
    const today = new Date().toISOString().substring(0, 10);
    const startOfWeek = new Date();
    // Move to start of current week (assuming Monday as start)
    const day = startOfWeek.getDay() || 7; 
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
    startOfWeek.setHours(0,0,0,0);
    const weekStartIso = startOfWeek.toISOString();

    // 1. Daily Priority (Top Task for today)
    // Tenta pegar a primeira tarefa com dueDate hoje ou pendente mais antiga
    const [priorityTask] = await db
      .select({ id: tasks.id, title: tasks.title, status: tasks.status })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, "pending")))
      .orderBy(desc(tasks.dueDate), desc(tasks.createdAt))
      .limit(1);

    // 2. Weekly Goal Progress
    // Busca todas as sessões concluídas nesta semana
    const weeklySessions = await db
      .select({ duration: flowSessions.duration })
      .from(flowSessions)
      .where(
        and(
          eq(flowSessions.userId, userId),
          eq(flowSessions.status, "completed"),
          gte(flowSessions.createdAt, weekStartIso)
        )
      );

    const weeklyMinutes = weeklySessions.reduce((acc, s) => acc + s.duration, 0);
    // Hardcoded target of 20 hours (1200 minutes) per week. Pode ser uma config do user no futuro.
    const targetWeeklyMinutes = 1200;

    // 3. Today's sessions & Focus Quality
    const todaySessions = await db
      .select({ duration: flowSessions.duration })
      .from(flowSessions)
      .where(
        and(
          eq(flowSessions.userId, userId),
          eq(flowSessions.status, "completed"),
          gte(flowSessions.createdAt, today)
        )
      );

    // O "Focus Quality" é uma métrica subjetiva calculada pelo backend baseado em volume 
    // ou interrupções (se tivéssemos salvo interrupções no DB). Aqui, baseamos na constância das sessões (min 25).
    let focusQuality = 85; // Base score
    if (todaySessions.length === 0) focusQuality = 0;
    else if (todaySessions.length > 3) focusQuality = 92;

    return {
      dailyPriority: priorityTask ? {
        id: priorityTask.id,
        title: priorityTask.title,
        status: priorityTask.status,
      } : null,
      weeklyGoalProgress: {
        currentMinutes: weeklyMinutes,
        targetMinutes: targetWeeklyMinutes,
      },
      focusQuality,
      sessionsToday: todaySessions.length,
    };
  }
}
