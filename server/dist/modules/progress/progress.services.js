"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const db_1 = require("../../db");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class ProgressService {
    async getAnalytics(userId, period) {
        let dateFilter;
        if (period === "7d") {
            dateFilter = (0, drizzle_orm_1.sql) `date('now', '-7 days')`;
        }
        else if (period === "30d") {
            dateFilter = (0, drizzle_orm_1.sql) `date('now', '-30 days')`;
        }
        let query = db_1.db
            .select({
            id: schema_1.flowSessions.id,
            duration: schema_1.flowSessions.duration,
            createdAt: schema_1.flowSessions.createdAt,
            status: schema_1.flowSessions.status,
        })
            .from(schema_1.flowSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.flowSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.flowSessions.status, "completed")));
        if (dateFilter) {
            query = db_1.db
                .select({
                id: schema_1.flowSessions.id,
                duration: schema_1.flowSessions.duration,
                createdAt: schema_1.flowSessions.createdAt,
                status: schema_1.flowSessions.status,
            })
                .from(schema_1.flowSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.flowSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.flowSessions.status, "completed"), (0, drizzle_orm_1.gte)(schema_1.flowSessions.createdAt, dateFilter)));
        }
        const sessions = await query.orderBy((0, drizzle_orm_1.desc)(schema_1.flowSessions.createdAt));
        let totalFocusMinutes = 0;
        const dailyFocusMap = new Map();
        const uniqueDays = new Set();
        for (const session of sessions) {
            totalFocusMinutes += session.duration;
            // SQLite dateTime is usually "YYYY-MM-DD HH:MM:SS"
            const dateKey = session.createdAt.substring(0, 10);
            uniqueDays.add(dateKey);
            dailyFocusMap.set(dateKey, (dailyFocusMap.get(dateKey) || 0) + session.duration);
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
                for (let i = 1; i < sortedDays.length; i++) {
                    const prevDay = new Date(sortedDays[i - 1]);
                    prevDay.setDate(prevDay.getDate() - 1);
                    if (sortedDays[i] === prevDay.toISOString().substring(0, 10)) {
                        currentStreak++;
                    }
                    else {
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
exports.ProgressService = ProgressService;
