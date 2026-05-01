export type StatoEmotivo = "neutro" | "interessato" | "dubbioso" | "irritato" | "convinto";

export interface Valutazione {
  ascolto: number;       // 1-5
  esplorazione: number;  // 1-5
  empatia: number;       // 1-5
  gestione_obiezione: number; // 1-5
}

export interface RispostaCliente {
  messaggio_cliente: string;
  stato_emotivo: StatoEmotivo;
  apertura: number; // 1-10
  valutazione: Valutazione;
  feedback_breve: string;
}

export interface Messaggio {
  ruolo: "venditore" | "cliente";
  testo: string;
  stato?: RispostaCliente; // presente solo nei messaggi cliente
  timestamp: number;
}

export interface StatoSimulazione {
  messaggi: Messaggio[];
  statoCorrente: RispostaCliente | null;
  loading: boolean;
  errore: string | null;
  conversazioneAvviata: boolean;
}

// Tipo per il payload API (storico in formato Anthropic)
export interface MessaggioAPI {
  role: "user" | "assistant";
  content: string;
}
