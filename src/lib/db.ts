import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { StudyDb } from "@/lib/types";

const DEFAULT_DB: StudyDb = {
  sessions: [
    {
      id: "s1",
      subject: "Quantum Mechanics",
      startedAt: new Date().toISOString(),
      durationMinutes: 45,
      completed: true,
      focusScore: 92,
    },
  ],
  tasks: [
    {
      id: "t1",
      title: "Resumo de Schrödinger",
      subject: "Física",
      status: "today",
      priority: "high",
      estimatedMinutes: 35,
    },
    {
      id: "t2",
      title: "Flashcards de Álgebra",
      subject: "Matemática",
      status: "backlog",
      priority: "medium",
      estimatedMinutes: 20,
    },
    {
      id: "t3",
      title: "Lista de revisão",
      subject: "Química",
      status: "done",
      priority: "low",
      estimatedMinutes: 25,
    },
  ],
};

function getDbPath() {
  return path.join(process.cwd(), "data", "study-flow-db.json");
}

async function ensureDbFile() {
  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);
  await mkdir(dbDir, { recursive: true });

  try {
    await readFile(dbPath, "utf-8");
  } catch {
    await writeFile(dbPath, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
  }
}

export async function readDb(): Promise<StudyDb> {
  await ensureDbFile();
  const content = await readFile(getDbPath(), "utf-8");
  return JSON.parse(content) as StudyDb;
}

export async function writeDb(db: StudyDb) {
  await ensureDbFile();
  await writeFile(getDbPath(), JSON.stringify(db, null, 2), "utf-8");
}
