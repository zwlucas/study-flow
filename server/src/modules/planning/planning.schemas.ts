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
        coverImage: z.string().nullable().optional(),
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

export const createPlanningNodeSchema = z.object({
  title: z.string().min(1).max(200),
  sub: z.string().max(500).optional().default(""),
  icon: z
    .enum(["BookOpen", "Atom", "Sigma", "Cpu", "FlaskConical"])
    .optional()
    .default("BookOpen"),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  /** Data URL base64: ~10 MB ficheiro + margem. */
  coverImage: z.string().max(15_000_000).optional(),
});

export const updatePlanningNodeSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    sub: z.string().max(500).optional(),
    icon: z.enum(["BookOpen", "Atom", "Sigma", "Cpu", "FlaskConical"]).optional(),
    /** String vazia remove a capa. */
    coverImage: z.union([z.string().max(15_000_000), z.literal("")]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "Envie pelo menos um campo para atualizar.",
  });

export const planningNodeDtoSchema = z.object({
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
  coverImage: z.string().nullable().optional(),
});
