"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = homeRoutes;
const home_schemas_1 = require("./home.schemas");
const home_services_1 = require("./home.services");
async function homeRoutes(app) {
    const typedApp = app.withTypeProvider();
    const homeService = new home_services_1.HomeService();
    typedApp.addHook("onRequest", app.authenticate);
    typedApp.get("/api/home/summary", {
        schema: {
            response: {
                200: home_schemas_1.getHomeSummaryResponseSchema,
            },
        },
    }, async (request, reply) => {
        const summary = await homeService.getSummary(request.user.id);
        return reply.send({ data: summary });
    });
}
