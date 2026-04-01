import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { config } from "dotenv";
import * as schema from "./schema";

config();

const sqlite = new Database(process.env.DATABASE_URL || "studyflow.db");

// Performance e concorrência no SQLite: Ativar o modo WAL (Write-Ahead Logging)
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL"); // Com WAL, NORMAL é seguro e mais rápido que FULL
sqlite.pragma("foreign_keys = ON"); // Ativar constraints de foreign key

export const db = drizzle(sqlite, { schema });
