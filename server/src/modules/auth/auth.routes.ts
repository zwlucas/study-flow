import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { registerSchema, loginSchema, authResponseSchema } from "./auth.schemas";
import { AuthService } from "./auth.services";

export default async function authRoutes(app: FastifyInstance) {
  // Objeto de tipagem do Fastify com Zod para auto-complete
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const authService = new AuthService();

  typedApp.post(
    "/api/auth/register",
    {
      schema: {
        body: registerSchema,
        response: { 201: authResponseSchema },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const user = await authService.register(email, password);
      
      const token = app.jwt.sign({ id: user.id, email: user.email }, { expiresIn: "7d" });

      return reply.status(201).send({
        data: { token, user },
      });
    }
  );

  typedApp.post(
    "/api/auth/login",
    {
      schema: {
        body: loginSchema,
        response: { 200: authResponseSchema },
      },
      config: {
        rateLimit: { max: 10, timeWindow: "5 minutes" },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const user = await authService.login(email, password);

      const token = app.jwt.sign({ id: user.id, email: user.email }, { expiresIn: "7d" });

      return reply.status(200).send({
        data: { token, user },
      });
    }
  );
}
