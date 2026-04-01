import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = await readDb();
  return NextResponse.json({ sessions: db.sessions });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    subject?: string;
    durationMinutes?: number;
    completed?: boolean;
    focusScore?: number;
  };

  if (!payload.subject || !payload.durationMinutes) {
    return NextResponse.json(
      { error: "Campos obrigatórios: subject, durationMinutes." },
      { status: 400 },
    );
  }

  const db = await readDb();
  const session = {
    id: randomUUID(),
    subject: payload.subject,
    startedAt: new Date().toISOString(),
    durationMinutes: payload.durationMinutes,
    completed: Boolean(payload.completed),
    focusScore: payload.focusScore ?? 80,
  };

  db.sessions.unshift(session);
  await writeDb(db);

  return NextResponse.json(session, { status: 201 });
}
