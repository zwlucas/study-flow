import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createPlanningNodeSchema,
  getRoadmapResponseSchema,
  planningNodeDtoSchema,
  updateNodePositionSchema,
  updatePlanningNodeSchema,
} from "./planning.schemas";
import { PlanningService } from "./planning.services";

export default async function planningRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const planningService = new PlanningService();

  typedApp.addHook("onRequest", app.authenticate);

  typedApp.get(
    "/api/planning/roadmap",
    {
      schema: {
        response: {
          200: getRoadmapResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { nodes, edges } = await planningService.getRoadmap(request.user.id);
      return reply.send({ data: { nodes, edges } });
    }
  );

  typedApp.post(
    "/api/planning/nodes",
    {
      schema: {
        body: createPlanningNodeSchema,
        response: {
          201: z.object({ data: planningNodeDtoSchema }),
        },
      },
    },
    async (request, reply) => {
      const node = await planningService.createNode(request.user.id, request.body);
      return reply.code(201).send({ data: node });
    },
  );

  typedApp.patch(
    "/api/planning/nodes/:id/position",
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: updateNodePositionSchema,
      },
    },
    async (request, reply) => {
      const { x, y } = request.body;
      const updated = await planningService.updateNodePosition(
        request.user.id,
        request.params.id,
        x,
        y
      );
      return reply.send({ data: updated });
    }
  );

  typedApp.patch(
    "/api/planning/nodes/:id",
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: updatePlanningNodeSchema,
        response: {
          200: z.object({ data: planningNodeDtoSchema }),
        },
      },
    },
    async (request, reply) => {
      const node = await planningService.updateNode(
        request.user.id,
        request.params.id,
        request.body,
      );
      return reply.send({ data: node });
    },
  );

  typedApp.post(
    "/api/planning/edges",
    {
      schema: {
        body: z.object({
          sourceId: z.string(),
          targetId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { sourceId, targetId } = request.body;
      await planningService.toggleEdge(request.user.id, sourceId, targetId);
      return reply.send({ success: true });
    }
  );
}
