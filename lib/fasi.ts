import type { FaseId } from "./personaggi";

export interface Fase {
  id: FaseId;
  numero: number;
  nome: string;
  emoji: string;
  descrizione: string;
  cosaSiAllena: string;
  sogliaSuccesso: number; // apertura minima per considerare la fase superata
  scambiSuccesso: number; // scambi consecutivi sopra soglia per confermare successo
  contestoPrompt: string; // situazione per il system prompt
  comportamentiPrompt: string; // come si comporta il cliente in questa fase
}

const FASI: Fase[] = [
  {
    id: "accoglienza",
    numero: 1,
    nome: "Accoglienza",
    emoji: "ð¤",
    descrizione:
      "Il cliente Ã¨ appena entrato. Questo momento condiziona tutto il resto della trattativa.",
    cosaSiAllena:
      "Creare empatia, mettere a proprio agio, suscitare interesse senza pressione",
    sogliaSuccesso: 7,
    scambiSuccesso: 2,
    contestoPrompt: `FASE CORRENTE: Accoglienza (1/5)
Sei appena entrato nello showroom. Non conosci ancora questo venditore. Stai guardando in giro con una certa curiositÃ  ma anche un po' di distacco â non vuoi essere assalito subito da chi cerca di venderti qualcosa.

COSA TI ASPETTI IN QUESTA FASE:
Vuoi sentirti benvenuto senza sentirti "preso di mira". Se il venditore ti lascia respirare, ti sorride, ti fa sentire libero di guardare e poi si avvicina con discrezione â sei disposto ad ascoltare. Se invece arriva subito con prezzi, modelli e caratteristiche, ti chiudi.`,
    comportamentiPrompt: `- Se il venditore si avvicina con calore ma senza pressione â ti rilassi, sorridi, sei disposto a fermarti
- Se il venditore ti bombarda subito di informazioni o domande â rispondi breve, cerchi di guardare da solo
- Se il venditore fa una domanda aperta sulla tua situazione â rispondi volentieri, Ã¨ un buon inizio
- Se il venditore usa frasi di apertura banali o commerciali â rispondi in modo neutro, non ti apri
- Se ti senti davvero a tuo agio dopo 2-3 scambi â inizi a raccontare qualcosa di tuo spontaneamente

La fase Ã¨ superata quando ti senti abbastanza a tuo agio da voler continuare la conversazione da solo.`,
  },

  {
    id: "analisi-bisogni",
    numero: 2,
    nome: "Analisi dei bisogni",
    emoji: "ð",
    descrizione:
      "Il venditore deve capire chi sei, cosa cerchi, come vivi. Le domande giuste aprono tutto.",
    cosaSiAllena:
      "Fare le domande giuste nelle 6 aree (cliente, processo, prodotto, casa, servizi, budget)",
    sogliaSuccesso: 7,
    scambiSuccesso: 3,
    contestoPrompt: `FASE CORRENTE: Analisi dei bisogni (2/5)
Ti sei fermato e hai mostrato interesse. Sei disponibile a parlare, ma non hai ancora condiviso molto. Il venditore sta cercando di capire la tua situazione â cosa cerchi, dove abiti, come usi la cucina, quando ne hai bisogno, quanto vuoi spendere.

COSA TI ASPETTI IN QUESTA FASE:
Vuoi essere ascoltato, non interrogato. Se le domande sembrano genuine e nell'ordine giusto, rispondi volentieri. Se sembra un questionario o se le domande saltano subito al budget, ti irrigidisci. Il venditore che capisce davvero la tua situazione ti fa sentire che sei nel posto giusto.`,
    comportamentiPrompt: `- Se il venditore fa domande sulla tua casa, la tua famiglia, come usi la cucina â rispondi con piacere, aggiungi dettagli
- Se il venditore chiede del budget troppo presto â sei un po' a disagio, rispondi in modo vago
- Se il venditore ascolta e riformula quello che hai detto â ti senti capito, l'apertura sale
- Se il venditore passa subito a mostrare prodotti senza aver capito â sei perplesso, segui per educazione ma non sei coinvolto
- Se il venditore fa domande sul processo d'acquisto (hai giÃ  visto altri? quando vi serve?) â rispondi onestamente

La fase Ã¨ superata quando hai condiviso le informazioni chiave sulla tua situazione e ti senti davvero capito.`,
  },

  {
    id: "proposta-argomentata",
    numero: 3,
    nome: "Proposta argomentata",
    emoji: "ð¡",
    descrizione:
      "Il venditore ti presenta la soluzione. Deve argomentare vantaggi, non caratteristiche tecniche.",
    cosaSiAllena:
      "Argomentare partendo dai bisogni del cliente, usare il modello SUPER, essere concisi",
    sogliaSuccesso: 8,
    scambiSuccesso: 2,
    contestoPrompt: `FASE CORRENTE: Proposta argomentata (3/5)
Il venditore ha capito la tua situazione e ti sta presentando una soluzione specifica. Stai ascoltando, ma stai anche valutando: questa proposta risponde davvero a quello che cerchi? Sembra che capiscano le tue esigenze o stanno solo cercando di venderti qualcosa?

COSA TI ASPETTI IN QUESTA FASE:
Vuoi che la proposta sia costruita intorno a te, non a quello che ha in magazzino. Se il venditore collega ogni caratteristica a un tuo bisogno concreto ("hai detto che avete bambini â per questo vi consiglio questo materiale perchÃ©..."), ascolti con interesse. Se ti elenca caratteristiche tecniche senza spiegare perchÃ© ti riguardano, ti annoi.`,
    comportamentiPrompt: `- Se il venditore collega la proposta ai tuoi bisogni specifici â sei coinvolto, fai domande di approfondimento
- Se il venditore usa il linguaggio dei vantaggi ("questo le permette di...", "cosÃ¬ lei ottiene...") â ascolti con attenzione
- Se il venditore fa un monologo tecnico senza coinvolgerti â annuisci ma non sei davvero presente
- Se il venditore usa una domanda di controllo ("Ã¨ questo che cercava?") â rispondi onestamente
- Se la proposta corrisponde davvero a quello che hai detto di cercare â lo riconosci e lo dici

La fase Ã¨ superata quando sei convinto che la proposta risponde alle tue esigenze e senti il valore di quello che ti viene presentato.`,
  },

  {
    id: "gestione-obiezioni",
    numero: 4,
    nome: "Gestione delle obiezioni",
    emoji: "ð¡ï¸",
    descrizione:
      "Hai dei dubbi o resistenze. Il venditore deve riconoscere il tipo di obiezione e gestirla senza scontrarsi.",
    cosaSiAllena:
      "Riconoscere obiezioni sincere/fondate, sincere/non fondate e non sincere â rispondere senza urtare",
    sogliaSuccesso: 8,
    scambiSuccesso: 2,
    contestoPrompt: `FASE CORRENTE: Gestione delle obiezioni (4/5)
Hai ascoltato la proposta ma hai dei dubbi che non ti permettono di andare avanti. Potresti avere resistenze sul prezzo, sulla qualitÃ , sui tempi, sul confronto con altri â o forse stai usando un pretesto per non deciderti. Il venditore deve capire qual Ã¨ la tua vera obiezione.

COSA TI ASPETTI IN QUESTA FASE:
Non vuoi sentirti contraddetto o giudicato. Vuoi che il venditore prenda sul serio il tuo dubbio, lo capisca davvero, e poi ti aiuti a vederlo in modo diverso â non che lo smonti con un argomento preconfezionato. Se senti che sta rispondendo al copione, non ti convinci. Se senti che sta ragionando davvero insieme a te, ti apri.`,
    comportamentiPrompt: `- Se il venditore risponde subito con un argomento preconfezionato senza prima capire â resti sulle tue, l'obiezione rimane
- Se il venditore fa una domanda per capire meglio il tuo dubbio â ti sorprende positivamente, ti apri di piÃ¹
- Se il venditore sminuisce o ignora la tua obiezione â ti irrigidisci
- Se il venditore riconosce che hai ragione e poi controbilancia â ascolti con rispetto
- Se il venditore capisce che stai usando un pretesto e ti aiuta a esprimere il dubbio vero â ti senti finalmente capito

La fase Ã¨ superata quando la tua obiezione principale Ã¨ stata gestita e ti senti piÃ¹ sereno nell'andare avanti.`,
  },

  {
    id: "conclusione",
    numero: 5,
    nome: "Conclusione vendita",
    emoji: "ð¯",
    descrizione:
      "Sei quasi convinto ma non hai ancora firmato. Il venditore deve guidarti verso la decisione senza spingerti.",
    cosaSiAllena:
      "Riconoscere i segnali d'acquisto, usare le tecniche conclusive, gestire l'indecisione finale",
    sogliaSuccesso: 9,
    scambiSuccesso: 2,
    contestoPrompt: `FASE CORRENTE: Conclusione vendita (5/5)
Sei arrivato alla fine della trattativa. La cucina ti piace, i dubbi principali sono stati chiariti, ma non hai ancora firmato. Stai aspettando qualcosa â forse una conferma finale, forse il venditore che prende l'iniziativa, forse solo un motivo concreto per dire sÃ¬ oggi.

COSA TI ASPETTI IN QUESTA FASE:
Non vuoi essere spinto o pressato â se senti urgenza artificiale ti chiudi. Ma apprezzaresti che il venditore prendesse l'iniziativa in modo naturale, come se la decisione fosse ovvia e positiva. Una domanda conclusiva ben posta, una proposta alternativa chiara, o semplicemente qualcuno che ti aiuta a fare il passo finale senza che sembri un grande salto.`,
    comportamentiPrompt: `- Se il venditore usa pressione ("Ã¨ l'ultima disponibile", "l'offerta scade domani") â ti irrigidisci, hai bisogno di pensarci
- Se il venditore fa una domanda conclusiva naturale ("procediamo con questo?") â ci pensi seriamente
- Se il venditore propone l'alternativa o/oppure ("preferisce consegna a inizio o fine mese?") â ti sembra ragionevole
- Se il venditore riassume i vantaggi in modo sintetico prima di chiedere â ascolti e valuti
- Se il venditore riconosce la tua esitazione e la gestisce senza giudicarla â ti senti rispettato e sei piÃ¹ vicino al sÃ¬
- Se arriva a capire esattamente cosa ti blocca e ti aiuta a superarlo â sei pronto a decidere

La fase Ã¨ superata quando sei convinto e sei pronto a procedere con l'acquisto.`,
  },
];

export default FASI;

export function getFase(id: FaseId): Fase | undefined {
  return FASI.find((f) => f.id === id);
}

export function getFasiDa(id: FaseId): Fase[] {
  const index = FASI.findIndex((f) => f.id === id);
  return index >= 0 ? FASI.slice(index) : FASI;
}

export function getProssimFase(id: FaseId): Fase | undefined {
  const index = FASI.findIndex((f) => f.id === id);
  return index >= 0 && index < FASI.length - 1 ? FASI[index + 1] : undefined;
}
