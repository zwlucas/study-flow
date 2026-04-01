"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResponseSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("E-mail inválido."),
    password: zod_1.z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("E-mail inválido."),
    password: zod_1.z.string().min(1, "A senha é obrigatória."),
});
exports.authResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        token: zod_1.z.string(),
        user: zod_1.z.object({
            id: zod_1.z.string(),
            email: zod_1.z.string(),
        }),
    }),
});
