import Link from "next/link";

export const metadata = {
  title: "Noi² — Metodo delle Competenze Risonanti",
  description: "Le persone cambiano quando inciampano. Non quando capiscono.",
};

export default function MCRPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-teal-500 rounded-md flex items-center justify-center">
            <span className="text-slate-900 text-xs font-black">Noi²</span>
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← torna al simulatore
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-lg mx-auto w-full space-y-14">

        {/* Headline */}
        <div className="text-center space-y-6">
          <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">
            Metodo delle Competenze Risonanti
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-snug text-white">
            Le persone cambiano<br />
            quando inciampano.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed text-left border-l-2 border-teal-500/30 pl-4">
            Perché quando inciampi cerchi di non cadere, ricerchi disperatamente con tutto te stesso
            l&apos;equilibrio, la tua attenzione si alza al massimo; in quella momentanea parentesi
            in cui si sperimenta lo smarrimento tutto il nostro essere si predispone al ritrovarsi.
          </p>
        </div>

        {/* Divisore */}
        <div className="w-8 h-px bg-teal-500/50" />

        {/* Le tre competenze */}
        <div className="w-full space-y-3">
          {[
            { n: "01", nome: "Ascolto Partecipativo" },
            { n: "02", nome: "Agilità Cognitiva" },
            { n: "03", nome: "Connessione Emotiva" },
          ].map((c) => (
            <div
              key={c.n}
              className="flex items-center gap-4 border border-slate-800 rounded-xl px-5 py-4 hover:border-slate-700 transition-colors"
            >
              <span className="text-xs font-mono text-teal-500 w-6">{c.n}</span>
              <span className="text-slate-200 font-medium text-sm">{c.nome}</span>
            </div>
          ))}
        {/* Teaser dopo le competenze */}
          <p className="text-slate-500 text-sm pt-2 text-center">
            Vuoi capire come si allenano  e cosa cambia quando le porti sul campo?
          </p>
        </div>

        {/* Divisore */}
        <div className="w-8 h-px bg-slate-700" />

        {/* Citazione finale */}
        <p className="text-center text-slate-400 text-sm leading-relaxed italic max-w-xs">
          "Un &lsquo;noi&rsquo; non è la somma di più persone.<br />
          È quando le persone si incontrano davvero."
        </p>

        {/* CTA */}
        <div className="text-center space-y-3 w-full">
          <a
            href="mailto:renato.benzi.74@gmail.com"
            className="block w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl px-6 py-3.5 transition-all active:scale-95 text-sm text-center"
          >
            Scrivici
          </a>
          <p className="text-xs text-slate-600">
            ti risponderemo entro 24 ore
          </p>
        </div>

      </section>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-slate-700">
          Noi² · Genova, 2026
        </p>
      </footer>
    </div>
  );
}
