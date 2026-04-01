"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNodePositionSchema = exports.getRoadmapResponseSchema = void 0;
const zod_1 = require("zod");
exports.getRoadmapResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        nodes: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            title: zod_1.z.string(),
            sub: zod_1.z.string(),
            status: zod_1.z.string(),
            statusClass: zod_1.z.string(),
            progress: zod_1.z.number(),
            icon: zod_1.z.string(),
            iconWrap: zod_1.z.string(),
            meta: zod_1.z.string(),
            current: zod_1.z.boolean().optional().nullable(),
            blocked: zod_1.z.boolean().optional().nullable(),
            positionX: zod_1.z.number(),
            positionY: zod_1.z.number(),
        })),
        edges: zod_1.z.array(zod_1.z.object({
            sourceId: zod_1.z.string(),
            targetId: zod_1.z.string(),
        })),
    }),
});
exports.updateNodePositionSchema = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number(),
});
