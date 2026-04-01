import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const defaultSuggestions = [
  "Quebre o estudo em 3 blocos: teoria, prática e revisão ativa.",
  "Comece por tópicos de maior peso na prova para maximizar resultado.",
  "Feche com 10 minutos de recapitulação e 5 questões rápidas.",
];

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { message?: string };
  if (!payload.message?.trim()) {
    return NextResponse.json({ error: "Envie uma mensagem." }, { status: 400 });
  }

  const normalized = payload.message.toLowerCase();
  let reply = defaultSuggestions[0];

  if (normalized.includes("enem") || normalized.includes("história")) {
    reply =
      "Para ENEM em História: 30 min de contexto histórico, 40 min de tópicos-chave e 30 min de questões comentadas.";
  } else if (normalized.includes("física")) {
    reply =
      "Em Física, priorize: 15 min fórmula-base, 45 min exercícios graduais e 10 min revisão de erros.";
  } else if (normalized.includes("cansado") || normalized.includes("foco")) {
    reply =
      "Faça um ciclo 25/5 com respiração de 2 minutos antes de começar; isso melhora ativação e clareza mental.";
  }

  return NextResponse.json({
    role: "assistant",
    reply,
    tips: defaultSuggestions,
    timestamp: new Date().toISOString(),
  });
}
