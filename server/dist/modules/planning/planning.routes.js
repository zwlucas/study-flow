"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = planningRoutes;
const zod_1 = require("zod");
const planning_schemas_1 = require("./planning.schemas");
const planning_services_1 = require("./planning.services");
async function planningRoutes(app) {
    const typedApp = app.withTypeProvider();
    const planningService = new planning_services_1.PlanningService();
    typedApp.addHook("onRequest", app.authenticate);
    typedApp.get("/api/planning/roadmap", {
        schema: {
            response: {
                200: planning_schemas_1.getRoadmapResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { nodes, edges } = await planningService.getRoadmap(request.user.id);
        return reply.send({ data: { nodes, edges } });
    });
    typedApp.patch("/api/planning/nodes/:id/position", {
        schema: {
            params: zod_1.z.object({ id: zod_1.z.string() }),
            body: planning_schemas_1.updateNodePositionSchema,
        },
    }, async (request, reply) => {
        const { x, y } = request.body;
        const updated = await planningService.updateNodePosition(request.user.id, request.params.id, x, y);
        return reply.send({ data: updated });
    });
    typedApp.post("/api/planning/edges", {
        schema: {
            body: zod_1.z.object({
                sourceId: zod_1.z.string(),
                targetId: zod_1.z.string(),
            }),
        },
    }, async (request, reply) => {
        const { sourceId, targetId } = request.body;
        await planningService.toggleEdge(request.user.id, sourceId, targetId);
        return reply.send({ success: true });
    });
}
