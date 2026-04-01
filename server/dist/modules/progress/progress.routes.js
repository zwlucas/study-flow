"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = progressRoutes;
const progress_schemas_1 = require("./progress.schemas");
const progress_services_1 = require("./progress.services");
async function progressRoutes(app) {
    const typedApp = app.withTypeProvider();
    const progressService = new progress_services_1.ProgressService();
    typedApp.addHook("onRequest", app.authenticate);
    typedApp.get("/api/progress/analytics", {
        schema: {
            query: progress_schemas_1.getProgressQuerySchema,
            response: {
                200: progress_schemas_1.progressResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { period } = request.query;
        const analytics = await progressService.getAnalytics(request.user.id, period);
        return reply.send({ data: analytics });
    });
}
