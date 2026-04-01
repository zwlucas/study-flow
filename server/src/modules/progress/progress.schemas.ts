import { z } from "zod";

export const getProgressQuerySchema = z.object({
  period: z.enum(["7d", "30d", "all"]).default("7d"),
});

export const progressResponseSchema = z.object({
  data: z.object({
    totalFocusMinutes: z.number(),
    sessionsCompleted: z.number(),
    currentStreak: z.number(),
    dailyFocus: z.array(
      z.object({
        date: z.string(),
        minutes: z.number(),
      })
    ),
  }),
});
