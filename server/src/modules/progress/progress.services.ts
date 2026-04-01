import { db } from "../../db";
import { flowSessions } from "../../db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

export class ProgressService {
  async getAnalytics(userId: string, period: "7d" | "30d" | "all") {
    let dateFilter;
    if (period === "7d") {
      dateFilter = sql`date('now', '-7 days')`;
    } else if (period === "30d") {
      dateFilter = sql`date('now', '-30 days')`;
    }

    let query = db
      .select({
        id: flowSessions.id,
        duration: flowSessions.duration,
        createdAt: flowSessions.createdAt,
        status: flowSessions.status,
      })
      .from(flowSessions)
      .where(
        and(
          eq(flowSessions.userId, userId),
          eq(flowSessions.status, "completed")
        )
      );

    if (dateFilter) {
      query = db
        .select({
          id: flowSessions.id,
          duration: flowSessions.duration,
          createdAt: flowSessions.createdAt,
          status: flowSessions.status,
        })
        .from(flowSessions)
        .where(
          and(
            eq(flowSessions.userId, userId),
            eq(flowSessions.status, "completed"),
            gte(flowSessions.createdAt, dateFilter)
          )
        ) as any;
    }

    const sessions = await query.orderBy(desc(flowSessions.createdAt));

    let totalFocusMinutes = 0;
    const dailyFocusMap = new Map<string, number>();
    const uniqueDays = new Set<string>();

    for (const session of sessions) {
      totalFocusMinutes += session.duration;
      // SQLite dateTime is usually "YYYY-MM-DD HH:MM:SS"
      const dateKey = session.createdAt.substring(0, 10);
      uniqueDays.add(dateKey);
      dailyFocusMap.set(
        dateKey,
        (dailyFocusMap.get(dateKey) || 0) + session.duration
      );
    }

    // Calcula o Streak simples (Dias consecutivos baseados nas datas ordenadas decrescentes)
    let currentStreak = 0;
    const sortedDays = Array.from(uniqueDays).sort((a, b) => b.localeCompare(a));
    const todayStr = new Date().toISOString().substring(0, 10);
    
    // Simplificação para fins de demonstração (streak real precisaria verificar se perdeu o dia de ontem)
    if (sortedDays.length > 0) {
        let expectedDate = new Date();
        // Se a pessoa estudou hoje ou ontem, começa a contar a partir de onde parou
        if (sortedDays[0] === todayStr || sortedDays[0] === new Date(Date.now() - 86400000).toISOString().substring(0, 10)) {
            currentStreak = 1;
            for(let i = 1; i < sortedDays.length; i++) {
                const prevDay = new Date(sortedDays[i-1]);
                prevDay.setDate(prevDay.getDate() - 1);
                if (sortedDays[i] === prevDay.toISOString().substring(0, 10)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
    }

    const dailyFocus = Array.from(dailyFocusMap.entries())
      .map(([date, minutes]) => ({ date, minutes }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically

    return {
      totalFocusMinutes,
      sessionsCompleted: sessions.length,
      currentStreak,
      dailyFocus,
    };
  }
}
