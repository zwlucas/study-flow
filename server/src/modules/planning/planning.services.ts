import { db } from "../../db";
import { roadmapNodes, roadmapEdges } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export class PlanningService {
  async getRoadmap(userId: string) {
    let nodes = await db
      .select()
      .from(roadmapNodes)
      .where(eq(roadmapNodes.userId, userId));

    if (nodes.length === 0) {
      // Seed initial mock data for UX
      const initialNodes = [
        { id: "calc", title: "Cálculo I", sub: "Limites e derivadas", status: "Em progresso", statusClass: "bg-[var(--accent-warm)]/20 text-[var(--accent-warm)]", progress: 75, icon: "Sigma", iconWrap: "bg-[var(--primary)]/30 text-[var(--primary)]", meta: "2h hoje", current: true, blocked: false, positionX: 24, positionY: 28 },
        { id: "fisica", title: "Física Geral", sub: "Mecânica newtoniana", status: "Pendente", statusClass: "bg-zinc-500/25 text-zinc-400", progress: 30, icon: "Atom", iconWrap: "bg-[var(--secondary)]/25 text-[var(--secondary)]", meta: "Amanhã", current: false, blocked: false, positionX: 560, positionY: 28 },
        { id: "algebra", title: "Álgebra Linear", sub: "Espaços vetoriais", status: "Revisão", statusClass: "bg-[var(--success)]/20 text-[var(--success)]", progress: 90, icon: "BookOpen", iconWrap: "bg-emerald-500/15 text-emerald-300", meta: "90% concluído", current: false, blocked: false, positionX: 24, positionY: 240 },
        { id: "logica", title: "Lógica Matemática", sub: "Proposições e demonstrações", status: "Próximo", statusClass: "bg-zinc-500/25 text-zinc-400", progress: 0, icon: "Cpu", iconWrap: "bg-violet-500/20 text-violet-300", meta: "Na fila", current: false, blocked: false, positionX: 320, positionY: 240 },
        { id: "quimica", title: "Química Orgânica", sub: "Hidrocarbonetos", status: "Bloqueado", statusClass: "bg-zinc-600/30 text-zinc-500", progress: 0, icon: "FlaskConical", iconWrap: "bg-orange-500/15 text-orange-300/90", meta: "Requer Física", current: false, blocked: true, positionX: 320, positionY: 420 },
      ];
      
      for (const n of initialNodes) {
        await db.insert(roadmapNodes).values({
          id: n.id,
          userId,
          title: n.title,
          sub: n.sub,
          status: n.status,
          statusClass: n.statusClass,
          progress: n.progress,
          icon: n.icon,
          iconWrap: n.iconWrap,
          meta: n.meta,
          current: n.current,
          blocked: n.blocked,
          positionX: n.positionX,
          positionY: n.positionY,
        });
      }
      
      const initialEdges = [
        { source: "calc", target: "fisica" },
        { source: "calc", target: "algebra" },
        { source: "calc", target: "logica" },
        { source: "fisica", target: "logica" },
        { source: "logica", target: "quimica" },
      ];
      
      for (const e of initialEdges) {
        await db.insert(roadmapEdges).values({
          id: randomUUID(),
          userId,
          sourceId: e.source,
          targetId: e.target,
        });
      }
      
      nodes = await db.select().from(roadmapNodes).where(eq(roadmapNodes.userId, userId));
    }

    const edges = await db
      .select({
        sourceId: roadmapEdges.sourceId,
        targetId: roadmapEdges.targetId,
      })
      .from(roadmapEdges)
      .where(eq(roadmapEdges.userId, userId));

    return { 
      nodes: nodes.map(n => ({ ...n, progress: n.progress / 100 })), 
      edges 
    };
  }

  async updateNodePosition(userId: string, nodeId: string, x: number, y: number) {
    const [updated] = await db
      .update(roadmapNodes)
      .set({ positionX: x, positionY: y })
      .where(and(eq(roadmapNodes.id, nodeId), eq(roadmapNodes.userId, userId)))
      .returning();

    if (!updated) {
      const error: any = new Error("Node não encontrado");
      error.code = "NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    return updated;
  }

  async toggleEdge(userId: string, sourceId: string, targetId: string) {
    // Tenta encontrar a aresta na direção A->B ou B->A (já que a UI trata conexões como não-direcionadas em termos de UI toggle)
    const existing1 = await db.select().from(roadmapEdges).where(
      and(eq(roadmapEdges.userId, userId), eq(roadmapEdges.sourceId, sourceId), eq(roadmapEdges.targetId, targetId))
    ).get();

    const existing2 = await db.select().from(roadmapEdges).where(
      and(eq(roadmapEdges.userId, userId), eq(roadmapEdges.sourceId, targetId), eq(roadmapEdges.targetId, sourceId))
    ).get();

    if (existing1 || existing2) {
      // Remove
      await db.delete(roadmapEdges).where(
        and(
          eq(roadmapEdges.userId, userId),
          eq(roadmapEdges.id, existing1 ? existing1.id : existing2!.id)
        )
      );
      return { action: "removed" };
    } else {
      // Create
      await db.insert(roadmapEdges).values({
        id: randomUUID(),
        userId,
        sourceId,
        targetId,
      });
      return { action: "created" };
    }
  }
}
