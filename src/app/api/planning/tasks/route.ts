import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { PlanningTask, TaskStatus } from "@/lib/types";

export const runtime = "nodejs";

function isValidStatus(value: string): value is TaskStatus {
  return value === "backlog" || value === "today" || value === "done";
}

export async function GET() {
  const db = await readDb();
  return NextResponse.json({ tasks: db.tasks });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<PlanningTask>;
  if (!payload.title || !payload.subject) {
    return NextResponse.json({ error: "Campos obrigatórios: title e subject." }, { status: 400 });
  }

  const db = await readDb();
  const task: PlanningTask = {
    id: randomUUID(),
    title: payload.title,
    subject: payload.subject,
    status: payload.status && isValidStatus(payload.status) ? payload.status : "backlog",
    priority: payload.priority ?? "medium",
    estimatedMinutes: payload.estimatedMinutes ?? 25,
  };
  db.tasks.unshift(task);
  await writeDb(db);
  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const payload = (await request.json()) as { id?: string; status?: TaskStatus };
  if (!payload.id || !payload.status || !isValidStatus(payload.status)) {
    return NextResponse.json({ error: "Envie id e status válido." }, { status: 400 });
  }

  const db = await readDb();
  const task = db.tasks.find((item) => item.id === payload.id);
  if (!task) {
    return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }
  task.status = payload.status;
  await writeDb(db);
  return NextResponse.json(task);
}
