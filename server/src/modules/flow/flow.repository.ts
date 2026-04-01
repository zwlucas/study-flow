import { eq, desc, and } from "drizzle-orm";
import { db } from "../../db";
import { flowSessions } from "../../db/schema";
import { sql } from "drizzle-orm";

export class FlowRepository {
  // Exemplo de Prepared Statement: Cache no lado do banco, processado apenas 1 vez
  private getSessionsPrep = db
    .select()
    .from(flowSessions)
    .where(
      and(
        eq(flowSessions.userId, sql.placeholder("userId")),
        eq(flowSessions.status, sql.placeholder("status"))
      )
    )
    .orderBy(desc(flowSessions.createdAt))
    .limit(sql.placeholder("limit"))
    .offset(sql.placeholder("offset"))
    .prepare();

  async getSessions(
    userId: string,
    status: string,
    limit: number,
    offset: number
  ) {
    return this.getSessionsPrep.execute({ userId, status, limit, offset });
  }

  async createSession(data: typeof flowSessions.$inferInsert) {
    const [result] = await db
      .insert(flowSessions)
      .values(data)
      .returning();
    return result;
  }
}
