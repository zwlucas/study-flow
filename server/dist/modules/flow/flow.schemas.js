"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSessionBodySchema = exports.createSessionBodySchema = exports.getSessionsQuerySchema = exports.sessionSchema = void 0;
const zod_1 = require("zod");
exports.sessionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    title: zod_1.z.string(),
    duration: zod_1.z.number().int().min(1),
    status: zod_1.z.enum(["completed", "cancelled", "in_progress"]),
    tags: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
});
exports.getSessionsQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(["completed", "cancelled", "in_progress"]).optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
});
exports.createSessionBodySchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    duration: zod_1.z.number().int().min(1).max(1440),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updateSessionBodySchema = zod_1.z.object({
    status: zod_1.z.enum(["completed", "cancelled", "in_progress"]).optional(),
    duration: zod_1.z.number().int().min(1).max(1440).optional(),
});
