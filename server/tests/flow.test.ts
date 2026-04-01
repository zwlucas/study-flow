import test from "node:test";
import assert from "node:assert";
import { buildApp } from "../src/app";

test("Flow Domain Tests", async (t) => {
  const app = await buildApp();
  await app.ready();

  let token = "";
  let sessionId = "";

  // Helper para criar usuário e pegar token antes dos testes restritos
  t.before(async () => {
    const email = `flowuser-${Date.now()}@example.com`;
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password: "testpassword" },
    });
    token = JSON.parse(res.payload).data.token;
  });

  await t.test("GET /api/flow/sessions - Sem Auth (401)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/flow/sessions",
    });

    assert.strictEqual(response.statusCode, 401);
  });

  await t.test("POST /api/flow/sessions - Cria sessão (201)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/flow/sessions",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        title: "Sessão de Foco Deep Work",
        duration: 25,
        tags: ["TypeScript", "Backend"],
      },
    });

    assert.strictEqual(response.statusCode, 201);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.data.title, "Sessão de Foco Deep Work");
    assert.strictEqual(body.data.status, "in_progress");
    
    // Armazena ID para próximos testes
    sessionId = body.data.id;
  });

  await t.test("GET /api/flow/sessions - Lista sessões do usuário (200)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/flow/sessions",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.meta.total, 1);
    assert.strictEqual(body.data[0].id, sessionId);
  });

  await t.test("PATCH /api/flow/sessions/:id - Atualiza status (200)", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/flow/sessions/${sessionId}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        status: "completed",
      },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.data.status, "completed");
  });

  await t.test("PATCH /api/flow/sessions/:id - ID inválido/Não encotrado (404)", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/api/flow/sessions/00000000-0000-0000-0000-000000000000",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        status: "completed",
      },
    });

    assert.strictEqual(response.statusCode, 404);
  });

  await t.test("DELETE /api/flow/sessions/:id - Remove sessão (200)", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/api/flow/sessions/${sessionId}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.strictEqual(body.success, true);
  });

  // Tentar deletar de novo (deve retornar 404)
  await t.test("DELETE /api/flow/sessions/:id - Já removida (404)", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/api/flow/sessions/${sessionId}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 404);
  });

  await app.close();
});
