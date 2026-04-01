"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeService = void 0;
const db_1 = require("../../db");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class HomeService {
    async getSummary(userId) {
        const today = new Date().toISOString().substring(0, 10);
        const startOfWeek = new Date();
        // Move to start of current week (assuming Monday as start)
        const day = startOfWeek.getDay() || 7;
        if (day !== 1)
            startOfWeek.setHours(-24 * (day - 1));
        startOfWeek.setHours(0, 0, 0, 0);
        const weekStartIso = startOfWeek.toISOString();
        // 1. Daily Priority (Top Task for today)
        // Tenta pegar a primeira tarefa com dueDate hoje ou pendente mais antiga
        const [priorityTask] = await db_1.db
            .select({ id: schema_1.tasks.id, title: schema_1.tasks.title, status: schema_1.tasks.status })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId), (0, drizzle_orm_1.eq)(schema_1.tasks.status, "pending")))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.dueDate), (0, drizzle_orm_1.desc)(schema_1.tasks.createdAt))
            .limit(1);
        // 2. Weekly Goal Progress
        // Busca todas as sessões concluídas nesta semana
        const weeklySessions = await db_1.db
            .select({ duration: schema_1.flowSessions.duration })
            .from(schema_1.flowSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.flowSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.flowSessions.status, "completed"), (0, drizzle_orm_1.gte)(schema_1.flowSessions.createdAt, weekStartIso)));
        const weeklyMinutes = weeklySessions.reduce((acc, s) => acc + s.duration, 0);
        // Hardcoded target of 20 hours (1200 minutes) per week. Pode ser uma config do user no futuro.
        const targetWeeklyMinutes = 1200;
        // 3. Today's sessions & Focus Quality
        const todaySessions = await db_1.db
            .select({ duration: schema_1.flowSessions.duration })
            .from(schema_1.flowSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.flowSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.flowSessions.status, "completed"), (0, drizzle_orm_1.gte)(schema_1.flowSessions.createdAt, today)));
        // O "Focus Quality" é uma métrica subjetiva calculada pelo backend baseado em volume 
        // ou interrupções (se tivéssemos salvo interrupções no DB). Aqui, baseamos na constância das sessões (min 25).
        let focusQuality = 85; // Base score
        if (todaySessions.length === 0)
            focusQuality = 0;
        else if (todaySessions.length > 3)
            focusQuality = 92;
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
exports.HomeService = HomeService;
