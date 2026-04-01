"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = flowRoutes;
const zod_1 = require("zod");
const flow_schemas_1 = require("./flow.schemas");
const flow_services_1 = require("./flow.services");
async function flowRoutes(app) {
    const typedApp = app.withTypeProvider();
    const flowService = new flow_services_1.FlowService();
    // Middleware global para todas as rotas deste plugin: requer Autenticação JWT
    typedApp.addHook("onRequest", app.authenticate);
    typedApp.get("/api/flow/sessions", {
        schema: {
            query: flow_schemas_1.getSessionsQuerySchema,
            response: {
                200: zod_1.z.object({
                    data: zod_1.z.array(flow_schemas_1.sessionSchema),
                    meta: zod_1.z.object({ total: zod_1.z.number() }),
                }),
            },
        },
    }, async (request, reply) => {
        const { status, page, limit } = request.query;
        const offset = (page - 1) * limit;
        const { data, total } = await flowService.getSessions(request.user.id, {
            status,
            limit,
            offset,
        });
        return reply.send({ data: data, meta: { total } });
    });
    typedApp.post("/api/flow/sessions", {
        schema: {
            body: flow_schemas_1.createSessionBodySchema,
            response: {
                201: zod_1.z.object({
                    data: flow_schemas_1.sessionSchema,
                }),
            },
        },
    }, async (request, reply) => {
        const session = await flowService.createSession(request.user.id, request.body);
        return reply.status(201).send({ data: session });
    });
    typedApp.patch("/api/flow/sessions/:id", {
        schema: {
            params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
            body: flow_schemas_1.updateSessionBodySchema,
            response: {
                200: zod_1.z.object({
                    data: flow_schemas_1.sessionSchema,
                }),
            },
        },
    }, async (request, reply) => {
        const updated = await flowService.updateSession(request.user.id, request.params.id, request.body);
        return reply.send({ data: updated });
    });
    typedApp.delete("/api/flow/sessions/:id", {
        schema: {
            params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
            response: {
                200: zod_1.z.object({ success: zod_1.z.boolean() }),
            },
        },
    }, async (request, reply) => {
        await flowService.deleteSession(request.user.id, request.params.id);
        return reply.send({ success: true });
    });
}
