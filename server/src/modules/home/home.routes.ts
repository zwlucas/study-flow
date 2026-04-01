import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { getHomeSummaryResponseSchema } from "./home.schemas";
import { HomeService } from "./home.services";

export default async function homeRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const homeService = new HomeService();

  typedApp.addHook("onRequest", app.authenticate);

  typedApp.get(
    "/api/home/summary",
    {
      schema: {
        response: {
          200: getHomeSummaryResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const summary = await homeService.getSummary(request.user.id);
      return reply.send({ data: summary });
    }
  );
}
