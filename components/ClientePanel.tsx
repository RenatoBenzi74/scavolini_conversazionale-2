"use client";

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

function AperturaBar({ valore }: { valore: number }) {
  const pct = (valore / 10) * 100;

  let barColore = "bg-slate-400";
  if (valore >= 8) barColore = "bg-emerald-500";
  else if (valore >= 6) barColore = "bg-teal-500";
  else if (valore >= 4) barColore = "bg-amber-400";
  else if (valore >= 2) barColore = "bg-orange-500";
  else barColore = "bg-red-500";

  let etichetta = "Molto chiuso";
  if (valore >= 9) etichetta = "Molto aperto";
  else if (valore >= 7) etichetta = "Aperto";
  else if (valore >= 5) etichetta = "Parzialmente aperto";
  else if (valore >= 3) etichetta = "Chiuso";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Apertura relazionale
        </span>
        <span className="text-sm font-bold text-slate-700">
          {valore}/10
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ease-out ${barColore}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1 text-right">{etichetta}</p>
    </div>
  );
}

export default function ClientePanel({ stato, loading }: ClientePanelProps) {
  const statoEmotivo = stato?.stato_emotivo ?? "neutro";
  const apertura = stato?.apertura ?? 5;
  const cfg = STATO_CONFIG[statoEmotivo];

  return (
    <div className="flex flex-col gap-4">
      {/* Header cliente */}
      <div className="flex items-center gap-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 transition-all duration-500 ${cfg.bg}`}
        >
          {loading ? (
            <span className="animate-pulse">⏳</span>
          ) : (
            <span>{cfg.emoji}</span>
          )}
        </div>
        <div>
          <p className="font-bold text-slate-800 text-lg">Luca</p>
          <p className="text-sm text-slate-500">42 anni · Cliente Scavolini</p>
          <p className={`text-sm font-semibold ${cfg.colore}`}>{cfg.label}</p>
        </div>
      </div>

      {/* Stato emotivo badge */}
      <div
        className={`rounded-lg border p-3 transition-all duration-500 ${cfg.bg}`}
      >
        <p className={`text-sm font-medium ${cfg.colore}`}>{cfg.descrizione}</p>
      </div>

      {/* Barra apertura */}
      <AperturaBar valore={apertura} />

      {/* Legenda stati */}
      {!stato && (
        <div className="mt-2 text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-500 mb-2">Come funziona:</p>
          <p>↗ Ascolta → il cliente si apre</p>
          <p>↗ Esplora → il cliente condivide</p>
          <p>↘ Difendi → il cliente si chiude</p>
          <p>↘ Spingi → il cliente si irrigidisce</p>
        </div>
      )}
    </div>
  );
}
