import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(
    z.object({
      role: z.enum(["user", "model"]),
      parts: z.array(z.object({ text: z.string() })),
    })
  ).optional().default([]),
});

export const chatResponseSchema = z.object({
  reply: z.string(),
});
