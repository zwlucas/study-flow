import test from "node:test";
import assert from "node:assert";
import { buildApp } from "../src/app";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

// Configura o banco de dados de testes em memória antes de tudo
migrate(db, { migrationsFolder: "./migrations" });

test("Auth Domain Tests", async (t) => {
  const app = await buildApp();
  await app.ready();

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "strongPassword123";

  await t.test("POST /api/auth/register - Success (201)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: testEmail,
        password: testPassword,
      },
    });

    assert.strictEqual(response.statusCode, 201);
    const body = JSON.parse(response.payload);
    assert.ok(body.data.token, "Deve retornar um token JWT");
    assert.strictEqual(body.data.user.email, testEmail);
  });

  await t.test("POST /api/auth/register - Conflict / Duplicado (409)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: testEmail,
        password: testPassword,
      },
    });

    assert.strictEqual(response.statusCode, 409);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.error.code, "CONFLICT");
  });

  await t.test("POST /api/auth/login - Success (200)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: testEmail,
        password: testPassword,
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.ok(body.data.token, "Deve retornar um token JWT no login");
  });

  await t.test("POST /api/auth/login - Invalid Password (401)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: testEmail,
        password: "wrongPassword",
      },
    });

    assert.strictEqual(response.statusCode, 401);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.error.code, "UNAUTHORIZED");
  });

  await t.test("POST /api/auth/register - Validation Error / Zod (400)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "not-an-email",
        password: "123", // muito curta
      },
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.error.code, "VALIDATION_ERROR");
  });

  await app.close();
});
