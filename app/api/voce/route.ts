import { NextRequest, NextResponse } from "next/server";

// Sintesi vocale del cliente con OpenAI (gpt-4o-mini-tts).
// Richiede OPENAI_API_KEY. Se manca, risponde 501 e il client usa la voce del browser.

const MODELLO = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const MAX_CARATTERI = 1000;

// Una voce fissa per personaggio: cambia qui per assegnarne altre.
// Voci disponibili: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse
const VOCE_PER_PERSONAGGIO: Record<string, string> = {
  "giovane-coppia": "coral",
  famiglia: "ash",
  single: "shimmer",
  "coppia-matura": "sage",
};
const VOCE_DEFAULT = "alloy";

const ISTRUZIONI_BASE =
  "Sei un cliente reale in uno showroom di cucine Scavolini e parli in italiano. " +
  "Parlato spontaneo e quotidiano, ritmo naturale, niente tono da pubblicità, da speaker o da assistente virtuale.";

const ISTRUZIONI_STATO: Record<string, string> = {
  neutro: "Tono pacato e neutro, attento ma senza entusiasmo.",
  interessato: "Tono più caldo e curioso, ritmo un po' più vivace, si sente che stai ascoltando volentieri.",
  dubbioso: "Tono esitante e incerto, qualche pausa breve, voce un po' più bassa e prudente.",
  irritato: "Tono secco e freddo, un po' impaziente, frasi nette. Non urlare e non esagerare.",
  convinto: "Tono sereno, caloroso e deciso, di chi si sta fidando.",
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ errore: "OPENAI_API_KEY non configurata" }, { status: 501 });
  }

  let body: { testo?: unknown; personaggioId?: unknown; statoEmotivo?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ errore: "Richiesta non valida" }, { status: 400 });
  }

  const testo = typeof body.testo === "string" ? body.testo.trim() : "";
  if (!testo) {
    return NextResponse.json({ errore: "Testo mancante" }, { status: 400 });
  }
  if (testo.length > MAX_CARATTERI) {
    return NextResponse.json({ errore: "Testo troppo lungo" }, { status: 413 });
  }

  const voce =
    (typeof body.personaggioId === "string" && VOCE_PER_PERSONAGGIO[body.personaggioId]) ||
    VOCE_DEFAULT;
  const statoTesto =
    (typeof body.statoEmotivo === "string" && ISTRUZIONI_STATO[body.statoEmotivo]) ||
    ISTRUZIONI_STATO.neutro;

  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELLO,
        voice: voce,
        input: testo,
        instructions: `${ISTRUZIONI_BASE} ${statoTesto}`,
        response_format: "mp3",
      }),
    });

    if (!res.ok) {
      const dettaglio = await res.text().catch(() => "");
      console.error("OpenAI TTS errore", res.status, dettaglio.slice(0, 300));
      return NextResponse.json({ errore: "Errore dal servizio vocale" }, { status: 502 });
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("Errore /api/voce", err);
    return NextResponse.json({ errore: "Errore di connessione al servizio vocale" }, { status: 500 });
  }
}
