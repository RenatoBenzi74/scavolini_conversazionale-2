"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";

interface MessageInputProps {
  onInvia: (testo: string) => void;
  loading: boolean;
  disabled: boolean;
  nomeCliente?: string;
}

const SUGGERIMENTI = [
  "Capisco. Cosa è più importante per lei in questa cucina?",
  "Mi racconta un po' la casa? Come ha in mente gli spazi?",
  "Ha ragione, è un investimento importante — per questo voglio capire bene cosa cerca.",
  "La garanzia Scavolini è di 10 anni su tutta la struttura — vuole che le spieghi cosa copre?",
  "Scavolini ha qualità superiore, il prezzo è assolutamente giustificato.",
];

export default function MessageInput({
  onInvia,
  loading,
  disabled,
  nomeCliente = "Cliente",
}: MessageInputProps) {
  const [testo, setTesto] = useState("");
  const [mostraSuggerimenti, setMostraSuggerimenti] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Risposta a voce (Web Speech API, italiano) ---
  const [vocaleSupportato, setVocaleSupportato] = useState(false);
  const [inAscolto, setInAscolto] = useState(false);
  const [erroreVoce, setErroreVoce] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const trascrizioneRef = useRef("");
  const onInviaRef = useRef(onInvia);
  const bloccatoRef = useRef(false);

  useEffect(() => {
    onInviaRef.current = onInvia;
    bloccatoRef.current = loading || disabled;
  }, [onInvia, loading, disabled]);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVocaleSupportato(!!SR);
    return () => recognitionRef.current?.abort?.();
  }, []);

  const avviaAscolto = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || bloccatoRef.current) return;

    setErroreVoce(null);
    setMostraSuggerimenti(false);
    trascrizioneRef.current = "";
    const rec = new SR();
    rec.lang = "it-IT";
    rec.interimResults = true;
    rec.continuous = false; // si ferma da solo dopo una pausa

    rec.onresult = (event: any) => {
      let testoCompleto = "";
      for (let i = 0; i < event.results.length; i++) {
        testoCompleto += event.results[i][0].transcript;
      }
      trascrizioneRef.current = testoCompleto;
      setTesto(testoCompleto); // mostra in tempo reale ciò che il venditore dice
    };

    rec.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setErroreVoce("Microfono non autorizzato: consenti l'accesso dal browser.");
      } else if (event.error === "no-speech") {
        setErroreVoce("Non ho sentito nulla, riprova.");
      } else if (event.error !== "aborted") {
        setErroreVoce("Problema con il microfono, riprova.");
      }
    };

    rec.onend = () => {
      setInAscolto(false);
      recognitionRef.current = null;
      const finale = trascrizioneRef.current.trim();
      trascrizioneRef.current = "";
      // La risposta a voce viene inviata subito al cliente
      if (finale && !bloccatoRef.current) {
        onInviaRef.current(finale);
        setTesto("");
      }
    };

    recognitionRef.current = rec;
    setInAscolto(true);
    try {
      rec.start();
    } catch {
      setInAscolto(false);
    }
  }, []);

  const toggleMicrofono = () => {
    if (inAscolto) recognitionRef.current?.stop?.();
    else avviaAscolto();
  };

  const handleInvia = () => {
    const trimmed = testo.trim();
    if (!trimmed || loading || disabled) return;
    onInvia(trimmed);
    setTesto("");
    setMostraSuggerimenti(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInvia();
    }
  };

  const handleSuggerimento = (s: string) => {
    setTesto(s);
    setMostraSuggerimenti(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      {/* Suggerimenti */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMostraSuggerimenti(!mostraSuggerimenti)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          type="button"
        >
          {mostraSuggerimenti ? "▲ Nascondi suggerimenti" : "▼ Suggerimenti"}
        </button>
      </div>

      {mostraSuggerimenti && (
        <div className="grid grid-cols-1 gap-1">
          {SUGGERIMENTI.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggerimento(s)}
              className="text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 transition-colors"
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Premi 'Nuova simulazione' per ricominciare"
              : inAscolto
              ? `Ti ascolto… parla con ${nomeCliente}`
              : `Rispondi a ${nomeCliente}… (Invio per inviare, Shift+Invio per andare a capo)`
          }
          disabled={loading || disabled || inAscolto}
          rows={2}
          className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800
                     placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        {vocaleSupportato && (
          <button
            onClick={toggleMicrofono}
            disabled={loading || disabled}
            aria-label={inAscolto ? "Ferma e invia" : "Rispondi a voce"}
            title={inAscolto ? "Ferma e invia" : "Rispondi a voce"}
            className={`flex-shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all active:scale-95
                        disabled:opacity-40 disabled:cursor-not-allowed border ${
                          inAscolto
                            ? "bg-red-500 border-red-500 text-white animate-pulse"
                            : "bg-white border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-600"
                        }`}
            type="button"
          >
            {inAscolto ? "■" : "🎤"}
          </button>
        )}
        <button
          onClick={handleInvia}
          disabled={!testo.trim() || loading || disabled}
          className="flex-shrink-0 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed
                     text-white rounded-xl px-4 py-2.5 font-medium text-sm transition-all active:scale-95"
          type="button"
        >
          {loading ? (
            <span className="animate-spin inline-block">⟳</span>
          ) : (
            "Invia"
          )}
        </button>
      </div>
      {erroreVoce && (
        <p className="text-xs text-red-500 text-center">{erroreVoce}</p>
      )}
      {!vocaleSupportato && (
        <p className="text-[11px] text-slate-400 text-center">
          La risposta a voce richiede Chrome, Edge o Safari.
        </p>
      )}
      <p className="text-xs text-slate-400 text-center">
        Le tue parole hanno conseguenze — Luca reagisce davvero
      </p>
    </div>
  );
}

