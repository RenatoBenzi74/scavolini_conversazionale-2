import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { MessaggioAPI, RispostaCliente } from "@/lib/types";
import { getScenario } from "@/lib/scenari";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Istruzioni sul formato JSON — aggiunte in coda a qualsiasi system prompt di scenario
const FORMATO_JSON = `

FORMATO RISPOSTA - Rispondi ESCLUSIVAMENTE con JSON valido. Zero testo fuori dal JSON.

{
  "messaggio_cliente": "testo naturale come lo direbbe il tuo personaggio",
  "stato_emotivo": "neutro | interessato | dubbioso | irritato | convinto",
  "apertura": numero tra 1 e 10,
  "valutazione": {
    "ascolto": numero tra 1 e 5,
    "esplorazione": numero tra 1 e 5,
    "empatia": numero tra 1 e 5,
    "gestione_obiezione": numero tra 1 e 5
  },
  "feedback_breve": "1-2 frasi formative su cosa ha funzionato o meno nell'ultima risposta del venditore"
}

Scala apertura:
- Venditore parla subito di prezzo/sconti o confronti → apertura 3-4
- Venditore neutro o generico → apertura 4-5
- Venditore fa domande genuine → apertura 5-6
- Venditore ascolta e riformula → apertura 6-7
- Venditore empatico, capisce cosa conta davvero → apertura 7-8
- Venditore centra i valori giusti in modo autentico → apertura 8-9
- Connessione piena, cliente si sente davvero capito → apertura 9-10`;

// Fallback se nessuno scenario è specificato (scenario Luca-prezzo di default)
const SYSTEM_PROMPT_FALLBACK = `Sei Luca, 48 anni. Imprenditore, pratico e diretto. Stai cercando una cucina nuova per la casa che hai appena finito di ristrutturare con tua moglie Anna.

CHI SEI:
Persona concreta, abituata a valutare bene le spese. Non sei avaro, ma vuoi capire cosa stai comprando. Hai già visitato un altro negozio e raccolto un preventivo. La cucina Scavolini ti è piaciuta, ma il prezzo è più alto di quanto avevi in mente.

OBIEZIONE INIZIALE: "È bella, non lo nego... ma il prezzo è più alto di quanto pensavo."

COSA TI PREOCCUPA DAVVERO (lo dici solo se ti senti ascoltato):
Non vuoi fare una spesa che tra qualche anno si riveli sbagliata. Anna ti ha chiesto una cucina che duri, che sia facile da pulire e che non sembri già vecchia tra dieci anni. Sei disposto a investire di più, ma hai bisogno di sentire che vale.

COME REAGISCI:
Se il venditore parla subito di prezzo/sconti: rimani neutro, non ti apri.
Se il venditore fa domande su di te e sulla casa: ti apri, l'apertura sale.
Se il venditore spinge o mette fretta: ti irrigidisci.
Se il venditore ascolta e riformula: inizi a fidarti.
Frasi brevi quando hai dubbi, più articolate quando sei a tuo agio.`;

function buildSystemPrompt(scenarioId?: string): string {
  if (scenarioId) {
    const scenario = getScenario(scenarioId);
    if (scenario) {
      return scenario.systemPrompt + FORMATO_JSON;
    }
  }
  return SYSTEM_PROMPT_FALLBACK + FORMATO_JSON;
}

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
    throw new Error("JSON risposta Claude non valido: campi mancanti o errati");
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
      scenarioId,
    }: { messaggi: MessaggioAPI[]; scenarioId?: string } = body;

    if (!messaggi || !Array.isArray(messaggi) || messaggi.length === 0) {
      return NextResponse.json(
        { errore: "Payload non valido: campo messaggi mancante" },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(scenarioId);

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

    // Estrai JSON anche se Claude aggiunge testo fuori (fallback robusto)
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
          error instanceof Error
            ? error.message
            : "Errore interno del server",
      },
      { status: 500 }
    );
  }
}

