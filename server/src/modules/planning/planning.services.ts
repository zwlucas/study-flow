import { db } from "../../db";
import { roadmapNodes, roadmapEdges } from "../../db/schema";
import { eq, and, type InferSelectModel } from "drizzle-orm";
import { randomUUID } from "crypto";

/** PK por utilizador: evita colisão entre contas e pedidos paralelos (ex. Strict Mode). */
function roadmapNodeId(userId: string, slug: string) {
  return `${userId}_${slug}`;
}

function roadmapEdgeId(userId: string, sourceSlug: string, targetSlug: string) {
  return `${userId}_e_${sourceSlug}_${targetSlug}`;
}

const ICON_WRAP: Record<string, string> = {
  BookOpen: "bg-emerald-500/15 text-emerald-300",
  Atom: "bg-[var(--secondary)]/25 text-[var(--secondary)]",
  Sigma: "bg-[var(--primary)]/30 text-[var(--primary)]",
  Cpu: "bg-violet-500/20 text-violet-300",
  FlaskConical: "bg-orange-500/15 text-orange-300/90",
};

type RoadmapNodeRow = InferSelectModel<typeof roadmapNodes>;

function mapNodeRowToDto(n: RoadmapNodeRow) {
  return {
    id: n.id,
    title: n.title,
    sub: n.sub,
    status: n.status,
    statusClass: n.statusClass,
    progress: Number(n.progress) / 100,
    icon: n.icon,
    iconWrap: n.iconWrap,
    meta: n.meta,
    current: n.current ?? null,
    blocked: n.blocked ?? null,
    positionX: n.positionX,
    positionY: n.positionY,
    coverImage: n.coverImage ?? null,
  };
}

export class PlanningService {
  async getRoadmap(userId: string) {
    let nodes = await db
      .select()
      .from(roadmapNodes)
      .where(eq(roadmapNodes.userId, userId));

    if (nodes.length === 0) {
      // Seed inicial: ids prefixados por userId + onConflictDoNothing (requisições duplicadas / vários users)
      const initialNodes = [
        { slug: "calc", title: "Cálculo I", sub: "Limites e derivadas", status: "Em progresso", statusClass: "bg-[var(--accent-warm)]/20 text-[var(--accent-warm)]", progress: 75, icon: "Sigma", iconWrap: "bg-[var(--primary)]/30 text-[var(--primary)]", meta: "2h hoje", current: true, blocked: false, positionX: 24, positionY: 28 },
        { slug: "fisica", title: "Física Geral", sub: "Mecânica newtoniana", status: "Pendente", statusClass: "bg-zinc-500/25 text-zinc-400", progress: 30, icon: "Atom", iconWrap: "bg-[var(--secondary)]/25 text-[var(--secondary)]", meta: "Amanhã", current: false, blocked: false, positionX: 560, positionY: 28 },
        { slug: "algebra", title: "Álgebra Linear", sub: "Espaços vetoriais", status: "Revisão", statusClass: "bg-[var(--success)]/20 text-[var(--success)]", progress: 90, icon: "BookOpen", iconWrap: "bg-emerald-500/15 text-emerald-300", meta: "90% concluído", current: false, blocked: false, positionX: 24, positionY: 240 },
        { slug: "logica", title: "Lógica Matemática", sub: "Proposições e demonstrações", status: "Próximo", statusClass: "bg-zinc-500/25 text-zinc-400", progress: 0, icon: "Cpu", iconWrap: "bg-violet-500/20 text-violet-300", meta: "Na fila", current: false, blocked: false, positionX: 320, positionY: 240 },
        { slug: "quimica", title: "Química Orgânica", sub: "Hidrocarbonetos", status: "Bloqueado", statusClass: "bg-zinc-600/30 text-zinc-500", progress: 0, icon: "FlaskConical", iconWrap: "bg-orange-500/15 text-orange-300/90", meta: "Requer Física", current: false, blocked: true, positionX: 320, positionY: 420 },
      ];

      for (const n of initialNodes) {
        await db
          .insert(roadmapNodes)
          .values({
            id: roadmapNodeId(userId, n.slug),
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
          })
          .onConflictDoNothing();
      }

      const initialEdges = [
        { source: "calc", target: "fisica" },
        { source: "calc", target: "algebra" },
        { source: "calc", target: "logica" },
        { source: "fisica", target: "logica" },
        { source: "logica", target: "quimica" },
      ];

      for (const e of initialEdges) {
        await db
          .insert(roadmapEdges)
          .values({
            id: roadmapEdgeId(userId, e.source, e.target),
            userId,
            sourceId: roadmapNodeId(userId, e.source),
            targetId: roadmapNodeId(userId, e.target),
          })
          .onConflictDoNothing();
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
      nodes: nodes.map((n) => mapNodeRowToDto(n)),
      edges: edges.map((e) => ({ sourceId: e.sourceId, targetId: e.targetId })),
    };
  }

  async createNode(
    userId: string,
    input: {
      title: string;
      sub?: string;
      icon?: string;
      positionX?: number;
      positionY?: number;
      coverImage?: string;
    },
  ) {
    const id = `${userId}_n_${randomUUID().replace(/-/g, "")}`;
    const icon =
      input.icon && input.icon in ICON_WRAP ? input.icon : "BookOpen";
    const sub = (input.sub ?? "").trim() || "Sem descrição";

    const cover =
      input.coverImage && input.coverImage.length > 0 ? input.coverImage : null;

    await db.insert(roadmapNodes).values({
      id,
      userId,
      title: input.title.trim(),
      sub,
      status: "Pendente",
      statusClass: "bg-zinc-500/25 text-zinc-400",
      progress: 0,
      icon,
      iconWrap: ICON_WRAP[icon] ?? ICON_WRAP.BookOpen,
      meta: "Nova matéria",
      current: false,
      blocked: false,
      positionX: input.positionX ?? 140,
      positionY: input.positionY ?? 100,
      coverImage: cover,
    });

    const row = await db.select().from(roadmapNodes).where(eq(roadmapNodes.id, id)).get();
    if (!row) {
      const error: any = new Error("Falha ao criar matéria");
      error.statusCode = 500;
      throw error;
    }
    return mapNodeRowToDto(row);
  }

  async updateNode(
    userId: string,
    nodeId: string,
    input: {
      title?: string;
      sub?: string;
      icon?: string;
      coverImage?: string;
    },
  ) {
    const patch: Partial<{
      title: string;
      sub: string;
      icon: string;
      iconWrap: string;
      coverImage: string | null;
    }> = {};

    if (input.title !== undefined) {
      patch.title = input.title.trim();
    }
    if (input.sub !== undefined) {
      patch.sub = input.sub.trim() || "Sem descrição";
    }
    if (input.icon !== undefined) {
      const ic = input.icon in ICON_WRAP ? input.icon : "BookOpen";
      patch.icon = ic;
      patch.iconWrap = ICON_WRAP[ic] ?? ICON_WRAP.BookOpen;
    }
    if (input.coverImage !== undefined) {
      patch.coverImage = input.coverImage === "" ? null : input.coverImage;
    }

    if (Object.keys(patch).length === 0) {
      const error: any = new Error("Nada para atualizar");
      error.statusCode = 400;
      throw error;
    }

    const [updated] = await db
      .update(roadmapNodes)
      .set(patch)
      .where(and(eq(roadmapNodes.id, nodeId), eq(roadmapNodes.userId, userId)))
      .returning();

    if (!updated) {
      const error: any = new Error("Node não encontrado");
      error.code = "NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    return mapNodeRowToDto(updated);
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
