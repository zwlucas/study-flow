import { z } from "zod";

export const sessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  duration: z.number().int().min(1),
  status: z.enum(["completed", "cancelled", "in_progress"]),
  tags: z.string().nullable(),
  createdAt: z.string(),
});

export const getSessionsQuerySchema = z.object({
  status: z.enum(["completed", "cancelled", "in_progress"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const createSessionBodySchema = z.object({
  title: z.string().min(1).max(100),
  duration: z.number().int().min(1).max(1440),
  tags: z.array(z.string()).optional(),
});

export const updateSessionBodySchema = z.object({
  status: z.enum(["completed", "cancelled", "in_progress"]).optional(),
  duration: z.number().int().min(1).max(1440).optional(),
});
