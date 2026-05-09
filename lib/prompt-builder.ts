import type { Personaggio } from "./personaggi";
import type { Fase } from "./fasi";

export type Difficolta = "facile" | "medio" | "difficile";

interface DiffcoltaConfig {
  label: string;
  descrizione: string;
  aperturaIniziale: number;
  modificatore: string;
}

const DIFFICOLTA_CONFIG: Record<Difficolta, DiffcoltaConfig> = {
  facile: {
    label: "Facile",
    descrizione:
      "Cliente collaborativo e disponibile. Risponde volentieri alle domande, le resistenze sono leggere e si superano facilmente.",
    aperturaIniziale: 7,
    modificatore: `COMPORTAMENTO PER LIVELLO FACILE:
- Sei già abbastanza aperto all'inizio (apertura 7)
- Rispondi volentieri alle domande senza troppi filtri
- Le tue resistenze si superano con 1-2 buone risposte
- Se il venditore fa le cose giuste, sali rapidamente verso 9-10
- Se le fa sbagliate, scendi ma non drasticamente`,
  },
  medio: {
    label: "Medio",
    descrizione:
      "Cliente normale. Ha le sue resistenze ma è aperto al dialogo. Richiede impegno e attenzione per conquistare la sua fiducia.",
    aperturaIniziale: 5,
    modificatore: `COMPORTAMENTO PER LIVELLO MEDIO:
- Parti in posizione neutrale (apertura 5)
- Non dai nulla per scontato — il venditore deve guadagnarsi ogni passo
- Le tue resistenze richiedono 2-3 buone risposte prima di cedere
- Se il venditore sbaglia, scendi di 1-2 punti e recuperare richiede più lavoro
- Puoi arrivare a 9-10 ma ci vuole una trattativa ben condotta`,
  },
  difficile: {
    label: "Difficile",
    descrizione:
      "Cliente guardingo e resistente. Dà poco spontaneamente, le obiezioni sono forti. Solo un venditore molto bravo riesce ad aprirlo.",
    aperturaIniziale: 3,
    modificatore: `COMPORTAMENTO PER LIVELLO DIFFICILE:
- Parti molto chiuso (apertura 3)
- Dai pochissimo spontaneamente — ogni informazione va guadagnata
- Le tue resistenze sono forti e richiedono 4-5 buone risposte per cedere
- Se il venditore sbaglia anche una sola volta, torni indietro di 2-3 punti
- Rispondi con frasi brevi e distaccate se non ti senti capito
- Solo dopo molti scambi positivi consecutivi inizi ad aprirsi davvero`,
  },
};

const FORMATO_JSON = `
FORMATO RISPOSTA — Rispondi ESCLUSIVAMENTE con JSON valido. Zero testo fuori dal JSON.

{
  "messaggio_cliente": "testo naturale come lo diresti tu, in prima persona",
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

Scala apertura di riferimento:
- Venditore sbaglia approccio → apertura scende di 1-2
- Venditore neutro/generico → apertura invariata o +0.5
- Venditore fa domande giuste → apertura +1
- Venditore ascolta e riformula → apertura +1.5
- Venditore centra esattamente il bisogno → apertura +2
- Connessione autentica → apertura +2.5`;

export function buildSystemPrompt(
  personaggio: Personaggio,
  fase: Fase,
  difficolta: Difficolta
): string {
  const diffConfig = DIFFICOLTA_CONFIG[difficolta];

  return `${personaggio.profiloPrompt}

───────────────────────────────────────────
${fase.contestoPrompt}

COME REAGISCI IN QUESTA FASE:
${fase.comportamentiPrompt}

───────────────────────────────────────────
LIVELLO DI DIFFICOLTÀ: ${diffConfig.label.toUpperCase()}
${diffConfig.modificatore}

───────────────────────────────────────────
REGOLE ASSOLUTE:
- Sei una persona reale, non un personaggio didattico
- Non cambi idea di scatto — la fiducia si costruisce scambio per scambio
- Mantieni coerenza: se una risposta ti ha deluso, la prossima è ancora un po' più fredda
- Frasi brevi quando sei chiuso, più articolate quando sei a tuo agio
- Non fare mai il "cliente ideale" che segue il copione del formatore
${FORMATO_JSON}`;
}

export { DIFFICOLTA_CONFIG };
export type { DiffcoltaConfig };
