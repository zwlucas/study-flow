"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressResponseSchema = exports.getProgressQuerySchema = void 0;
const zod_1 = require("zod");
exports.getProgressQuerySchema = zod_1.z.object({
    period: zod_1.z.enum(["7d", "30d", "all"]).default("7d"),
});
exports.progressResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        totalFocusMinutes: zod_1.z.number(),
        sessionsCompleted: zod_1.z.number(),
        currentStreak: zod_1.z.number(),
        dailyFocus: zod_1.z.array(zod_1.z.object({
            date: zod_1.z.string(),
            minutes: zod_1.z.number(),
        })),
    }),
});
