import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEBRIEF_SYSTEM = `Sei Renato, formatore esperto del Metodo delle Competenze Risonanti (MCR).
Hai appena osservato una conversazione di simulazione tra un venditore e Luca, un cliente guardingo.

Ti viene fornito lo storico completo della conversazione e l'andamento dell'apertura relazionale di Luca turno per turno.

Rispondi ESCLUSIVAMENTE con JSON valido in questo formato:
{
  "osservazione": "3-4 righe che restituiscono all'utente il pattern principale osservato. Non valutare se ha fatto bene o male. Descrivi cosa ha fatto, come ha reagito Luca, e nomina la competenza MCR che questa situazione ha allenato (es: ascolto esplorativo, gestione della resistenza, connessione emotiva, flessibilità comunicativa).",
  "domanda_riflessione": "una sola domanda aperta che inviti l'utente a portare questa esperienza nel suo contesto reale di lavoro. Deve essere concreta e personale, non generica."
}

Regole per l'osservazione:
- Non usare mai "bravo", "ottimo", "corretto", "sbagliato"
- Descrivi pattern, non singoli episodi
- Nomina la competenza MCR specifica allenata
- Tono: diretto, caldo, professionale

Regole per la domanda di riflessione:
- Una sola domanda
- Deve collegarsi a qualcosa di specifico emerso nella conversazione
- Deve invitare a pensare a un contesto reale, non alla simulazione`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { errore: "ANTHROPIC_API_KEY non configurata" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { conversazione, aperturaPerTurno } = body;

    if (!conversazione || !Array.isArray(conversazione)) {
      return NextResponse.json(
        { errore: "Payload non valido" },
        { status: 400 }
      );
    }

    const conversazioneFormattata = conversazione
      .map((m: { ruolo: string; testo: string }, i: number) => `[${i + 1}] ${m.ruolo === "venditore" ? "VENDITORE" : "LUCA"}: ${m.testo}`)
      .join("\n");

    const aperturaFormattata = Array.isArray(aperturaPerTurno)
      ? `Apertura relazionale turno per turno: ${aperturaPerTurno.join(" → ")}`
      : "";

    const userMessage = `Ecco la conversazione osservata:\n\n${conversazioneFormattata}\n\n${aperturaFormattata}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: DEBRIEF_SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });

    const testoRisposta =
      response.content[0].type === "text" ? response.content[0].text : "";

    const matchJson = testoRisposta.match(/\{[\s\S]*\}/);
    const jsonDaParsare = matchJson ? matchJson[0] : testoRisposta.trim();
    const parsed = JSON.parse(jsonDaParsare);

    return NextResponse.json({
      osservazione: parsed.osservazione || "",
      domanda_riflessione: parsed.domanda_riflessione || "",
    });
  } catch (error: unknown) {
    console.error("Errore API debrief:", error);
    return NextResponse.json(
      { errore: error instanceof Error ? error.message : "Errore interno" },
      { status: 500 }
    );
  }
}
