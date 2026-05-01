"use client";

import type { Scenario, Difficolta, Fase } from "@/lib/scenari";

interface ScenarioSelectorProps {
  scenari: Scenario[];
  onSeleziona: (scenario: Scenario) => void;
}

const DIFFICOLTA_CONFIG: Record<
  Difficolta,
  { label: string; colore: string; bg: string; punti: number }
> = {
  facile: {
    label: "Facile",
    colore: "text-emerald-700",
    bg: "bg-emerald-100",
    punti: 1,
  },
  medio: {
    label: "Medio",
    colore: "text-amber-700",
    bg: "bg-amber-100",
    punti: 2,
  },
  difficile: {
    label: "Difficile",
    colore: "text-red-700",
    bg: "bg-red-100",
    punti: 3,
  },
};

const FASE_CONFIG: Record<Fase, { colore: string; bg: string }> = {
  Accoglienza: { colore: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  "Analisi bisogni": {
    colore: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
  },
  "Gestione obiezione": {
    colore: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  Chiusura: {
    colore: "text-rose-700",
    bg: "bg-rose-50 border-rose-200",
  },
};

function DotDifficolta({ difficolta }: { difficolta: Difficolta }) {
  const { punti } = DIFFICOLTA_CONFIG[difficolta];
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= punti
              ? difficolta === "facile"
                ? "bg-emerald-500"
                : difficolta === "medio"
                ? "bg-amber-500"
                : "bg-red-500"
              : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function ScenarioCard({
  scenario,
  onSeleziona,
}: {
  scenario: Scenario;
  onSeleziona: (s: Scenario) => void;
}) {
  const diff = DIFFICOLTA_CONFIG[scenario.difficolta];
  const fase = FASE_CONFIG[scenario.fase];

  return (
    <button
      onClick={() => onSeleziona(scenario)}
      className="group text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-brand-400 transition-all duration-200 active:scale-[0.98] flex flex-col gap-3"
      type="button"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{scenario.emoji}</span>
          <div>
            <p className="font-bold text-slate-800 text-base leading-tight">
              {scenario.nomeCliente}
            </p>
            <p className="text-xs text-slate-500">
              {scenario.eta} anni · {scenario.profilo}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className={`flex items-center gap-1 ${diff.colore}`}>
            <DotDifficolta difficolta={scenario.difficolta} />
            <span className="text-xs font-medium">{diff.label}</span>
          </div>
        </div>
      </div>

      {/* Fase badge */}
      <div
        className={`inline-flex self-start border rounded-full px-2.5 py-0.5 text-xs font-medium ${fase.colore} ${fase.bg}`}
      >
        {scenario.fase}
      </div>

      {/* Titolo + descrizione */}
      <div>
        <p className="font-semibold text-slate-800 text-sm mb-1">
          {scenario.titolo}
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          {scenario.descrizione}
        </p>
      </div>

      {/* Messaggio iniziale preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <p className="text-xs text-slate-400 font-medium mb-0.5">
          Prima frase del cliente
        </p>
        <p className="text-xs text-slate-600 italic">
          &quot;{scenario.messaggioIniziale}&quot;
        </p>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-end">
        <span className="text-xs font-semibold text-brand-500 group-hover:text-brand-700 transition-colors">
          Inizia simulazione →
        </span>
      </div>
    </button>
  );
}

const ORDINE_FASI: Fase[] = [
  "Accoglienza",
  "Analisi bisogni",
  "Gestione obiezione",
  "Chiusura",
];

export default function ScenarioSelector({
  scenari,
  onSeleziona,
}: ScenarioSelectorProps) {
  // Raggruppa per fase
  const perFase = ORDINE_FASI.map((fase) => ({
    fase,
    scenari: scenari.filter((s) => s.fase === fase),
  })).filter((gruppo) => gruppo.scenari.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🍳</span>
            <h1 className="text-xl font-bold text-slate-800">
              Simulatore Scavolini
            </h1>
          </div>
          <p className="text-sm text-slate-500 ml-10">
            Scegli uno scenario per allenarti. Il cliente reagirà davvero alle
            tue parole.
          </p>
        </div>
      </div>

      {/* Contenuto */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {perFase.map(({ fase, scenari: scenariFase }) => (
          <div key={fase} className="mb-10">
            {/* Intestazione fase */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`h-px flex-1 ${FASE_CONFIG[fase].bg.split(" ")[0].replace("bg-", "bg-")} opacity-50`}
                style={{ background: "currentColor", opacity: 0.3 }}
              />
              <span
                className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${FASE_CONFIG[fase].colore} ${FASE_CONFIG[fase].bg}`}
              >
                {fase}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenariFase.map((s) => (
                <ScenarioCard key={s.id} scenario={s} onSeleziona={onSeleziona} />
              ))}
            </div>
          </div>
        ))}

        {/* Nota pedagogica */}
        <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400">
            💡 Inizia dagli scenari{" "}
            <span className="text-emerald-600 font-medium">Facili</span> per
            prendere confidenza, poi passa a{" "}
            <span className="text-red-600 font-medium">Difficile</span> quando
            sei pronto.
          </p>
        </div>
      </div>
    </div>
  );
}

