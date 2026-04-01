import { z } from "zod";

export const getHomeSummaryResponseSchema = z.object({
  data: z.object({
    dailyPriority: z.object({
      id: z.string().optional(),
      title: z.string(),
      status: z.string(),
    }).nullable(),
    weeklyGoalProgress: z.object({
      currentMinutes: z.number(),
      targetMinutes: z.number(),
    }),
    focusQuality: z.number(),
    sessionsToday: z.number(),
  }),
});
