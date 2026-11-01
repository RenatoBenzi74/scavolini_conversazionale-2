"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "scavolini_voce_cliente";

function scegliVoceItaliana(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voci = window.speechSynthesis.getVoices().filter((v) =>
    v.lang.toLowerCase().startsWith("it")
  );
  if (voci.length === 0) return null;
  // Preferisce le voci di qualità migliore (di rete / "naturali") se presenti
  return (
    voci.find((v) => /google|natural|premium|enhanced/i.test(v.name)) ||
    voci.find((v) => !v.localService) ||
    voci[0]
  );
}

/**
 * Fa parlare il cliente con la sintesi vocale del browser (italiano).
 * Il testo resta sempre scritto in chat: la voce è un'aggiunta attivabile.
 */
export function useVoceCliente() {
  const [supportato, setSupportato] = useState(false);
  const [attiva, setAttivaState] = useState(false);
  const [staParlando, setStaParlando] = useState(false);
  const attivaRef = useRef(false);
  const voceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setSupportato(true);

    try {
      const salvato = window.localStorage.getItem(STORAGE_KEY) === "1";
      attivaRef.current = salvato;
      setAttivaState(salvato);
    } catch {
      /* localStorage non disponibile: resta spento */
    }

    const caricaVoci = () => {
      voceRef.current = scegliVoceItaliana();
    };
    caricaVoci();
    window.speechSynthesis.addEventListener("voiceschanged", caricaVoci);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", caricaVoci);
      window.speechSynthesis.cancel();
    };
  }, []);

  const ferma = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setStaParlando(false);
  }, []);

  const parla = useCallback((testo: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (!attivaRef.current || !testo.trim()) return;

    window.speechSynthesis.cancel(); // evita code e sovrapposizioni
    const u = new SpeechSynthesisUtterance(testo);
    u.lang = "it-IT";
    if (voceRef.current) u.voice = voceRef.current;
    u.rate = 1;
    u.onstart = () => setStaParlando(true);
    u.onend = () => setStaParlando(false);
    u.onerror = () => setStaParlando(false);
    window.speechSynthesis.speak(u);
  }, []);

  const setAttiva = useCallback(
    (valore: boolean) => {
      attivaRef.current = valore;
      setAttivaState(valore);
      try {
        window.localStorage.setItem(STORAGE_KEY, valore ? "1" : "0");
      } catch {
        /* ignora */
      }
      if (!valore) ferma();
    },
    [ferma]
  );

  return { supportato, attiva, staParlando, parla, ferma, setAttiva };
}
