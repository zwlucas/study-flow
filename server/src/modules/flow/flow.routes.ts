import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  getSessionsQuerySchema,
  createSessionBodySchema,
  updateSessionBodySchema,
  sessionSchema,
} from "./flow.schemas";
import { FlowService } from "./flow.services";

export default async function flowRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const flowService = new FlowService();

  // Middleware global para todas as rotas deste plugin: requer Autenticação JWT
  typedApp.addHook("onRequest", app.authenticate);

  typedApp.get(
    "/api/flow/sessions",
    {
      schema: {
        query: getSessionsQuerySchema,
        response: {
          200: z.object({
            data: z.array(sessionSchema),
            meta: z.object({ total: z.number() }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { status, page, limit } = request.query as any;
      const offset = (page - 1) * limit;

      const { data, total } = await flowService.getSessions(request.user.id, {
        status,
        limit,
        offset,
      });

      return reply.send({ data: data as any, meta: { total } });
    }
  );

  typedApp.post(
    "/api/flow/sessions",
    {
      schema: {
        body: createSessionBodySchema,
        response: {
          201: z.object({
            data: sessionSchema,
          }),
        },
      },
    },
    async (request, reply) => {
      const session = await flowService.createSession(request.user.id, request.body);
      return reply.status(201).send({ data: session as any });
    }
  );

  typedApp.patch(
    "/api/flow/sessions/:id",
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: updateSessionBodySchema,
        response: {
          200: z.object({
            data: sessionSchema,
          }),
        },
      },
    },
    async (request, reply) => {
      const updated = await flowService.updateSession(request.user.id, request.params.id, request.body);
      return reply.send({ data: updated as any });
    }
  );

  typedApp.delete(
    "/api/flow/sessions/:id",
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.object({ success: z.boolean() }),
        },
      },
    },
    async (request, reply) => {
      await flowService.deleteSession(request.user.id, request.params.id);
      return reply.send({ success: true });
    }
  );
}
