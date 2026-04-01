"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningService = void 0;
const db_1 = require("../../db");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
class PlanningService {
    async getRoadmap(userId) {
        let nodes = await db_1.db
            .select()
            .from(schema_1.roadmapNodes)
            .where((0, drizzle_orm_1.eq)(schema_1.roadmapNodes.userId, userId));
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
                await db_1.db.insert(schema_1.roadmapNodes).values({
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
                await db_1.db.insert(schema_1.roadmapEdges).values({
                    id: (0, crypto_1.randomUUID)(),
                    userId,
                    sourceId: e.source,
                    targetId: e.target,
                });
            }
            nodes = await db_1.db.select().from(schema_1.roadmapNodes).where((0, drizzle_orm_1.eq)(schema_1.roadmapNodes.userId, userId));
        }
        const edges = await db_1.db
            .select({
            sourceId: schema_1.roadmapEdges.sourceId,
            targetId: schema_1.roadmapEdges.targetId,
        })
            .from(schema_1.roadmapEdges)
            .where((0, drizzle_orm_1.eq)(schema_1.roadmapEdges.userId, userId));
        return {
            nodes: nodes.map(n => ({ ...n, progress: n.progress / 100 })),
            edges
        };
    }
    async updateNodePosition(userId, nodeId, x, y) {
        const [updated] = await db_1.db
            .update(schema_1.roadmapNodes)
            .set({ positionX: x, positionY: y })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roadmapNodes.id, nodeId), (0, drizzle_orm_1.eq)(schema_1.roadmapNodes.userId, userId)))
            .returning();
        if (!updated) {
            const error = new Error("Node não encontrado");
            error.code = "NOT_FOUND";
            error.statusCode = 404;
            throw error;
        }
        return updated;
    }
    async toggleEdge(userId, sourceId, targetId) {
        // Tenta encontrar a aresta na direção A->B ou B->A (já que a UI trata conexões como não-direcionadas em termos de UI toggle)
        const existing1 = await db_1.db.select().from(schema_1.roadmapEdges).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roadmapEdges.userId, userId), (0, drizzle_orm_1.eq)(schema_1.roadmapEdges.sourceId, sourceId), (0, drizzle_orm_1.eq)(schema_1.roadmapEdges.targetId, targetId))).get();
        const existing2 = await db_1.db.select().from(schema_1.roadmapEdges).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roadmapEdges.userId, userId), (0, drizzle_orm_1.eq)(schema_1.roadmapEdges.sourceId, targetId), (0, drizzle_orm_1.eq)(schema_1.roadmapEdges.targetId, sourceId))).get();
        if (existing1 || existing2) {
            // Remove
            await db_1.db.delete(schema_1.roadmapEdges).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roadmapEdges.userId, userId), (0, drizzle_orm_1.eq)(schema_1.roadmapEdges.id, existing1 ? existing1.id : existing2.id)));
            return { action: "removed" };
        }
        else {
            // Create
            await db_1.db.insert(schema_1.roadmapEdges).values({
                id: (0, crypto_1.randomUUID)(),
                userId,
                sourceId,
                targetId,
            });
            return { action: "created" };
        }
    }
}
exports.PlanningService = PlanningService;
