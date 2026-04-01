import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import authPlugin from "./plugins/auth";
import errorHandlerPlugin from "./plugins/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import flowRoutes from "./modules/flow/flow.routes";
import progressRoutes from "./modules/progress/progress.routes";
import homeRoutes from "./modules/home/home.routes";
import planningRoutes from "./modules/planning/planning.routes";
import { aiRoutes } from "./modules/ai/ai.routes";

export async function buildApp() {
  const app = fastify({
    logger: true, // Pino logger nativo para rastreabilidade
  });

  // Providers para Zod (Validação de Input)
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Segurança: Helmet blindando headers HTTP
  await app.register(helmet, {
    // Permite que o Next.js / Tauri converse com a API localmente
    crossOriginResourcePolicy: false,
  });

  // Segurança: CORS restritivo
  await app.register(cors, {
    origin: ["http://localhost:3000", "tauri://localhost", "http://localhost:1420"], // Ajustado para portas comuns
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  // Segurança: Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Plugins customizados
  await app.register(authPlugin);
  await app.register(errorHandlerPlugin);

  // Healthcheck Route
  app.get("/api/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Rotas de Domínio
  await app.register(authRoutes);
  await app.register(flowRoutes);
  await app.register(progressRoutes);
  await app.register(homeRoutes);
  await app.register(planningRoutes);
  await app.register(aiRoutes);

  return app;
}
