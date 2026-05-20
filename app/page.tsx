"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  Messaggio,
  RispostaCliente,
  MessaggioAPI,
  StatoSimulazione,
} from "@/lib/types";
import ClientePanel from "@/components/ClientePanel";
import ChatArea from "@/components/ChatArea";
import FeedbackPanel from "@/components/FeedbackPanel";
import MessageInput from "@/components/MessageInput";

const MAX_TURNI = 8;       // tetto massimo
const MIN_TURNI = 4;       // minimo prima di chiusura anticipata
const SOGLIA_SUCCESSO = 8; // apertura >= questo valore → chiudi prima

const STATO_INIZIALE: StatoSimulazione = {
  messaggi: [],
  statoCorrente: null,
  loading: false,
  errore: null,
  conversazioneAvviata: false,
};

function costruisciStorico(messaggi: Messaggio[]): MessaggioAPI[] {
  return messaggi.map((msg) => ({
    role: msg.ruolo === "venditore" ? "user" : "assistant",
    content:
      msg.ruolo === "cliente"
        ? JSON.stringify({
            messaggio_cliente: msg.testo,
            stato_emotivo: msg.stato?.stato_emotivo ?? "neutro",
            apertura: msg.stato?.apertura ?? 4,
            valutazione: msg.stato?.valutazione ?? {
              ascolto: 3,
              esplorazione: 3,
              empatia: 3,
              gestione_obiezione: 3,
            },
            feedback_breve: msg.stato?.feedback_breve ?? "",
          })
        : msg.testo,
  }));
}

