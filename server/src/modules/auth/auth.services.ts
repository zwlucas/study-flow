import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from "node:crypto";

export class AuthService {
  // Configuração recomendada para scrypt (seguro e nativo no Node.js, sem dependência C++ como bcrypt)
  private readonly SCRYPT_KEYLEN = 64;

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, this.SCRYPT_KEYLEN).toString("hex");
    return `${salt}:${derivedKey}`;
  }

  private verifyPassword(password: string, hash: string): boolean {
    const [salt, key] = hash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, this.SCRYPT_KEYLEN);
    return timingSafeEqual(keyBuffer, derivedKey);
  }

  async register(email: string, passwordRaw: string) {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      // Retornar um erro genérico (ou não) - para evitar enumeração de usuários, na teoria do login,
      // mas no registro é comum avisar que já existe.
      const error: any = new Error("E-mail já está em uso.");
      error.code = "CONFLICT";
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = this.hashPassword(passwordRaw);
    const userId = randomUUID();

    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        email,
        passwordHash,
      })
      .returning({
        id: users.id,
        email: users.email,
      });

    return newUser;
  }

  async login(email: string, passwordRaw: string) {
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    
    // Evita timing attacks testando a senha contra um hash dummy se o usuário não existir
    if (!user) {
      this.hashPassword(passwordRaw); // Custo computacional similar
      const error: any = new Error("Credenciais inválidas.");
      error.code = "UNAUTHORIZED";
      error.statusCode = 401;
      throw error;
    }

    const isValid = this.verifyPassword(passwordRaw, user.passwordHash);
    if (!isValid) {
      const error: any = new Error("Credenciais inválidas.");
      error.code = "UNAUTHORIZED";
      error.statusCode = 401;
      throw error;
    }

    return { id: user.id, email: user.email };
  }
}
