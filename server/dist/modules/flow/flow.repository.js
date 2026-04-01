"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schema_1 = require("../../db/schema");
const drizzle_orm_2 = require("drizzle-orm");
class FlowRepository {
    // Exemplo de Prepared Statement: Cache no lado do banco, processado apenas 1 vez
    getSessionsPrep = db_1.db
        .select()
        .from(schema_1.flowSessions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.flowSessions.userId, drizzle_orm_2.sql.placeholder("userId")), (0, drizzle_orm_1.eq)(schema_1.flowSessions.status, drizzle_orm_2.sql.placeholder("status"))))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.flowSessions.createdAt))
        .limit(drizzle_orm_2.sql.placeholder("limit"))
        .offset(drizzle_orm_2.sql.placeholder("offset"))
        .prepare();
    async getSessions(userId, status, limit, offset) {
        return this.getSessionsPrep.execute({ userId, status, limit, offset });
    }
    async createSession(data) {
        const [result] = await db_1.db
            .insert(schema_1.flowSessions)
            .values(data)
            .returning();
        return result;
    }
}
exports.FlowRepository = FlowRepository;