// ─── PANNELLO INTRO ────────────────────────────────────────────────────────
function IntroPanel({ onEntra }: { onEntra: () => void }) {
  const [uscita, setUscita] = useState(false);

  const handleEntra = () => {
    setUscita(true);
    setTimeout(onEntra, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-opacity duration-400 ${
        uscita ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={handleEntra}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md mx-4 p-8 text-center space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <p className="text-slate-700 text-lg leading-relaxed font-medium">
            Non è un quiz. Non ci sono risposte giuste scritte da qualche parte.
          </p>
          <p className="text-slate-600 text-base leading-relaxed">
            C'è Luca — e lui reagisce davvero a quello che dici.
          </p>
          <p className="text-slate-500 text-base leading-relaxed">
            Ascolta. Esplora. Vedi cosa succede.
          </p>
        </div>
        <button
          onClick={handleEntra}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl px-6 py-3.5 transition-all active:scale-95 text-base"
          type="button"
        >
          Inizia la conversazione
        </button>
      </div>
    </div>
  );
}

// ─── GRAFICO APERTURA ──────────────────────────────────────────────────────
function GraficoApertura({ valori }: { valori: number[] }) {
  if (valori.length < 2) return null;

  const W = 320;
  const H = 80;
  const pad = 10;
  const xStep = (W - pad * 2) / (valori.length - 1);

  const points = valori.map((v, i) => {
    const x = pad + i * xStep;
    const y = H - pad - ((v - 1) / 9) * (H - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
        {/* Griglia */}
        {[2, 4, 6, 8, 10].map((v) => {
          const y = H - pad - ((v - 1) / 9) * (H - pad * 2);
          return (
            <line
              key={v}
              x1={pad}
              y1={y}
              x2={W - pad}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}
        {/* Linea */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Punti */}
        {valori.map((v, i) => {
          const x = pad + i * xStep;
          const y = H - pad - ((v - 1) / 9) * (H - pad * 2);
          let fill = "#f59e0b";
          if (v >= 8) fill = "#10b981";
          else if (v >= 6) fill = "#14b8a6";
          else if (v <= 3) fill = "#ef4444";
          return (
            <circle key={i} cx={x} cy={y} r="4" fill={fill} stroke="white" strokeWidth="1.5">
              <title>Turno {i + 1}: {v}/10</title>
            </circle>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-slate-400 px-2">
        <span>Inizio</span>
        <span>Fine</span>
      </div>
    </div>
  );
}

// ─── SCHERMATA DEBRIEFING ──────────────────────────────────────────────────
function DebriefingScreen({
  messaggi,
  aperturaPerTurno,
  onRicomincia,
}: {
  messaggi: Messaggio[];
  aperturaPerTurno: number[];
  onRicomincia: () => void;
}) {
  const [osservazione, setOsservazione] = useState("");
  const [domanda, setDomanda] = useState("");
  const [caricando, setCaricando] = useState(true);

  useEffect(() => {
    const conversazione = messaggi.map((m) => ({
      ruolo: m.ruolo,
      testo: m.testo,
    }));

    fetch("/api/debrief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversazione, aperturaPerTurno }),
    })
      .then((r) => r.json())
      .then((data) => {
        setOsservazione(data.osservazione || "");
        setDomanda(data.domanda_riflessione || "");
      })
      .catch(() => {
        setOsservazione("Non è stato possibile generare l'osservazione. Riprova.");
      })
      .finally(() => setCaricando(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-40 bg-slate-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Titolo */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">
            Cosa è successo in questa conversazione
          </h2>
          <p className="text-sm text-slate-500">
            {messaggi.filter((m) => m.ruolo === "venditore").length} scambi con Luca
          </p>
        </div>

        {/* Sezione 1 — Andamento */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Andamento apertura relazionale
          </h3>
          <GraficoApertura valori={aperturaPerTurno} />
          <div className="flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/> 1–3 chiuso</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/> 4–6 neutro</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/> 7–10 aperto</span>
          </div>
        </div>

        {/* Sezione 2 — Osservazione */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Osservazione finale
          </h3>
          {caricando ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="animate-spin">⟳</span>
              <span>Renato sta elaborando l'osservazione…</span>
            </div>
          ) : (
            <p className="text-slate-700 leading-relaxed text-sm">{osservazione}</p>
          )}
        </div>

        {/* Sezione 3 — Domanda */}
        {!caricando && domanda && (
          <div className="bg-brand-50 rounded-2xl border border-brand-200 p-6 space-y-2">
            <h3 className="font-semibold text-brand-700 text-sm uppercase tracking-wide">
              Una domanda per te
            </h3>
            <p className="text-brand-800 leading-relaxed text-base italic">
              "{domanda}"
            </p>
          </div>
        )}

        {/* Bottoni */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRicomincia}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl px-6 py-3.5 transition-all active:scale-95 text-base"
            type="button"
          >
            Ricomincia con Luca
          </button>
          <a
            href="/mcr"
            className="flex-shrink-0 text-center text-sm text-slate-500 hover:text-slate-700 border border-slate-300 hover:border-slate-400 rounded-xl px-5 py-3.5 transition-all"
          >
            Scopri il Metodo MCR →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── PAGINA PRINCIPALE ─────────────────────────────────────────────────────
export default function HomePage() {
  const [sim, setSim] = useState<StatoSimulazione>(STATO_INIZIALE);
  const [mostraIntro, setMostraIntro] = useState(true);
  const [mostraDebrief, setMostraDebrief] = useState(false);

  const turniCompletati = sim.messaggi.filter((m) => m.ruolo === "venditore").length;
  const ultimaApertura = sim.statoCorrente?.apertura ?? 0;
  const conversazioneTerminata =
    turniCompletati >= MAX_TURNI ||
    (turniCompletati >= MIN_TURNI && ultimaApertura >= SOGLIA_SUCCESSO);

  const aperturaPerTurno = sim.messaggi
    .filter((m) => m.ruolo === "cliente")
    .map((m) => m.stato?.apertura ?? 4);

  const inviaMessaggio = useCallback(
    async (testoVenditore: string) => {
      if (sim.loading || conversazioneTerminata) return;

      const nuovoMsgVenditore: Messaggio = {
        ruolo: "venditore",
        testo: testoVenditore,
        timestamp: Date.now(),
      };

      const messaggiAggiornati = [...sim.messaggi, nuovoMsgVenditore];

      setSim((prev) => ({
        ...prev,
        messaggi: messaggiAggiornati,
        loading: true,
        errore: null,
        conversazioneAvviata: true,
      }));

      try {
        const storico = costruisciStorico(messaggiAggiornati);

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messaggi: storico }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ errore: "Errore server" }));
          throw new Error(errData.errore || `HTTP ${res.status}`);
        }

        const risposta: RispostaCliente = await res.json();

        const nuovoMsgCliente: Messaggio = {
          ruolo: "cliente",
          testo: risposta.messaggio_cliente,
          stato: risposta,
          timestamp: Date.now(),
        };

        const messaggiFinali = [...messaggiAggiornati, nuovoMsgCliente];
        const nuoviTurni = messaggiFinali.filter((m) => m.ruolo === "venditore").length;

        setSim((prev) => ({
          ...prev,
          messaggi: messaggiFinali,
          statoCorrente: risposta,
          loading: false,
        }));

        // Chiusura: MAX_TURNI raggiunto OPPURE apertura alta dopo MIN_TURNI
        const aperturaRaggiunta = risposta.apertura >= SOGLIA_SUCCESSO;
        if (nuoviTurni >= MAX_TURNI || (nuoviTurni >= MIN_TURNI && aperturaRaggiunta)) {
          setTimeout(() => setMostraDebrief(true), 1200);
        }
      } catch (err) {
        setSim((prev) => ({
          ...prev,
          loading: false,
          errore: err instanceof Error ? err.message : "Errore di connessione. Riprova.",
        }));
      }
    },
    [sim.messaggi, sim.loading, conversazioneTerminata]
  );

  const nuovaSimulazione = () => {
    setSim(STATO_INIZIALE);
    setMostraDebrief(false);
  };

  const concludiConversazione = () => {
    if (turniCompletati > 0) {
      setMostraDebrief(true);
    }
  };

  const aperturaPrecedente =
    sim.messaggi.length >= 2
      ? sim.messaggi.filter((m) => m.ruolo === "cliente").slice(-2)[0]?.stato?.apertura
      : undefined;
  const aperturaCorrente = sim.statoCorrente?.apertura;
  const deltaCambioApertura =
    aperturaPrecedente !== undefined && aperturaCorrente !== undefined
      ? aperturaCorrente - aperturaPrecedente
      : 0;

  return (
    <>
      {/* Overlay intro */}
      {mostraIntro && <IntroPanel onEntra={() => setMostraIntro(false)} />}

      {/* Schermata debriefing */}
      {mostraDebrief && (
        <DebriefingScreen
          messaggi={sim.messaggi}
          aperturaPerTurno={aperturaPerTurno}
          onRicomincia={nuovaSimulazione}
        />
      )}

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-none text-base">
                Luca non si convince facilmente.
              </h1>
              <p className="text-xs text-slate-600 font-medium leading-tight">
                Ogni parola che scegli ha conseguenze reali.
              </p>
              <p className="text-xs text-slate-400 leading-tight">
                Scavolini · Allenamento relazionale
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {deltaCambioApertura !== 0 && (
              <div
                className={`text-sm font-semibold px-2 py-1 rounded-full transition-all ${
                  deltaCambioApertura > 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {deltaCambioApertura > 0 ? "↑" : "↓"} Apertura{" "}
                {deltaCambioApertura > 0 ? "+" : ""}
                {deltaCambioApertura}
              </div>
            )}

            {turniCompletati > 0 && !conversazioneTerminata && (
              <button
                onClick={concludiConversazione}
                className="text-sm text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-all"
                type="button"
              >
                Concludi
              </button>
            )}

            <button
              onClick={nuovaSimulazione}
              className="text-sm text-slate-500 hover:text-slate-800 border border-slate-300 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-all"
              type="button"
            >
              ↺ Nuova simulazione
            </button>
          </div>
        </header>

        {/* Indicatore turni */}
        {turniCompletati > 0 && (
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center justify-center gap-1">
            {Array.from({ length: MAX_TURNI }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < turniCompletati
                    ? "w-6 bg-brand-500"
                    : "w-3 bg-slate-300"
                }`}
              />
            ))}
            <span className="ml-2 text-xs text-slate-400">
              {turniCompletati}/{MAX_TURNI}
            </span>
          </div>
        )}

        {/* Body principale */}
        <div className="flex-1 flex overflow-hidden max-h-[calc(100vh-57px)]">
          {/* Sidebar sinistra — Cliente */}
          <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 overflow-y-auto flex flex-col gap-6">
            <ClientePanel stato={sim.statoCorrente} loading={sim.loading} />
          </aside>

          {/* Area centrale — Chat */}
          <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <ChatArea messaggi={sim.messaggi} loading={sim.loading} />
            </div>

            {/* Errore */}
            {sim.errore && (
              <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>{sim.errore}</span>
                <button
                  onClick={() => setSim((p) => ({ ...p, errore: null }))}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Input */}
            {!conversazioneTerminata ? (
              <div className="bg-white border-t border-slate-200 p-4">
                <MessageInput
                  onInvia={inviaMessaggio}
                  loading={sim.loading}
                  disabled={false}
                  turnCount={turniCompletati}
                />
              </div>
            ) : (
              <div className="bg-white border-t border-slate-200 p-4 text-center">
                <p className="text-sm text-slate-500 mb-2">
                  Conversazione completata — {MAX_TURNI} scambi con Luca.
                </p>
                <button
                  onClick={() => setMostraDebrief(true)}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-all"
                  type="button"
                >
                  Vedi il debriefing →
                </button>
              </div>
            )}
          </main>

          {/* Sidebar destra — Feedback */}
          <aside className="w-72 flex-shrink-0 bg-white border-l border-slate-200 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                  Feedback in tempo reale
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aggiornato ad ogni risposta di Luca
                </p>
              </div>
              <FeedbackPanel stato={sim.statoCorrente} loading={sim.loading} />

              {/* Storico apertura mini */}
              {sim.messaggi.filter((m) => m.ruolo === "cliente").length > 1 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Andamento apertura
                  </p>
                  <div className="flex items-end gap-1 h-12">
                    {sim.messaggi
                      .filter((m) => m.ruolo === "cliente")
                      .map((m, i) => {
                        const val = m.stato?.apertura ?? 4;
                        const h = (val / 10) * 100;
                        let col = "bg-amber-400";
                        if (val >= 8) col = "bg-emerald-500";
                        else if (val >= 6) col = "bg-teal-400";
                        else if (val <= 3) col = "bg-red-400";
                        return (
                          <div
                            key={i}
                            title={`Scambio ${i + 1}: ${val}/10`}
                            className={`flex-1 rounded-t ${col} transition-all duration-300`}
                            style={{ height: `${h}%` }}
                          />
                        );
                      })}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Inizio</span>
                    <span>Ora</span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Footer promo */}
        <footer className="bg-white border-t border-slate-100 px-4 py-2 text-center">
          <p className="text-xs text-slate-400">
            Questo simulatore è costruito con il{" "}
            <a
              href="/mcr"
              className="hover:text-slate-600 underline underline-offset-2 transition-colors"
            >
              Metodo delle Competenze Risonanti
            </a>{" "}
            ·{" "}
            <a
              href="/mcr"
              className="hover:text-slate-600 underline underline-offset-2 transition-colors"
            >
              Noi²
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
