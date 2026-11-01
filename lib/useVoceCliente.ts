"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "scavolini_voce_cliente";

// Mezzo secondo di silenzio: serve a "sbloccare" la riproduzione audio con il click dell'utente (Safari)
const SILENZIO_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

export interface OpzioniVoce {
  personaggioId?: string;
  statoEmotivo?: string;
}

function scegliVoceItaliana(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voci = window.speechSynthesis.getVoices().filter((v) =>
    v.lang.toLowerCase().startsWith("it")
  );
  if (voci.length === 0) return null;
  return (
    voci.find((v) => /google|natural|premium|enhanced/i.test(v.name)) ||
    voci.find((v) => !v.localService) ||
    voci[0]
  );
}

/**
 * Fa parlare il cliente. Prima prova la voce OpenAI (/api/voce);
 * se non è configurata o dà errore, ripiega sulla voce del browser.
 * Il testo resta sempre scritto in chat: la voce è un'aggiunta attivabile.
 */
export function useVoceCliente() {
  const [supportato, setSupportato] = useState(false);
  const [attiva, setAttivaState] = useState(false);
  const [staParlando, setStaParlando] = useState(false);

  const attivaRef = useRef(false);
  const voceBrowserRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlAudioRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const richiestaRef = useRef(0); // scarta risposte audio arrivate in ritardo

  const pulisciAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    }
    if (urlAudioRef.current) {
      URL.revokeObjectURL(urlAudioRef.current);
      urlAudioRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupportato(true);

    try {
      const salvato = window.localStorage.getItem(STORAGE_KEY) === "1";
      attivaRef.current = salvato;
      setAttivaState(salvato);
    } catch {
      /* localStorage non disponibile: resta spento */
    }

    audioRef.current = new Audio();

    const synth = window.speechSynthesis;
    const caricaVoci = () => {
      voceBrowserRef.current = scegliVoceItaliana();
    };
    if (synth) {
      caricaVoci();
      synth.addEventListener("voiceschanged", caricaVoci);
    }

    return () => {
      synth?.removeEventListener("voiceschanged", caricaVoci);
      richiestaRef.current++;
      abortRef.current?.abort();
      pulisciAudio();
      synth?.cancel();
    };
  }, [pulisciAudio]);

  const ferma = useCallback(() => {
    richiestaRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    pulisciAudio();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setStaParlando(false);
  }, [pulisciAudio]);

  const parlaConBrowser = useCallback((testo: string, idRichiesta: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setStaParlando(false);
      return;
    }
    if (idRichiesta !== richiestaRef.current) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(testo);
    u.lang = "it-IT";
    if (voceBrowserRef.current) u.voice = voceBrowserRef.current;
    u.onstart = () => setStaParlando(true);
    u.onend = () => setStaParlando(false);
    u.onerror = () => setStaParlando(false);
    window.speechSynthesis.speak(u);
  }, []);

  const parla = useCallback(
    async (testo: string, opzioni: OpzioniVoce = {}) => {
      if (typeof window === "undefined") return;
      if (!attivaRef.current || !testo.trim()) return;

      ferma(); // niente code né sovrapposizioni
      const idRichiesta = ++richiestaRef.current;
      const controller = new AbortController();
      abortRef.current = controller;
      setStaParlando(true); // anche durante il caricamento dell'audio

      try {
        const res = await fetch("/api/voce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testo,
            personaggioId: opzioni.personaggioId,
            statoEmotivo: opzioni.statoEmotivo,
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`voce HTTP ${res.status}`);

        const blob = await res.blob();
        if (idRichiesta !== richiestaRef.current) return; // nel frattempo è stato fermato

        const url = URL.createObjectURL(blob);
        urlAudioRef.current = url;
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = url;
        audio.onended = () => {
          if (idRichiesta === richiestaRef.current) setStaParlando(false);
        };
        audio.onerror = () => parlaConBrowser(testo, idRichiesta);
        await audio.play();
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (idRichiesta !== richiestaRef.current) return;
        // OpenAI non configurata, errore di rete o riproduzione bloccata: voce del browser
        parlaConBrowser(testo, idRichiesta);
      }
    },
    [ferma, parlaConBrowser]
  );

  const setAttiva = useCallback(
    (valore: boolean) => {
      attivaRef.current = valore;
      setAttivaState(valore);
      try {
        window.localStorage.setItem(STORAGE_KEY, valore ? "1" : "0");
      } catch {
        /* ignora */
      }
      if (!valore) {
        ferma();
      } else if (audioRef.current) {
        // Siamo dentro un click: sblocca la riproduzione audio per le risposte successive
        audioRef.current.src = SILENZIO_WAV;
        audioRef.current.play().catch(() => {});
      }
    },
    [ferma]
  );

  return { supportato, attiva, staParlando, parla, ferma, setAttiva };
}
