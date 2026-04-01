import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  getProgressQuerySchema,
  progressResponseSchema,
} from "./progress.schemas";
import { ProgressService } from "./progress.services";

export default async function progressRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const progressService = new ProgressService();

  typedApp.addHook("onRequest", app.authenticate);

  typedApp.get(
    "/api/progress/analytics",
    {
      schema: {
        query: getProgressQuerySchema,
        response: {
          200: progressResponseSchema,
        },
      },
    },
    async (request: any, reply) => {
      const { period } = request.query;

      const analytics = await progressService.getAnalytics(
        request.user.id,
        period
      );

      return reply.send({ data: analytics });
    }
  );
}
