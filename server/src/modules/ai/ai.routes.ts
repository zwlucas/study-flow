import { FastifyInstance } from "fastify";
import { chatRequestSchema, chatResponseSchema } from "./ai.schemas";
import { AiService } from "./ai.services";

export async function aiRoutes(app: FastifyInstance) {
  const aiService = new AiService();

  app.post(
    "/api/ai/chat",
    {
      onRequest: [app.authenticate],
      schema: {
        body: chatRequestSchema,
        response: {
          200: chatResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { message, history } = request.body as { 
        message: string; 
        history: { role: "user" | "model"; parts: { text: string }[] }[] 
      };

      try {
        const aiReply = await aiService.processChat(message, history);
        return reply.send({ reply: aiReply });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: "Internal Server Error during AI chat processing" });
      }
    }
  );
}
