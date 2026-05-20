"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface MessageInputProps {
  onInvia: (testo: string) => void;
  loading: boolean;
  disabled: boolean;
  turnCount: number; // numero di turni completati — trigger per il delay
}

// Suggerimenti dinamici per fase
const SUGGERIMENTI_ACCOGLIENZA = [
  "Buongiorno! Si accomodi pure — è qui per la prima volta?",
  "Buongiorno. Stavo proprio rimettendo in ordine — cosa la porta da noi oggi?",
  "Buongiorno. Ha già un'idea di quello che cerca, o è ancora nella fase di esplorazione?",
  "Buongiorno. Prenda il suo tempo — se ha domande sono qui.",
];

const SUGGERIMENTI_CONVERSAZIONE = [
  "Cosa è più importante per lei in questa cucina?",
  "Che tipo di utilizzo immagina per questo spazio?",
  "Ha visto qualcosa in particolare che l'ha colpita negli altri showroom?",
  "Cosa intende esattamente quando dice che vuole qualcosa che duri?",
];

export default function MessageInput({
  onInvia,
  loading,
  disabled,
  turnCount,
}: MessageInputProps) {
  const [testo, setTesto] = useState("");
  const [mostraSuggerimenti, setMostraSuggerimenti] = useState(false);
  const [suggerimentiVisibili, setSuggerimentiVisibili] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Delay 500ms prima che il toggle suggerimenti appaia dopo ogni turno
  useEffect(() => {
    setSuggerimentiVisibili(false);
    if (turnCount === 0) {
      setSuggerimentiVisibili(true);
      return;
    }
    const timer = setTimeout(() => setSuggerimentiVisibili(true), 500);
    return () => clearTimeout(timer);
  }, [turnCount]);

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
      {/* Toggle suggerimenti — discreto, con delay */}
      <div className={`transition-opacity duration-300 ${suggerimentiVisibili ? "opacity-100" : "opacity-0"}`}>
        <button
          onClick={() => setMostraSuggerimenti(!mostraSuggerimenti)}
          className="text-xs text-slate-400 hover:text-slate-500 transition-colors"
          type="button"
        >
          {mostraSuggerimenti ? "▲ chiudi" : "Hai bisogno di un suggerimento?"}
        </button>
      </div>

      {mostraSuggerimenti && suggerimentiVisibili && (
        <div className="grid grid-cols-1 gap-1">
          {(turnCount === 0 ? SUGGERIMENTI_ACCOGLIENZA : SUGGERIMENTI_CONVERSAZIONE).map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggerimento(s)}
              className="text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 transition-colors"
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
              ? "Premi 'Ricomincia' per una nuova simulazione"
              : turnCount === 0
              ? "Come accogli Luca? Scrivi il tuo saluto…"
              : "Rispondi a Luca… (Invio per inviare, Shift+Invio per andare a capo)"
          }
          disabled={loading || disabled}
          rows={2}
          className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800
                     placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
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
      <p className="text-xs text-slate-400 text-center">
        Le tue parole hanno conseguenze — Luca reagisce davvero
      </p>
    </div>
  );
}
