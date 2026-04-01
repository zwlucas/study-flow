"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutes = aiRoutes;
const ai_schemas_1 = require("./ai.schemas");
const ai_services_1 = require("./ai.services");
async function aiRoutes(app) {
    const aiService = new ai_services_1.AiService();
    app.post("/api/ai/chat", {
        onRequest: [app.authenticate],
        schema: {
            body: ai_schemas_1.chatRequestSchema,
            response: {
                200: ai_schemas_1.chatResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { message } = request.body;
        try {
            const aiReply = await aiService.processChat(message);
            return reply.send({ reply: aiReply });
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: "Internal Server Error during AI chat processing" });
        }
    });
}
