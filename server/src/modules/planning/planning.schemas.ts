import { z } from "zod";

export const getRoadmapResponseSchema = z.object({
  data: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        sub: z.string(),
        status: z.string(),
        statusClass: z.string(),
        progress: z.number(),
        icon: z.string(),
        iconWrap: z.string(),
        meta: z.string(),
        current: z.boolean().optional().nullable(),
        blocked: z.boolean().optional().nullable(),
        positionX: z.number(),
        positionY: z.number(),
      })
    ),
    edges: z.array(
      z.object({
        sourceId: z.string(),
        targetId: z.string(),
      })
    ),
  }),
});

export const updateNodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
