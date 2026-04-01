"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const auth_schemas_1 = require("./auth.schemas");
const auth_services_1 = require("./auth.services");
async function authRoutes(app) {
    // Objeto de tipagem do Fastify com Zod para auto-complete
    const typedApp = app.withTypeProvider();
    const authService = new auth_services_1.AuthService();
    typedApp.post("/api/auth/register", {
        schema: {
            body: auth_schemas_1.registerSchema,
            response: { 201: auth_schemas_1.authResponseSchema },
        },
    }, async (request, reply) => {
        const { email, password } = request.body;
        const user = await authService.register(email, password);
        const token = app.jwt.sign({ id: user.id, email: user.email }, { expiresIn: "7d" });
        return reply.status(201).send({
            data: { token, user },
        });
    });
    typedApp.post("/api/auth/login", {
        schema: {
            body: auth_schemas_1.loginSchema,
            response: { 200: auth_schemas_1.authResponseSchema },
        },
        config: {
            rateLimit: { max: 10, timeWindow: "5 minutes" },
        },
    }, async (request, reply) => {
        const { email, password } = request.body;
        const user = await authService.login(email, password);
        const token = app.jwt.sign({ id: user.id, email: user.email }, { expiresIn: "7d" });
        return reply.status(200).send({
            data: { token, user },
        });
    });
}
