"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schema_1 = require("../../db/schema");
const node_crypto_1 = require("node:crypto");
class AuthService {
    // Configuração recomendada para scrypt (seguro e nativo no Node.js, sem dependência C++ como bcrypt)
    SCRYPT_KEYLEN = 64;
    hashPassword(password) {
        const salt = (0, node_crypto_1.randomBytes)(16).toString("hex");
        const derivedKey = (0, node_crypto_1.scryptSync)(password, salt, this.SCRYPT_KEYLEN).toString("hex");
        return `${salt}:${derivedKey}`;
    }
    verifyPassword(password, hash) {
        const [salt, key] = hash.split(":");
        const keyBuffer = Buffer.from(key, "hex");
        const derivedKey = (0, node_crypto_1.scryptSync)(password, salt, this.SCRYPT_KEYLEN);
        return (0, node_crypto_1.timingSafeEqual)(keyBuffer, derivedKey);
    }
    async register(email, passwordRaw) {
        const existingUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).get();
        if (existingUser) {
            // Retornar um erro genérico (ou não) - para evitar enumeração de usuários, na teoria do login,
            // mas no registro é comum avisar que já existe.
            const error = new Error("E-mail já está em uso.");
            error.code = "CONFLICT";
            error.statusCode = 409;
            throw error;
        }
        const passwordHash = this.hashPassword(passwordRaw);
        const userId = (0, node_crypto_1.randomUUID)();
        const [newUser] = await db_1.db
            .insert(schema_1.users)
            .values({
            id: userId,
            email,
            passwordHash,
        })
            .returning({
            id: schema_1.users.id,
            email: schema_1.users.email,
        });
        return newUser;
    }
    async login(email, passwordRaw) {
        const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).get();
        // Evita timing attacks testando a senha contra um hash dummy se o usuário não existir
        if (!user) {
            this.hashPassword(passwordRaw); // Custo computacional similar
            const error = new Error("Credenciais inválidas.");
            error.code = "UNAUTHORIZED";
            error.statusCode = 401;
            throw error;
        }
        const isValid = this.verifyPassword(passwordRaw, user.passwordHash);
        if (!isValid) {
            const error = new Error("Credenciais inválidas.");
            error.code = "UNAUTHORIZED";
            error.statusCode = 401;
            throw error;
        }
        return { id: user.id, email: user.email };
    }
}
exports.AuthService = AuthService;
