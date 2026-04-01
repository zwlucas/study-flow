"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowService = void 0;
const db_1 = require("../../db");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const node_crypto_1 = require("node:crypto");
class FlowService {
    async getSessions(userId, filters) {
        let query = db_1.db.select().from(schema_1.flowSessions).where((0, drizzle_orm_1.eq)(schema_1.flowSessions.userId, userId));
        if (filters.status) {
            // Add status condition dynamically if provided
            query = db_1.db.select().from(schema_1.flowSessions).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.flowSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.flowSessions.status, filters.status)));
        }
        const sessions = await query
            .orderBy((0, drizzle_orm_1.desc)(schema_1.flowSessions.createdAt))
            .limit(filters.limit)
            .offset(filters.offset);
        // Get total count
        const [countRes] = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.flowSessions)
            .where((0, drizzle_orm_1.eq)(schema_1.flowSessions.userId, userId));
        return { data: sessions, total: countRes.count };
    }
    async createSession(userId, data) {
        const newId = (0, node_crypto_1.randomUUID)();
        const tagsStr = data.tags ? JSON.stringify(data.tags) : null;
        const [session] = await db_1.db
            .insert(schema_1.flowSessions)
            .values({
            id: newId,
            userId,
            title: data.title,
            duration: data.duration,
            status: "in_progress",
            tags: tagsStr,
        })
            .returning();
        return session;
    }
    async updateSession(userId, sessionId, data) {
        const existing = await db_1.db
            .select()
            .from(schema_1.flowSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.flowSessions.id, sessionId), (0, drizzle_orm_1.eq)(schema_1.flowSessions.userId, userId)))
            .get();
        if (!existing) {
            const error = new Error("Sessão não encontrada");
            error.code = "NOT_FOUND";
            error.statusCode = 404;
            throw error;
        }
        const [updated] = await db_1.db
            .update(schema_1.flowSessions)
            .set({
            ...data,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.flowSessions.id, sessionId))
            .returning();
        return updated;
    }
    async deleteSession(userId, sessionId) {
        const result = await db_1.db
            .delete(schema_1.flowSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.flowSessions.id, sessionId), (0, drizzle_orm_1.eq)(schema_1.flowSessions.userId, userId)))
            .returning({ id: schema_1.flowSessions.id });
        if (!result.length) {
            const error = new Error("Sessão não encontrada");
            error.code = "NOT_FOUND";
            error.statusCode = 404;
            throw error;
        }
        return { success: true };
    }
}
exports.FlowService = FlowService;
