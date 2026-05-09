"use client";

import { useState, useCallback } from "react";
import type { Messaggio, RispostaCliente, MessaggioAPI, StatoSimulazione } from "@/lib/types";
import type { Personaggio } from "@/lib/personaggi";
import type { Fase } from "@/lib/fasi";
import type { Difficolta } from "@/lib/prompt-builder";
import { DIFFICOLTA_CONFIG } from "@/lib/prompt-builder";
import { getProssimFase, getFasiDa } from "@/lib/fasi";
import PERSONAGGI from "@/lib/personaggi";
import FASI from "@/lib/fasi";
import ClientePanel from "@/components/ClientePanel";
import ChatArea from "@/components/ChatArea";
import FeedbackPanel from "@/components/FeedbackPanel";
import MessageInput from "@/components/MessageInput";
import WizardSelezione from "@/components/WizardSelezione";

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
            apertura: msg.stato?.apertura ?? 5,
            valutazione: msg.stato?.valutazione ?? {
              ascolto: 3, esplorazione: 3, empatia: 3, gestione_obiezione: 3,
            },
            feedback_breve: msg.stato?.feedback_breve ?? "",
          })
        : msg.testo,
  }));
}

// Calcola media delle valutazioni della sessione
function calcolaMediaValutazioni(messaggi: Messaggio[]) {
  const msgs = messaggi.filter((m) => m.ruolo === "cliente" && m.stato?.valutazione);
  if (msgs.length === 0) return null;
  const sum = msgs.reduce(
    (acc, m) => ({
      ascolto: acc.ascolto + (m.stato?.valutazione?.ascolto ?? 3),
      esplorazione: acc.esplorazione + (m.stato?.valutazione?.esplorazione ?? 3),
      empatia: acc.empatia + (m.stato?.valutazione?.empatia ?? 3),
      gestione_obiezione: acc.gestione_obiezione + (m.stato?.valutazione?.gestione_obiezione ?? 3),
    }),
    { ascolto: 0, esplorazione: 0, empatia: 0, gestione_obiezione: 0 }
  );
  return {
    ascolto: Math.round((sum.ascolto / msgs.length) * 10) / 10,
    esplorazione: Math.round((sum.esplorazione / msgs.length) * 10) / 10,
    empatia: Math.round((sum.empatia / msgs.length) * 10) / 10,
    gestione_obiezione: Math.round((sum.gestione_obiezione / msgs.length) * 10) / 10,
  };
}

