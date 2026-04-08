import path from "node:path";
import { config } from "dotenv";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./db";
import { buildApp } from "./app";

config(); // Load variables from .env

/** Garante tabelas (roadmap_*, users, …) antes de aceitar tráfego — evita 500 se `db:migrate` não foi rodado. */
const migrationsFolder = path.join(__dirname, "..", "migrations");
migrate(db, { migrationsFolder });

const PORT = parseInt(process.env.PORT || "3333", 10);
const HOST = process.env.HOST || "0.0.0.0"; // Fastify defaults to localhost unless 0.0.0.0 is used

async function startServer() {
  const app = await buildApp();

  try {
    const url = await app.listen({ port: PORT, host: HOST });
    app.log.info(`API Server rodando em ${url}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer();
