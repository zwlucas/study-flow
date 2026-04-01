"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeSummaryResponseSchema = void 0;
const zod_1 = require("zod");
exports.getHomeSummaryResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        dailyPriority: zod_1.z.object({
            id: zod_1.z.string().optional(),
            title: zod_1.z.string(),
            status: zod_1.z.string(),
        }).nullable(),
        weeklyGoalProgress: zod_1.z.object({
            currentMinutes: zod_1.z.number(),
            targetMinutes: zod_1.z.number(),
        }),
        focusQuality: zod_1.z.number(),
        sessionsToday: zod_1.z.number(),
    }),
});