// Overlay di fase completata
function OverlaySuccesso({
  fase,
  prossima,
  medie,
  onProssima,
  onRipeti,
  onRicomincia,
}: {
  fase: Fase;
  prossima: Fase | undefined;
  medie: ReturnType<typeof calcolaMediaValutazioni>;
  onProssima: () => void;
  onRipeti: () => void;
  onRicomincia: () => void;
}) {
  const NOMI_METRICA: Record<string, string> = {
    ascolto: "Ascolto",
    esplorazione: "Esplorazione",
    empatia: "Empatia",
    gestione_obiezione: "Gestione obiezione",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">
          Fase superata!
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Hai completato la fase di <strong>{fase.nome}</strong>
        </p>

        {/* Punteggi medi */}
        {medie && (
          <div className="bg-slate-50 rounded-xl p-4 mb-5 text-left">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              I tuoi punteggi medi
            </p>
            <div className="space-y-2">
              {Object.entries(medie).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {NOMI_METRICA[key]}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i <= Math.round(val)
                              ? "bg-brand-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {val}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Azioni */}
        <div className="flex flex-col gap-2">
          {prossima && (
            <button
              onClick={onProssima}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 transition-all"
              type="button"
            >
              Passa a: {prossima.emoji} {prossima.nome} →
            </button>
          )}
          {!prossima && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-1">
              <p className="text-sm font-semibold text-emerald-700">
                🏆 Hai completato l&apos;intera trattativa!
              </p>
            </div>
          )}
          <button
            onClick={onRipeti}
            className="w-full border border-slate-300 text-slate-600 hover:border-slate-400 font-medium rounded-xl py-2.5 transition-all text-sm"
            type="button"
          >
            ↺ Ripeti questa fase
          </button>
          <button
            onClick={onRicomincia}
            className="w-full text-slate-400 hover:text-slate-600 font-medium py-2 transition-all text-sm"
            type="button"
          >
            Scegli un nuovo scenario
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  // Stato wizard
  const [personaggio, setPersonaggio] = useState<Personaggio | null>(null);
  const [faseCorrente, setFaseCorrente] = useState<Fase | null>(null);
  const [difficolta, setDifficolta] = useState<Difficolta | null>(null);

  // Stato chat
  const [sim, setSim] = useState<StatoSimulazione>(STATO_INIZIALE);

  // Rilevamento successo fase
  const [scambiPositivi, setScambiPositivi] = useState(0);
  const [faseCompletata, setFaseCompletata] = useState(false);

  // ── Avvio scenario dal wizard ──────────────────────────────────────────────────────
  const avviaScenario = useCallback(
    (p: Personaggio, f: Fase, d: Difficolta) => {
      setPersonaggio(p);
      setFaseCorrente(f);
      setDifficolta(d);
      setSim(STATO_INIZIALE);
      setScambiPositivi(0);
      setFaseCompletata(false);
    },
    []
  );

  const tornaAlWizard = useCallback(() => {
    setPersonaggio(null);
    setFaseCorrente(null);
    setDifficolta(null);
    setSim(STATO_INIZIALE);
    setScambiPositivi(0);
    setFaseCompletata(false);
  }, []);

  // ── Invio messaggio ─────────────────────────────────────────────────────────────
  const inviaMessaggio = useCallback(
    async (testoVenditore: string) => {
      if (sim.loading || !personaggio || !faseCorrente || !difficolta) return;

      const nuovoMsg: Messaggio = {
        ruolo: "venditore",
        testo: testoVenditore,
        timestamp: Date.now(),
      };
      const messaggiAggiornati = [...sim.messaggi, nuovoMsg];

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
          body: JSON.stringify({
            messaggi: storico,
            personaggioId: personaggio.id,
            faseId: faseCorrente.id,
            difficolta,
          }),
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

        setSim((prev) => ({
          ...prev,
          messaggi: messaggiFinali,
          statoCorrente: risposta,
          loading: false,
        }));

        // Rilevamento successo fase
        if (risposta.apertura >= faseCorrente.sogliaSuccesso) {
          const nuoviScambi = scambiPositivi + 1;
          setScambiPositivi(nuoviScambi);
          if (nuoviScambi >= faseCorrente.scambiSuccesso) {
            setFaseCompletata(true);
          }
        } else {
          setScambiPositivi(0);
        }
      } catch (err) {
        setSim((prev) => ({
          ...prev,
          loading: false,
          errore: err instanceof Error ? err.message : "Errore di connessione.",
        }));
      }
    },
    [sim.messaggi, sim.loading, personaggio, faseCorrente, difficolta, scambiPositivi]
  );

  // ── Progressione fase ──────────────────────────────────────────────────────────
  const passaFaseSuccessiva = useCallback(() => {
    if (!faseCorrente || !difficolta) return;
    const prossima = getProssimFase(faseCorrente.id);
    if (prossima) {
      setFaseCorrente(prossima);
      setSim(STATO_INIZIALE);
      setScambiPositivi(0);
      setFaseCompletata(false);
    }
  }, [faseCorrente, difficolta]);

  const ripetiFase = useCallback(() => {
    setSim(STATO_INIZIALE);
    setScambiPositivi(0);
    setFaseCompletata(false);
  }, []);

  // ── Wizard ───────────────────────────────────────────────────────────────────
  if (!personaggio || !faseCorrente || !difficolta) {
    return (
      <WizardSelezione
        personaggi={PERSONAGGI}
        fasi={FASI}
        onAvvia={avviaScenario}
      />
    );
  }

  // ── Calcoli UI ────────────────────────────────────────────────────────────────
  const messaggiCliente = sim.messaggi.filter((m) => m.ruolo === "cliente");
  const aperturaPrecedente =
    messaggiCliente.length >= 2
      ? messaggiCliente[messaggiCliente.length - 2]?.stato?.apertura
      : undefined;
  const aperturaCorrente = sim.statoCorrente?.apertura;
  const delta =
    aperturaPrecedente !== undefined && aperturaCorrente !== undefined
      ? aperturaCorrente - aperturaPrecedente
      : 0;

  const prossima = getProssimFase(faseCorrente.id);
  const medie = calcolaMediaValutazioni(sim.messaggi);
  const fasiRimanenti = getFasiDa(faseCorrente.id);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Overlay successo */}
      {faseCompletata && (
        <OverlaySuccesso
          fase={faseCorrente}
          prossima={prossima}
          medie={medie}
          onProssima={passaFaseSuccessiva}
          onRipeti={ripetiFase}
          onRicomincia={tornaAlWizard}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={tornaAlWizard}
            className="text-slate-400 hover:text-slate-700 transition-colors text-lg"
            title="Torna alla selezione"
            type="button"
          >
            ←
          </button>
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-800 leading-none">
                {faseCorrente.emoji} {faseCorrente.nome}
              </h1>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  difficolta === "facile"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : difficolta === "medio"
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-red-700 bg-red-50 border-red-200"
                }`}
              >
                {DIFFICOLTA_CONFIG[difficolta].label}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {personaggio.nome} · {personaggio.profilo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Barra progresso fasi */}
          <div className="hidden sm:flex items-center gap-1">
            {FASI.map((f) => (
              <div
                key={f.id}
                title={f.nome}
                className={`h-1.5 w-8 rounded-full transition-all ${
                  f.numero < faseCorrente.numero
                    ? "bg-brand-500"
                    : f.id === faseCorrente.id
                    ? "bg-brand-300"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {delta !== 0 && (
            <div
              className={`text-sm font-semibold px-2 py-1 rounded-full ${
                delta > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {delta > 0 ? "↑" : "↓"} {delta > 0 ? "+" : ""}{delta}
            </div>
          )}

          <button
            onClick={ripetiFase}
            className="text-sm text-slate-500 hover:text-slate-800 border border-slate-300 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-all"
            type="button"
          >
            ↺ Ricomincia
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden max-h-[calc(100vh-57px)]">
        {/* Sidebar sinistra */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 overflow-y-auto">
          <ClientePanel
            stato={sim.statoCorrente}
            loading={sim.loading}
            scenario={{
              nomeCliente: personaggio.nome,
              eta: parseInt(personaggio.eta),
              profilo: personaggio.profilo,
              emoji: personaggio.emoji,
            }}
          />
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <ChatArea
              messaggi={sim.messaggi}
              loading={sim.loading}
              nomeCliente={personaggio.nome}
              messaggioIniziale={personaggio.messaggiIniziali[faseCorrente.id]}
              emojiCliente={personaggio.emoji}
            />
          </div>

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

          <div className="bg-white border-t border-slate-200 p-4">
            <MessageInput
              onInvia={inviaMessaggio}
              loading={sim.loading}
              disabled={faseCompletata}
              nomeCliente={personaggio.nome}
            />
          </div>
        </main>

        {/* Sidebar destra */}
        <aside className="w-72 flex-shrink-0 bg-white border-l border-slate-200 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                Feedback in tempo reale
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggiornato ad ogni risposta di {personaggio.nome}
              </p>
            </div>

            {/* Obiettivo fase corrente */}
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-brand-700 mb-1">
                Obiettivo di questa fase
              </p>
              <p className="text-xs text-brand-600 leading-relaxed">
                {faseCorrente.cosaSiAllena}
              </p>
            </div>

            <FeedbackPanel
              stato={sim.statoCorrente}
              loading={sim.loading}
              nomeCliente={personaggio.nome}
            />

            {/* Andamento apertura */}
            {messaggiCliente.length > 1 && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Andamento apertura
                </p>
                <div className="flex items-end gap-1 h-12">
                  {messaggiCliente.map((m, i) => {
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

            {/* Indicatore scambi positivi */}
            {scambiPositivi > 0 && !faseCompletata && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-emerald-700">
                  🌱 Stai andando bene!
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {scambiPositivi}/{faseCorrente.scambiSuccesso} scambi positivi consecutivi
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
