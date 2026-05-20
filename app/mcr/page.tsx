import Link from "next/link";

export const metadata = {
  title: "Metodo delle Competenze Risonanti — Noi²",
  description: "Il metodo MCR per la formazione relazionale nelle vendite.",
};

export default function MCRPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-teal-500 rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">N²</span>
          </div>
          <span className="text-sm font-semibold text-slate-300">Noi²</span>
        </div>
        <Link
          href="/"
          className="text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-500 rounded-lg px-4 py-1.5"
        >
          ← Torna al simulatore
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 space-y-8 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-sm text-teal-400 font-medium">
          Metodo · Formazione · Relazione
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          Il Metodo delle<br />
          <span className="text-teal-400">Competenze Risonanti</span>
        </h1>

        <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
          Non si vende convincendo. Si vende creando uno spazio
          in cui l'altro si sente capito abbastanza da voler continuare a parlare.
        </p>

        <div className="w-16 h-px bg-slate-700" />

        {/* Cosa è MCR */}
        <div className="text-left w-full space-y-6">
          <h2 className="text-xl font-semibold text-white text-center">Di cosa si tratta</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: "👂",
                titolo: "Ascolto esplorativo",
                testo: "Ascoltare non per rispondere, ma per capire davvero cosa sta cercando l'altro — anche quello che non dice.",
              },
              {
                icon: "🔗",
                titolo: "Connessione emotiva",
                testo: "Creare il contatto umano prima del contatto commerciale. La fiducia precede la decisione.",
              },
              {
                icon: "🔄",
                titolo: "Flessibilità comunicativa",
                testo: "Adattarsi in tempo reale: leggere i segnali, cambiare registro, gestire la resistenza senza forzare.",
              },
            ].map((c) => (
              <div key={c.titolo} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-2">
                <span className="text-2xl">{c.icon}</span>
                <h3 className="font-semibold text-white text-sm">{c.titolo}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{c.testo}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-16 h-px bg-slate-700" />

        {/* Il simulatore come strumento MCR */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 text-left w-full space-y-3">
          <p className="text-xs font-bold text-teal-400 uppercase tracking-wide">Il simulatore che hai appena usato</p>
          <p className="text-slate-300 leading-relaxed">
            Luca non è un quiz. È un ambiente di pratica progettato con il Metodo MCR:
            ogni sua reazione è calibrata su competenze reali — ascolto, esplorazione, gestione della resistenza.
            Il feedback che ricevi non giudica. Osserva.
          </p>
          <p className="text-slate-400 text-sm">
            Questo è uno strumento di allenamento relazionale. Il metodo completo si impara in aula, con Renato e il team Noi².
          </p>
        </div>

        <div className="w-16 h-px bg-slate-700" />

        {/* CTA */}
        <div className="space-y-4 text-center">
          <p className="text-slate-400">Vuoi portare il Metodo MCR nella tua rete vendita?</p>
          <a
            href="mailto:info@noi2.it"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl px-8 py-3.5 transition-all active:scale-95 text-base"
          >
            Scrivici →
          </a>
          <p className="text-xs text-slate-600">
            Risponde Renato. Di solito entro 24 ore.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-4 text-center">
        <p className="text-xs text-slate-600">
          Noi² · Formazione relazionale per le vendite ·{" "}
          <Link href="/" className="hover:text-slate-400 transition-colors underline underline-offset-2">
            Torna al simulatore
          </Link>
        </p>
      </footer>
    </div>
  );
}
