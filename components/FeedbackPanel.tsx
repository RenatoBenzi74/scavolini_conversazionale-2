"use client";

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
}

function Metrica({ label, valore, max = 5, icon }: MetricaProps) {
  const pct = (valore / max) * 100;

  let colore = "bg-slate-300";
  if (pct >= 80) colore = "bg-emerald-500";
  else if (pct >= 60) colore = "bg-teal-400";
  else if (pct >= 40) colore = "bg-amber-400";
  else colore = "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <span className="text-base w-5">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-slate-600">{label}</span>
          <span className="text-xs font-bold text-slate-700">
            {valore}/{max}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${colore}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function FeedbackPanel({ stato, loading }: FeedbackPanelProps) {
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
      {/* Feedback testuale */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Osservazione
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {stato.feedback_breve}
        </p>
      </div>

      {/* Metriche valutazione */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Valutazione ultimo scambio
        </p>
        <Metrica
          label="Ascolto attivo"
          valore={stato.valutazione.ascolto}
          icon="👂"
        />
        <Metrica
          label="Esplorazione"
          valore={stato.valutazione.esplorazione}
          icon="🔍"
        />
        <Metrica
          label="Empatia"
          valore={stato.valutazione.empatia}
          icon="🤝"
        />
        <Metrica
          label="Gestione obiezione"
          valore={stato.valutazione.gestione_obiezione}
          icon="🎯"
        />
      </div>
    </div>
  );
}
