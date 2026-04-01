import { db } from "../../db";
import { flowSessions } from "../../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export class FlowService {
  async getSessions(userId: string, filters: { status?: string; limit: number; offset: number }) {
    let query = db.select().from(flowSessions).where(eq(flowSessions.userId, userId));

    if (filters.status) {
      // Add status condition dynamically if provided
      query = db.select().from(flowSessions).where(
        and(eq(flowSessions.userId, userId), eq(flowSessions.status, filters.status))
      ) as any;
    }

    const sessions = await query
      .orderBy(desc(flowSessions.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    // Get total count
    const [countRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(flowSessions)
      .where(eq(flowSessions.userId, userId));

    return { data: sessions, total: countRes.count };
  }

  async createSession(userId: string, data: { title: string; duration: number; tags?: string[] }) {
    const newId = randomUUID();
    const tagsStr = data.tags ? JSON.stringify(data.tags) : null;

    const [session] = await db
      .insert(flowSessions)
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

  async updateSession(userId: string, sessionId: string, data: { status?: string; duration?: number }) {
    const existing = await db
      .select()
      .from(flowSessions)
      .where(and(eq(flowSessions.id, sessionId), eq(flowSessions.userId, userId)))
      .get();

    if (!existing) {
      const error: any = new Error("Sessão não encontrada");
      error.code = "NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    const [updated] = await db
      .update(flowSessions)
      .set({
        ...data,
      })
      .where(eq(flowSessions.id, sessionId))
      .returning();

    return updated;
  }

  async deleteSession(userId: string, sessionId: string) {
    const result = await db
      .delete(flowSessions)
      .where(and(eq(flowSessions.id, sessionId), eq(flowSessions.userId, userId)))
      .returning({ id: flowSessions.id });
      
    if (!result.length) {
      const error: any = new Error("Sessão não encontrada");
      error.code = "NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    return { success: true };
  }
}
