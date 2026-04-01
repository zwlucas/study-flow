"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const auth_1 = __importDefault(require("./plugins/auth"));
const errorHandler_1 = __importDefault(require("./plugins/errorHandler"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const flow_routes_1 = __importDefault(require("./modules/flow/flow.routes"));
const progress_routes_1 = __importDefault(require("./modules/progress/progress.routes"));
const home_routes_1 = __importDefault(require("./modules/home/home.routes"));
const planning_routes_1 = __importDefault(require("./modules/planning/planning.routes"));
const ai_routes_1 = require("./modules/ai/ai.routes");
async function buildApp() {
    const app = (0, fastify_1.default)({
        logger: true, // Pino logger nativo para rastreabilidade
    });
    // Providers para Zod (Validação de Input)
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    // Segurança: Helmet blindando headers HTTP
    await app.register(helmet_1.default, {
        // Permite que o Next.js / Tauri converse com a API localmente
        crossOriginResourcePolicy: false,
    });
    // Segurança: CORS restritivo
    await app.register(cors_1.default, {
        origin: ["http://localhost:3000", "tauri://localhost", "http://localhost:1420"], // Ajustado para portas comuns
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    });
    // Segurança: Rate Limiting
    await app.register(rate_limit_1.default, {
        max: 100,
        timeWindow: "1 minute",
    });
    // Plugins customizados
    await app.register(auth_1.default);
    await app.register(errorHandler_1.default);
    // Healthcheck Route
    app.get("/api/health", async () => {
        return { status: "ok", timestamp: new Date().toISOString() };
    });
    // Rotas de Domínio
    await app.register(auth_routes_1.default);
    await app.register(flow_routes_1.default);
    await app.register(progress_routes_1.default);
    await app.register(home_routes_1.default);
    await app.register(planning_routes_1.default);
    await app.register(ai_routes_1.aiRoutes);
    return app;
}
