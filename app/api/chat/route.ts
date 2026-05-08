import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { MessaggioAPI, RispostaCliente } from "@/lib/types";
import { getPersonaggio } from "@/lib/personaggi";
import { getFase } from "@/lib/fasi";
import { buildSystemPrompt } from "@/lib/prompt-builder";
import type { Difficolta } from "@/lib/prompt-builder";
import type { FaseId } from "@/lib/personaggi";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function parseRispostaClaude(testo: string): RispostaCliente {
  const parsed = JSON.parse(testo);

  if (
    typeof parsed.messaggio_cliente !== "string" ||
    !["neutro", "interessato", "dubbioso", "irritato", "convinto"].includes(
      parsed.stato_emotivo
    ) ||
    typeof parsed.apertura !== "number" ||
    parsed.apertura < 1 ||
    parsed.apertura > 10
  ) {
    throw new Error("JSON risposta Claude non valido");
  }

  return {
    messaggio_cliente: parsed.messaggio_cliente,
    stato_emotivo: parsed.stato_emotivo,
    apertura: Math.round(parsed.apertura),
    valutazione: {
      ascolto: Math.min(5, Math.max(1, Number(parsed.valutazione?.ascolto) || 3)),
      esplorazione: Math.min(5, Math.max(1, Number(parsed.valutazione?.esplorazione) || 3)),
      empatia: Math.min(5, Math.max(1, Number(parsed.valutazione?.empatia) || 3)),
      gestione_obiezione: Math.min(
        5,
        Math.max(1, Number(parsed.valutazione?.gestione_obiezione) || 3)
      ),
    },
    feedback_breve: parsed.feedback_breve || "",
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { errore: "ANTHROPIC_API_KEY non configurata" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      messaggi,
      personaggioId,
      faseId,
      difficolta,
    }: {
      messaggi: MessaggioAPI[];
      personaggioId?: string;
      faseId?: FaseId;
      difficolta?: Difficolta;
    } = body;

    if (!messaggi || !Array.isArray(messaggi) || messaggi.length === 0) {
      return NextResponse.json(
        { errore: "Payload non valido: campo messaggi mancante" },
        { status: 400 }
      );
    }

    // Costruisce il system prompt dal personaggio + fase + difficoltÃ 
    let systemPrompt: string;

    if (personaggioId && faseId && difficolta) {
      const personaggio = getPersonaggio(personaggioId);
      const fase = getFase(faseId);

      if (!personaggio || !fase) {
        return NextResponse.json(
          { errore: "Personaggio o fase non trovati" },
          { status: 400 }
        );
      }

      systemPrompt = buildSystemPrompt(personaggio, fase, difficolta);
    } else {
      return NextResponse.json(
        { errore: "Parametri mancanti: personaggioId, faseId, difficolta" },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messaggi,
    });

    const testoRisposta =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (!testoRisposta) {
      return NextResponse.json(
        { errore: "Risposta vuota da Claude" },
        { status: 500 }
      );
    }

    let jsonDaParsare = testoRisposta.trim();
    const matchJson = testoRisposta.match(/\{[\s\S]*\}/);
    if (matchJson) {
      jsonDaParsare = matchJson[0];
    }

    const rispostaCliente = parseRispostaClaude(jsonDaParsare);
    return NextResponse.json(rispostaCliente);
  } catch (error: unknown) {
    console.error("Errore API chat:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { errore: "Errore parsing JSON risposta Claude. Riprova." },
        { status: 500 }
      );
    }

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { errore: `Errore API Anthropic: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      {
        errore:
          error instanceof Error ? error.message : "Errore interno del server",
      },
      { status: 500 }
    );
  }
}
