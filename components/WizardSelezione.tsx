"use client";

import { useState } from "react";
import type { Personaggio } from "@/lib/personaggi";
import type { Fase } from "@/lib/fasi";
import type { Difficolta } from "@/lib/prompt-builder";
import { DIFFICOLTA_CONFIG } from "@/lib/prompt-builder";

interface WizardSelezioneProps {
  personaggi: Personaggio[];
  fasi: Fase[];
  onAvvia: (p: Personaggio, f: Fase, d: Difficolta) => void;
}

type Step = "fase" | "personaggio" | "difficolta";

const STEP_ORDER: Step[] = ["fase", "personaggio", "difficolta"];

const STEP_LABEL: Record<Step, string> = {
  fase: "Da dove parti?",
  personaggio: "Con chi ti alleni?",
  difficolta: "Quanto vuoi sfidare?",
};

const DIFFICOLTA_COLOR: Record<
  Difficolta,
  { border: string; bg: string; text: string; dot: string }
> = {
  facile: {
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  medio: {
    border: "border-amber-300",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  difficile: {
    border: "border-red-300",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

function StepIndicator({
  currentStep,
}: {
  currentStep: Step;
}) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {STEP_ORDER.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < currentIndex
                ? "bg-brand-500 text-white"
                : i === currentIndex
                ? "bg-brand-500 text-white ring-4 ring-brand-100"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            {i < currentIndex ? "â" : i + 1}
          </div>
          {i < STEP_ORDER.length - 1 && (
            <div
              className={`h-0.5 w-12 transition-all ${
                i < currentIndex ? "bg-brand-500" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function WizardSelezione({
  personaggi,
  fasi,
  onAvvia,
}: WizardSelezioneProps) {
  const [step, setStep] = useState<Step>("fase");
  const [faseSelezionata, setFaseSelezionata] = useState<Fase | null>(null);
  const [personaggioSelezionato, setPersonaggioSelezionato] =
    useState<Personaggio | null>(null);
  const [difficoltaSelezionata, setDifficoltaSelezionata] =
    useState<Difficolta | null>(null);

  const indietro = () => {
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) setStep(STEP_ORDER[i - 1]);
  };

  const avvia = () => {
    if (faseSelezionata && personaggioSelezionato && difficoltaSelezionata) {
      onAvvia(personaggioSelezionato, faseSelezionata, difficoltaSelezionata);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800">Simulatore Scavolini</h1>
            <p className="text-xs text-slate-500">Allenamento vendite</p>
          </div>
        </div>
      </div>

      {/* Contenuto wizard */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <StepIndicator currentStep={step} />

        <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">
          {STEP_LABEL[step]}
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          {step === "fase" && "Scegli da quale momento della trattativa vuoi iniziare"}
          {step === "personaggio" && "Ogni cliente ha una personalitÃ  diversa â scegli con chi allenarti"}
          {step === "difficolta" && "Stesso personaggio, comportamento diverso â scegli l'intensitÃ "}
        </p>

        {/* STEP 1 â Fase */}
        {step === "fase" && (
          <div className="flex flex-col gap-3">
            {fasi.map((fase) => (
              <button
                key={fase.id}
                onClick={() => {
                  setFaseSelezionata(fase);
                  setStep("personaggio");
                }}
                className="group text-left bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-brand-400 transition-all duration-200 active:scale-[0.99] flex items-center gap-4"
                type="button"
              >
                <div className="w-10 h-10 bg-slate-100 group-hover:bg-brand-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-colors">
                  {fase.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Fase {fase.numero}/5
                    </span>
                  </div>
                  <p className="font-bold text-slate-800">{fase.nome}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {fase.cosaSiAllena}
                  </p>
                </div>
                <span className="text-slate-300 group-hover:text-brand-400 text-lg flex-shrink-0 transition-colors">
                   â
                </span>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2 â Personaggio */}
        {step === "personaggio" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {personaggi.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPersonaggioSelezionato(p);
                    setStep("difficolta");
                }}
                className="group text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-brand-400 transition-all duration-200 active:scale-[0.98] flex flex-col gap-3"
                type="button"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.emoji}</span>
                  <div>
                    <p className="font-bold text-slate-800">{p.nome}</p>
                    <p className="text-xs text-slate-500">
                      {p.eta} Â· {p.profilo}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {p.descrizione}
                </p>
                <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                  <p className="text-xs text-slate-400 font-medium">
                    Motivazione principale
                  </p>
                  <p className="text-xs text-slate-600 font-semibold">
                    {p.motivazionePrincipale}
                  </p>
                </div>
                {faseSelezionata && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-500 font-medium mb-0.5">
                      Prima frase
                    </p>
                    <p className="text-xs text-amber-800 italic">
                      &quot;{p.messaggiIniziali[faseSelezionata.id]}&quot;
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* STEP 3 â DifficoltÃ  */}
        {step === "difficolta" && (
          <div className="flex flex-col gap-4">
            {(["facile", "medio", "difficile"] as Difficolta[]).map((d) => {
              const config = DIFFICOLTA_CONFIG[d];
              const colors = DIFFICOLTA_COLOR[d];
              return (
                <button
                  key={d}
                  onClick={() => setDifficoltaSelezionata(d)}
                  className={`group text-left rounded-2xl p-5 border-2 shadow-sm transition-all duration-200 active:scale-[0.99] ${
                    difficoltaSelezionata === d
                      ? `${colors.border} ${colors.bg}`
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  type="button"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={`w-3 h-3 rounded-full ${
                              (d === "facile" && i <= 1) ||
                              (d === "medio" && i <= 2) ||
                              d === "difficile"
                                ? colors.dot
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`font-bold text-base ${colors.text}`}>
                        {config.label}
                      </span>
                    </div>
                    {difficoltaSelezionata === d && (
                      <span className={`text-lg ${colors.text}`}>â</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{config.descrizione}</p>
                </button>
              );
            })}

            {/* Riepilogo selezione + Avvia */}
            {difficoltaSelezionata && faseSelezionata && personaggioSelezionato && (
              <div className="mt-2 bg-white border border-slate-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Il tuo scenario
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium px-3 py-1 rounded-full">
                    {faseSelezionata.emoji} {faseSelezionata.nome}
                  </span>
                  <span className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1 rounded-full">
                    {personaggioSelezionato.emoji} {personaggioSelezionato.nome}
                  </span>
                  <span
                    className={`border text-xs font-medium px-3 py-1 rounded-full ${
                      DIFFICOLTA_COLOR[difficoltaSelezionata].border
                    } ${DIFFICOLTA_COLOR[difficoltaSelezionata].bg} ${
                      DIFFICOLTA_COLOR[difficoltaSelezionata].text
                    }`}
                  >
                    {DIFFICOLTA_CONFIG[difficoltaSelezionata].label}
                  </span>
                </div>
                <button
                  onClick={avvia}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 transition-all active:scale-[0.98]"
                  type="button"
                >
                  Inizia simulazione â
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigazione indietro */}
        {step !== "fase" && (
          <button
            onClick={indietro}
            className="mt-6 w-full text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
            type="button"
          >
            â Torna indietro
          </button>
        )}
      </div>
    </div>
  );
}
