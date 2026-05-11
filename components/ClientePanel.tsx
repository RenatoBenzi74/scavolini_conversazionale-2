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
  neutro:     { label: "Neutro",     colore: "text-slate-600",  bg: "bg-slate-100 border-slate-300",   emoji: "😐", descrizione: "Ascolta, ma non si sbilancia" },
  interessato:{ label: "Interessato",colore: "text-emerald-700",bg: "bg-emerald-50 border-emerald-300", emoji: "🙂", descrizione: "Si sta aprendo alla conversazione" },
  dubbioso:   { label: "Dubbioso",   colore: "text-amber-700",  bg: "bg-amber-50 border-amber-300",    emoji: "🤔", descrizione: "Ha perplessità, sta valutando" },
  irritato:   { label: "Irritato",   colore: "text-red-700",    bg: "bg-red-50 border-red-300",        emoji: "😑", descrizione: "Si sta chiudendo, attenzione" },
  convinto:   { label: "Convinto",   colore: "text-blue-700",   bg: "bg-blue-50 border-blue-300",      emoji: "😊", descrizione: "Si fida, è pronto ad approfondire" },
};

function getEtichettaApertura(v: number): string {
  if (v <= 2) return "Le porte sono chiuse.";
  if (v <= 4) return "Ti osserva. Non si fida ancora.";
  if (v <= 6) return "Qualcosa si muove. Continua così.";
  if (v <= 8) return "Sta abbassando la guardia.";
  return "È con te. Non sprecare questo momento.";
}

function AperturaBar({ valore, delta }: { valore: number; delta: number }) {
  const pct = (valore / 10) * 100;
  const [flashClass, setFlashClass] = useState("");
  const [shimmer, setShimmer] = useState(false);
  const prevVal = useRef(valore);

  useEffect(() => {
    if (delta === 0) return;
    const fc = delta > 0 ? "animate-flash-green" : "animate-flash-red";
    setFlashClass(fc);
    setShimmer(true);
    const t1 = setTimeout(() => setFlashClass(""), 1100);
    const t2 = setTimeout(() => setShimmer(false), 1200);
    prevVal.current = valore;
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [valore, delta]);

  let barColore = "bg-slate-400";
  if (valore >= 9) barColore = "bg-emerald-500";
  else if (valore >= 7) barColore = "bg-teal-500";
  else if (valore >= 5) barColore = "bg-amber-400";
  else if (valore >= 3) barColore = "bg-orange-500";
  else barColore = "bg-red-500";

  return (
    <div className={`w-full p-2 -mx-2 rounded-xl transition-all duration-300 ${flashClass}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Apertura relazionale
        </span>
        <span className={`text-sm font-bold tabular-nums transition-all duration-300 ${
          delta > 0 ? "text-emerald-600 scale-110" : delta < 0 ? "text-red-500 scale-110" : "text-slate-700"
        }`}>
          {valore}/10
          {delta !== 0 && (
            <span className="ml-1 text-xs font-semibold">
              {delta > 0 ? `▲+${delta}` : `▼${delta}`}
            </span>
          )}
        </span>
      </div>
      <div className="relative w-full bg-slate-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-700 ease-out ${barColore}`}
          style={{ width: `${pct}%` }}
        />
        {/* shimmer overlay */}
        {shimmer && (
          <div
            className="absolute inset-0 rounded-full bar-shimmer pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.2s ease-in-out",
            }}
          />
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1.5">{getEtichettaApertura(valore)}</p>
    </div>
  );
}

export default function ClientePanel({ stato, loading }: ClientePanelProps) {
  const statoEmotivo = stato?.stato_emotivo ?? "neutro";
  const apertura = stato?.apertura ?? 4;
  const cfg = STATO_CONFIG[statoEmotivo];

  const prevAperturaRef = useRef<number>(4);
  const prevStatoRef = useRef<StatoEmotivo>("neutro");
  const [delta, setDelta] = useState(0);
  const [emojiClass, setEmojiClass] = useState("");

  useEffect(() => {
    if (stato?.apertura !== undefined) {
      const d = stato.apertura - prevAperturaRef.current;
      setDelta(d);
      prevAperturaRef.current = stato.apertura;
    }
  }, [stato?.apertura]);

  useEffect(() => {
    if (stato?.stato_emotivo && stato.stato_emotivo !== prevStatoRef.current) {
      const wasGood = ["interessato","convinto"].includes(prevStatoRef.current);
      const isGood  = ["interessato","convinto"].includes(stato.stato_emotivo);
      const isBad   = ["irritato"].includes(stato.stato_emotivo);
      const cls = isBad ? "animate-emoji-shake" : (!wasGood && isGood) ? "animate-emoji-bounce" : "animate-emoji-bounce";
      setEmojiClass(cls);
      prevStatoRef.current = stato.stato_emotivo;
      const t = setTimeout(() => setEmojiClass(""), 700);
      return () => clearTimeout(t);
    }
  }, [stato?.stato_emotivo]);

  return (
    <div className="flex flex-col gap-4">
      {/* Avatar + nome */}
      <div className="flex items-center gap-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 transition-all duration-500 ${cfg.bg} ${
            delta > 0 ? "ring-2 ring-emerald-400 ring-offset-1" :
            delta < 0 ? "ring-2 ring-red-400 ring-offset-1" : ""
          }`}
        >
          {loading ? (
            <span className="animate-pulse text-2xl">⏳</span>
          ) : (
            <span className={`inline-block ${emojiClass}`}>{cfg.emoji}</span>
          )}
        </div>
        <div>
          <p className="font-bold text-slate-800 text-lg">Luca</p>
          <p className="text-sm text-slate-500">44 anni · Imprenditore edile</p>
          <p className={`text-sm font-semibold ${cfg.colore}`}>{cfg.label}</p>
        </div>
      </div>

      {/* Citazione */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-600 italic leading-relaxed">
          "Ha le idee chiare su quello che vuole. O almeno così crede."
        </p>
      </div>

      {/* Stato emotivo */}
      <div className={`rounded-lg border p-3 transition-all duration-500 ${cfg.bg}`}>
        <p className={`text-sm font-medium ${cfg.colore}`}>{cfg.descrizione}</p>
      </div>

      {/* Barra apertura */}
      <AperturaBar valore={apertura} delta={delta} />

      <p className="text-xs text-slate-400 leading-relaxed">
        L'apertura di Luca cambia in base a come parli con lui.
      </p>
    </div>
  );
}
