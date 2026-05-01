"use client";

import { useEffect, useRef } from "react";
import type { Messaggio } from "@/lib/types";

interface ChatAreaProps {
  messaggi: Messaggio[];
  loading: boolean;
}

function MessaggioVenditore({ testo }: { testo: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%]">
        <div className="bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm leading-relaxed">{testo}</p>
        </div>
        <p className="text-xs text-slate-400 text-right mt-1 mr-1">Tu</p>
      </div>
    </div>
  );
}

function MessaggioCliente({
  testo,
  apertura,
}: {
  testo: string;
  apertura?: number;
}) {
  let borderColore = "border-slate-200";
  if (apertura !== undefined) {
    if (apertura >= 8) borderColore = "border-emerald-300";
    else if (apertura >= 6) borderColore = "border-teal-200";
    else if (apertura >= 4) borderColore = "border-amber-200";
    else borderColore = "border-red-200";
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[75%]">
        <div
          className={`bg-white border ${borderColore} rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm transition-colors duration-300`}
        >
          <p className="text-sm leading-relaxed text-slate-800">{testo}</p>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-1">Luca</p>
      </div>
    </div>
  );
}

function IndicatoreTyping() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%]">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="flex gap-1 items-center">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-1">Luca sta scrivendo…</p>
      </div>
    </div>
  );
}

export default function ChatArea({ messaggi, loading }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messaggi, loading]);

  if (messaggi.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <div className="text-4xl">🏠</div>
          <p className="font-semibold text-slate-700">
            Luca sta aspettando
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            È venuto per informarsi su una cucina. Ha già sentito altri.
            Inizia la conversazione — le tue parole hanno conseguenze reali.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              Situazione iniziale
            </p>
            <p className="text-sm text-amber-800 italic">
              &quot;Mi sembra un po&apos; caro sinceramente…&quot;
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
      {/* Messaggio iniziale di Luca (fisso) */}
      {messaggi.length >= 0 && (
        <MessaggioCliente
          testo="Mi sembra un po' caro sinceramente…"
          apertura={5}
        />
      )}

      {messaggi.map((msg, i) => {
        if (msg.ruolo === "venditore") {
          return <MessaggioVenditore key={i} testo={msg.testo} />;
        } else {
          return (
            <MessaggioCliente
              key={i}
              testo={msg.testo}
              apertura={msg.stato?.apertura}
            />
          );
        }
      })}

      {loading && <IndicatoreTyping />}
      <div ref={bottomRef} />
    </div>
  );
}
