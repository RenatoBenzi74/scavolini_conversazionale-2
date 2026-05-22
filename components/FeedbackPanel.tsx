"use client";

import { useEffect, useRef, useState } from "react";
import type { RispostaCliente } from "@/lib/types";

interface FeedbackPanelProps {
  stato: RispostaCliente | null;
  loading: boolean;
}

interface MetricaProps {
  label: string;
  valore: number;
  max?: number;
  icon: string;
  delay?: number; // ms di delay per l'animazione cascata
}

function Metrica({ label, valore, max = 5, icon, delay = 0 }: MetricaProps) {
  const pct = (valore / max) * 100;
  const [displayPct, setDisplayPct] = useState(0);
  const [animating, setAnimating] = useState(false);
  const prevValore = useRef<number | null>(null);

  useEffect(() => {
    if (prevValore.current === valore) return;
    prevValore.current = valore;
    setDisplayPct(0);
    setAnimating(false);
    const t = setTimeout(() => {
      setAnimating(true);
      setDisplayPct(pct);
    }, delay);
    return () => clearTimeout(t);
  }, [valore, pct, delay]);

  let colore = "bg-slate-300";
  if (pct >= 80) colore = "bg-emerald-500";
  else if (pct >= 60) colore = "bg-teal-400";
  else if (pct >= 40) colore = "bg-amber-400";
  else colore = "bg-red-400";

  // Numero che "sale" 
  const [displayNum, setDisplayNum] = useState(valore);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const prevNumRef = useRef(valore);

  useEffect(() => {
    if (prevNumRef.current === valore) return;
    const from = prevNumRef.current;
    const to = valore;
    prevNumRef.current = valore;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const duration = 400;

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayNum(Math.round(from + (to - from) * progress));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else startTimeRef.current = null;
    };

    setTimeout(() => { rafRef.current = requestAnimationFrame(tick); }, delay);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [valore, delay]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-base w-5">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-slate-600">{label}</span>
          <span className={`text-xs font-bold tabular-nums transition-colors duration-300 ${
            valore >= 4 ? "text-emerald-600" : valore <= 1 ? "text-red-500" : "text-slate-700"
          }`}>
            {displayNum}/{max}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full ${colore} ${animating ? "transition-all duration-500 ease-out" : ""}`}
            style={{ width: `${displayPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function FeedbackPanel({ stato, loading }: FeedbackPanelProps) {
  const [visible, setVisible] = useState(false);
  const prevFeedback = useRef("");

  useEffect(() => {
    if (stato?.feedback_breve && stato.feedback_breve !== prevFeedback.current) {
      setVisible(false);
      prevFeedback.current = stato.feedback_breve;
      setTimeout(() => setVisible(true), 100);
    }
  }, [stato?.feedback_breve]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <span className="animate-spin">⟳</span>
        <span>Luca sta pensando…</span>
      </div>
    );
  }

  if (!stato) {
    return (
      <p className="text-sm text-slate-400 italic">
        Inizia la conversazione per vedere il feedback in tempo reale.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Feedback testuale — fade in */}
      <div
        className={`bg-slate-50 border border-slate-200 rounded-lg p-3 transition-all duration-500 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Osservazione
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {stato.feedback_breve}
        </p>
      </div>

      {/* Metriche con animazione cascata */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Valutazione ultimo scambio
        </p>
        <Metrica label="Ascolto attivo"     valore={stato.valutazione.ascolto}            icon="👂" delay={0}   />
        <Metrica label="Esplorazione"        valore={stato.valutazione.esplorazione}        icon="🔍" delay={100} />
        <Metrica label="Empatia"             valore={stato.valutazione.empatia}             icon="🤝" delay={200} />
        <Metrica label="Gestione obiezione"  valore={stato.valutazione.gestione_obiezione}  icon="🎯" delay={300} />
      </div>
    </div>
  );
}
