"use client";

import { useEffect, useRef, useState } from "react";
import type { RispostaCliente, StatoEmotivo } from "@/lib/types";

interface ClientePanelProps {
  stato: RispostaCliente | null;
  loading: boolean;
}

const STATO_CONFIG: Record<
  StatoEmotivo,
  { label: string; colore: string; bg: string; emoji: string; descrizione: string }
> = {
  neutro: {
    label: "Neutro",
    colore: "text-slate-600",
    bg: "bg-slate-100 border-slate-300",
    emoji: "😐",
    descrizione: "Ascolta, ma non si sbilancia",
  },
  interessato: {
    label: "Interessato",
    colore: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-300",
    emoji: "🙂",
    descrizione: "Si sta aprendo alla conversazione",
  },
  dubbioso: {
    label: "Dubbioso",
    colore: "text-amber-700",
    bg: "bg-amber-50 border-amber-300",
    emoji: "🤔",
    descrizione: "Ha perplessità, sta valutando",
  },
  irritato: {
    label: "Irritato",
    colore: "text-red-700",
    bg: "bg-red-50 border-red-300",
    emoji: "😑",
    descrizione: "Si sta chiudendo, attenzione",
  },
  convinto: {
    label: "Convinto",
    colore: "text-blue-700",
    bg: "bg-blue-50 border-blue-300",
    emoji: "😊",
    descrizione: "Si fida, è pronto ad approfondire",
  },
};

function getEtichettaApertura(valore: number): string {
  if (valore <= 2) return "Chiuso. Non ti sta ancora ascoltando.";
  if (valore <= 4) return "Guardingo. Aspetta di capire dove vuoi arrivare.";
  if (valore <= 6) return "Neutro. Qualcosa si sta muovendo.";
  if (valore <= 8) return "Aperto. Sta iniziando a fidarsi.";
  return "In connessione. La conversazione è diventata reale.";
}

function AperturaBar({ valore, delta }: { valore: number; delta: number }) {
  const pct = (valore / 10) * 100;
  const [pulseClass, setPulseClass] = useState("");

  useEffect(() => {
    if (delta === 0) return;
    const cls = delta > 0 ? "animate-pulse-green" : "animate-pulse-red";
    setPulseClass(cls);
    const timer = setTimeout(() => setPulseClass(""), 900);
    return () => clearTimeout(timer);
  }, [valore, delta]);

  let barColore = "bg-slate-400";
  if (valore >= 9) barColore = "bg-emerald-500";
  else if (valore >= 7) barColore = "bg-teal-500";
  else if (valore >= 5) barColore = "bg-amber-400";
  else if (valore >= 3) barColore = "bg-orange-500";
  else barColore = "bg-red-500";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Apertura relazionale
        </span>
        <span className={`text-sm font-bold transition-all duration-300 ${
          delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-slate-700"
        }`}>
          {valore}/10
          {delta !== 0 && (
            <span className="ml-1 text-xs">
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </span>
      </div>
      <div className={`w-full bg-slate-200 rounded-full h-3 overflow-hidden ${pulseClass}`}>
        <div
          className={`h-3 rounded-full transition-all duration-700 ease-out ${barColore}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">{getEtichettaApertura(valore)}</p>
    </div>
  );
}

export default function ClientePanel({ stato, loading }: ClientePanelProps) {
  const statoEmotivo = stato?.stato_emotivo ?? "neutro";
  const apertura = stato?.apertura ?? 4;
  const cfg = STATO_CONFIG[statoEmotivo];

  const prevAperturaRef = useRef<number>(4);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    if (stato?.apertura !== undefined) {
      const d = stato.apertura - prevAperturaRef.current;
      setDelta(d);
      prevAperturaRef.current = stato.apertura;
    }
  }, [stato?.apertura]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header cliente */}
      <div className="flex items-center gap-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 transition-all duration-500 ${cfg.bg} ${
            delta > 0 ? "ring-2 ring-emerald-400 ring-offset-1" :
            delta < 0 ? "ring-2 ring-red-400 ring-offset-1" : ""
          }`}
        >
          {loading ? (
            <span className="animate-pulse">⏳</span>
          ) : (
            <span>{cfg.emoji}</span>
          )}
        </div>
        <div>
          <p className="font-bold text-slate-800 text-lg">Luca</p>
          <p className="text-sm text-slate-500">44 anni · Imprenditore edile</p>
          <p className={`text-sm font-semibold ${cfg.colore}`}>{cfg.label}</p>
        </div>
      </div>

      {/* Descrizione visibile */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-600 italic leading-relaxed">
          "Ha le idee chiare su quello che vuole. O almeno così crede."
        </p>
      </div>

      {/* Stato emotivo badge */}
      <div
        className={`rounded-lg border p-3 transition-all duration-500 ${cfg.bg}`}
      >
        <p className={`text-sm font-medium ${cfg.colore}`}>{cfg.descrizione}</p>
      </div>

      {/* Barra apertura */}
      <AperturaBar valore={apertura} delta={delta} />

      {/* Riga discreta sotto l'indicatore */}
      <p className="text-xs text-slate-400 leading-relaxed">
        L'apertura di Luca cambia in base a come parli con lui.
      </p>
    </div>
  );
}
