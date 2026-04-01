import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "A senha é obrigatória."),
});

export const authResponseSchema = z.object({
  data: z.object({
    token: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string(),
    }),
  }),
});
