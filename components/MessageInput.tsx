"use client";

import { useState, useRef, KeyboardEvent } from "react";

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
              : `Rispondi a ${nomeCliente}… (Invio per inviare, Shift+Invio per andare a capo)`
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

