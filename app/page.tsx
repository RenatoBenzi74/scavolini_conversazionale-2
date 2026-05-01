"use client";

import { useState, useCallback } from "react";
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

const STATO_INIZIALE: StatoSimulazione = {
  messaggi: [],
  statoCorrente: null,
  loading: false,
  errore: null,
  conversazioneAvviata: false,
};

// Costruisce lo storico nel formato Anthropic Messages API
function costruisciStorico(messaggi: Messaggio[]): MessaggioAPI[] {
  return messaggi.map((msg) => ({
    role: msg.ruolo === "venditore" ? "user" : "assistant",
    content:
      msg.ruolo === "cliente"
        ? JSON.stringify({
            messaggio_cliente: msg.testo,
            stato_emotivo: msg.stato?.stato_emotivo ?? "neutro",
            apertura: msg.stato?.apertura ?? 5,
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

export default function HomePage() {
  const [sim, setSim] = useState<StatoSimulazione>(STATO_INIZIALE);

  const inviaMessaggio = useCallback(
    async (testoVenditore: string) => {
      if (sim.loading) return;

      // Aggiungi messaggio venditore
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

        setSim((prev) => ({
          ...prev,
          messaggi: [...messaggiAggiornati, nuovoMsgCliente],
          statoCorrente: risposta,
          loading: false,
        }));
      } catch (err) {
        setSim((prev) => ({
          ...prev,
          loading: false,
          errore:
            err instanceof Error
              ? err.message
              : "Errore di connessione. Riprova.",
        }));
      }
    },
    [sim.messaggi, sim.loading]
  );

  const nuovaSimulazione = () => {
    setSim(STATO_INIZIALE);
  };

  const aperturaPrecedente =
    sim.messaggi.length >= 2
      ? sim.messaggi
          .filter((m) => m.ruolo === "cliente")
          .slice(-2)[0]?.stato?.apertura
      : undefined;

  const aperturaCorrente = sim.statoCorrente?.apertura;
  const deltaCambioApertura =
    aperturaPrecedente !== undefined && aperturaCorrente !== undefined
      ? aperturaCorrente - aperturaPrecedente
      : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-none">
              Simulatore Obiezioni
            </h1>
            <p className="text-xs text-slate-500">Scavolini · Training vendite</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicatore cambio apertura */}
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

          <button
            onClick={nuovaSimulazione}
            className="text-sm text-slate-500 hover:text-slate-800 border border-slate-300 hover:border-slate-400
                       rounded-lg px-3 py-1.5 transition-all"
            type="button"
          >
            ↺ Nuova simulazione
          </button>
        </div>
      </header>

      {/* Body principale */}
      <div className="flex-1 flex overflow-hidden max-h-[calc(100vh-57px)]">
        {/* Sidebar sinistra — Cliente */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 overflow-y-auto flex flex-col gap-6">
          <ClientePanel stato={sim.statoCorrente} loading={sim.loading} />
        </aside>

        {/* Area centrale — Chat */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {/* Messaggi */}
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
          <div className="bg-white border-t border-slate-200 p-4">
            <MessageInput
              onInvia={inviaMessaggio}
              loading={sim.loading}
              disabled={false}
            />
          </div>
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

            {/* Storico apertura */}
            {sim.messaggi.filter((m) => m.ruolo === "cliente").length > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Andamento apertura
                </p>
                <div className="flex items-end gap-1 h-12">
                  {sim.messaggi
                    .filter((m) => m.ruolo === "cliente")
                    .map((m, i) => {
                      const val = m.stato?.apertura ?? 5;
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
    </div>
  );
}
