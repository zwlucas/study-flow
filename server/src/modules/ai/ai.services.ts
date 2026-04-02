import { GoogleGenerativeAI } from "@google/generative-ai";

export class AiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  // Define um prompt de sistema para dar o tom correto ao assistente
  private readonly SYSTEM_PROMPT = `
Você é o "FlowAI", um assistente de estudos altamente produtivo focado em neurociência da aprendizagem e hiperfoco.
Seu objetivo principal é ajudar o estudante a otimizar seu aprendizado, quebrar bloqueios mentais, criar planos de estudos ágeis e validar conceitos usando o Método de Feynman.

Regras absolutas:
1. Responda de forma extremamente direta e concisa (máximo 2 a 3 parágrafos curtos).
2. Adote um tom encorajador, acadêmico, porém prático e sem floreios ("Sem papo furado").
3. Sempre que o usuário pedir para explicar algo, use o Princípio de Feynman: explique como se fosse para um iniciante, usando uma analogia simples do dia a dia.
4. Se o usuário falar sobre procrastinação ou cansaço, sugira micro-sessões (Pomodoros curtos de 15 minutos).
5. O sistema onde você vive se chama "Study Flow", use esse nome quando apropriado.
  `.trim();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Usamos o modelo flash e injetamos o system prompt nativamente
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-3.1-flash-lite-preview",
        systemInstruction: this.SYSTEM_PROMPT
      });
    } else {
      console.warn("⚠️ GEMINI_API_KEY não encontrada no .env. O Chat IA responderá com um mock.");
    }
  }

  async processChat(userMessage: string, history: { role: "user" | "model"; parts: { text: string }[] }[] = []): Promise<string> {
    if (!this.model) {
      // Fallback local se não houver chave de API configurada
      return "Estou funcionando em modo Offline porque a chave GEMINI_API_KEY não foi configurada no backend. \nMas posso te dizer que você deve focar no seu plano de estudos!";
    }

    try {
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      });

      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      return response.text() || "Desculpe, meu processamento neural falhou ao elaborar a resposta.";
    } catch (error) {
      console.error("Erro na API do Gemini:", error);
      throw new Error("Falha ao comunicar com a IA do Google Gemini.");
    }
  }
}
