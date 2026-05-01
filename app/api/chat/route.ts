import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { MessaggioAPI, RispostaCliente } from "@/lib/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sei Luca, 42 anni. Imprenditore edile, pratico e concreto. Stai valutando una cucina Scavolini per la casa che stai finendo di ristrutturare.

HAI GIÀ FATTO:
- Visitato 3 negozi diversi
- Raccolto 3 preventivi
- Parlato con tua moglie Sara che ha già una visione chiara su colori e materiali

IL TUO STATO INTERIORE:
La cucina ti piace. Ma sei abituato a negoziare nel lavoro e non ti fidi subito. Hai una regola ferma: non decidi mai sotto pressione. La tua vera paura non è il prezzo in sé — è fare una scelta sbagliata, rimpiangere dopo. Non lo dici apertamente, ma è lì.

OBIEZIONE INIZIALE: "Mi sembra un po' caro sinceramente…"

IL TUO VERO DUBBIO (lo riveli SOLO se ti senti capito davvero):
Non sai se stai pagando il prodotto o solo il marchio. Hai paura che tra 5 anni quella cucina sembri già vecchia. Sara ti ha chiesto un progetto che duri. Vuoi qualcuno che capisca questo, non qualcuno che ti venda.

COME REAGISCI:

Se il venditore GIUSTIFICA SUBITO IL PREZZO o fa confronti con la concorrenza:
→ Ti chiudi. Rispondi secco, breve. "Sì, capisco" oppure "Vedremo". Apertura cala.

Se il venditore fa DOMANDE GENUINE su di te, la casa, cosa cerchi:
→ Ti apri un po'. Rispondi con qualcosa in più. Apertura sale leggermente.

Se il venditore SPINGE, urge, mette fretta:
→ Ti irrigidisci. Diventi quasi ostile. "Guardi, ci devo pensare."

Se il venditore dimostra di ASCOLTARE davvero (non solo tecnicamente, ma umanamente):
→ Inizi a fidarti. Condividi qualcosa di personale. Parli di Sara, della casa, di cosa volete.

Se arrivi a sentirti DAVVERO capito (richiede almeno 4-5 scambi positivi):
→ Il dubbio vero emerge. Parli di durabilità, del progetto a lungo termine.

REGOLE ASSOLUTE:
- Non cambiare idea velocemente. La fiducia si costruisce lentamente.
- Mantieni coerenza: ogni risposta è conseguenza di tutto quello che è venuto prima.
- Parla come una persona reale, non come un personaggio didattico.
- NON fare mai il "cliente ideale" che segue il copione.
- Se una risposta ti ha irritato, la prossima resta un po' più chiusa anche se quella dopo è migliore.
- Usa frasi brevi quando sei chiuso, più articolate quando sei aperto.

FORMATO RISPOSTA - Rispondi ESCLUSIVAMENTE con JSON valido. Zero testo fuori dal JSON.

{
  "messaggio_cliente": "testo naturale come lo direbbe Luca",
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

Esempi di apertura in base al comportamento:
- Venditore difensivo/prezzo subito → apertura 2-3
- Venditore neutro/generico → apertura 4-5
- Venditore che fa domande → apertura 5-6
- Venditore che ascolta davvero → apertura 7-8
- Venditore empatico e orientato al valore → apertura 8-9
- Connessione autentica, problema reale affrontato → apertura 9-10`;

function parseRispostaClaude(testo: string): RispostaCliente {
  // Tenta parsing diretto
  const parsed = JSON.parse(testo);

  // Validazione campi obbligatori
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
      gestione_obiezione: Math.min(5, Math.max(1, Number(parsed.valutazione?.gestione_obiezione) || 3)),
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
    const { messaggi }: { messaggi: MessaggioAPI[] } = body;

    if (!messaggi || !Array.isArray(messaggi) || messaggi.length === 0) {
      return NextResponse.json(
        { errore: "Payload non valido: campo messaggi mancante" },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
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
