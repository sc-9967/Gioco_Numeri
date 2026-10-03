# Numeri in Tasca: risultati dei test automatici

Ambiente: Chromium headless, schermo da telefono 390×844, input simulati con Playwright. Date: 30/09 e 01/10/2026.

I bot calcolano all'istante: con persone vere le partite saranno più brevi.

## Bilancia, Quadrante, Primo, Resto

Smoke test (`tests/smoke.js`): input casuali, Resto con "cassiere perfetto".

| Gioco | Errori JS | Scorrimento orizzontale | Rigioca | Ritorno al launcher |
|---|---|---|---|---|
| Bilancia | nessuno | no | ok | ok |
| Quadrante | nessuno | no | ok | ok |
| Primo | nessuno | no | ok | ok |
| Resto | nessuno | no | n/d (non finiva, vedi sotto) | ok |

Bot che non sbagliano (`tests/bots-esperti.js`). Velocità 1 = tempi base, 1,6 = giocatore più lento del 60%.

| Gioco | Prima delle correzioni | Dopo le correzioni |
|---|---|---|
| Bilancia | 60-64 s | invariato |
| Quadrante | 46 s (livello 4) / 64 s (livello 3) | 67 s (livello 7) / 60 s (livello 3) |
| Primo | 170-174 s, punteggio fino a ~85.000 | 173-186 s, punteggio ~12.000-22.000 |
| Resto | partita infinita (>300 s senza perdere) | 454-474 s, punteggio ~6.500-11.000 |

### Correzioni applicate

1. **Resto, pazienza dei clienti.** Dal livello 8 la pazienza smetteva di calare (minimo 7 s + 0,5 s per pezzo), quindi chi non sbagliava non perdeva mai. Ora cala di 0,6 s per livello fino a 2,5 s + 0,5 s per pezzo.
2. **Primo e Resto, moltiplicatore della serie.** Saliva senza limite. Ora ha un tetto di ×5, così i punteggi sono confrontabili.
3. **Quadrante, durata delle ore accese.** Da `max(3,5; 8,5 − 0,6·(livello−1))` a `max(4,5; 10,5 − 0,5·(livello−1))` secondi, perché il calcolo modulo 12 a mente richiede tempo.

### Aspetti aperti

- Quadrante resta il più difficile: anche un bot lento perde rubini già al livello 1-2. Da verificare con persone vere.
- Il tetto ×5 è una scelta di progetto, non una regola derivata.

## Girasette

- **Anelli:** 1, 6, 12, 18 celle; ogni cella è adiacente alla successiva; il giro è una permutazione perfetta di 36 tessere; il centro resta fermo; anelli adiacenti girano in versi opposti.
- **Moltiplicatore:** una stessa fusione vale 60 punti normalmente e 120 dopo un giro.
- **Fusione causata dal giro:** tre 1 che si toccano solo dopo il giro diventano un 2 con 125 punti, come calcolato a mano.
- **Partite a mosse casuali (8):** da 65 a 287 mosse, nessun errore.
- **Bot che sceglie la mossa migliore:** oltre 700 mosse senza finire, con 12-15 tessere in plancia. Il gioco ha una rampa di difficoltà (ogni 25 pezzi i valori alti diventano più frequenti), ma un giocatore esperto non arriva naturalmente al game over: la partita si gioca per punteggio.
- **Nel launcher:** menu, partita, rigioca, ritorno, record sulla carta, conteggio e apertura diretta con `#girasette`, senza errori.

## Raddoppio

- **Scorrimento e fusione** (`raddoppio-logica.js`): `[2,2,2,2]` → `[4,4,0,0]`, `[2,2,4,4]` → `[4,8,0,0]`, `[8,8,8,0]` → `[16,8,0,0]`, `[4,2,2,0]` → `[4,4,0,0]`; punti 8 e 12 per i primi due casi. Le quattro direzioni sulla griglia danno il risultato atteso.
- **Partite casuali:** 12 partite, circa 1.500-2.000 mosse valide, nessuna violazione: dopo ogni mossa la somma delle tessere cresce esattamente di 2 o 4 (la tessera comparsa), tutte le tessere sono potenze di 2, una mossa nulla non cambia la griglia. Tutte le partite arrivano al game over.
- **Annulla deterministico:** su 60 prove, 60 volte la stessa mossa dopo l'annulla dà la stessa griglia e lo stesso punteggio.
- **Sfida del giorno:** due avvii producono la stessa griglia iniziale.
- **Catena:** 12 punti alla prima fusione (×1), 16 alla seconda consecutiva (8 × 2).
- **Martello:** compare al raggiungimento del 64, rompe la tessera scelta e si consuma.
- **Vittoria:** a 2048 compare il modale e "Continua" lo chiude. **Game over:** griglia bloccata senza martelli mostra il pannello finale.
- **Nel launcher:** scheda, menu, partita, game over, rigioca, ritorno, record sulla carta, conteggio e `#raddoppio`, senza errori. Nessun residuo di stili o elementi del gioco dopo l'uscita.
- **Schermi:** 360×640, 390×844, 844×390 e 1280×800 senza scorrimento orizzontale.
- **Limite:** i bot giocano a caso. Non è stato misurato quanto sia difficile o divertente per una persona; il martello e la catena sono tarati a intuito.

## Sentiero

- **Percorso ottimo:** su 300 griglie generate, la programmazione dinamica coincide sempre con il massimo su tutti i 70 percorsi. In 240 griglie l'ottimo è unico, in 60 ci sono pari merito.
- **Difficoltà misurata:** valore ottimo da 30 a 2.592 (media 264). Un percorso scelto a caso vale in media il 27% dell'ottimo; il percorso "ingordo" (a ogni passo la casella migliore) il 53%. Le griglie con ingordo oltre l'88% dell'ottimo vengono scartate.
- **Generazione:** 300 griglie in circa 50-75 ms; stessa data = stesse griglie, date diverse = griglie diverse.
- **Date e record:** il giorno è quello di Roma (31/12 alle 23:30 UTC risulta già 01/01); settimana da lunedì; migliore/media/giorni per oggi, settimana, anno e sempre; serie dei giorni consecutivi (anche a partire da ieri).
- **Partita con tocchi reali:** il percorso ottimo dà 100% per 5 griglie, totale 500. Indietro, da capo, tocco su una casella già percorsa e tastiera funzionano; una mossa non adiacente non cambia nulla.
- **Una sola sfida al giorno:** dopo la prima serie, "Sfida del giorno" mostra solo il riepilogo. Dopo la ricarica il record resta.
- **Codici sfida:** il codice nel testo di condivisione riproduce le stesse 5 griglie; codici malformati o con punteggio oltre 500 vengono rifiutati; il confronto dice "battuta", "pareggio" o "persa".
- **Nel launcher:** scheda, menu, sfida, altra serie, ritorno, record, conteggio, rotta `#sentiero?c=…` con codice precompilato, nessun residuo dopo l'uscita, nessun errore. Nessuno scorrimento orizzontale su 360×640, 390×844, 844×390 e 1280×800.
- **Limiti:** i punteggi sono salvati sul dispositivo e non sono verificabili; non è stato misurato il gradimento reale, né la difficoltà percepita da persone vere (i bot misurano solo il divario tra scelta casuale, ingorda e ottima).

## Nome del giocatore

- Senza nome il gioco non parte: la home mostra "Scrivi il tuo nome per giocare". Un nome vuoto viene rifiutato.
- Il nome viene ripulito (caratteri di controllo e `<`/`>` rimossi, spazi ridotti) e limitato a 20 caratteri; resta dopo la ricarica.
- Dopo il nome parte il gioco che si era scelto; con un link diretto (`#sentiero?c=…&n=Giulia`) la home resta finché il nome non è scritto, poi si apre la sfida e si legge "Sfida di Giulia".
- I testi condivisi iniziano con il nome (verificati Sentiero e Raddoppio; gli altri quattro usano la stessa funzione). Il link di sfida di Sentiero porta il nome di chi sfida.
- Il nome non compare né nelle statistiche copiate né in `nit_stats`.
- I test esistenti ora impostano un nome prima di aprire il launcher.

## Record salvati e backup

- Ogni partita conclusa (Sentiero, Raddoppio verificati con partite vere) viene registrata per gioco e giorno: migliore, numero di partite, somma. Il riepilogo della sfida del giorno di Sentiero non viene contato una seconda volta.
- Il pannello "I miei record" mostra per tutti i sette giochi il migliore di oggi, della settimana, dell'anno e di sempre, più il numero di partite registrate.
- **Backup:** il testo `NIT1.…` (225 caratteri con due giochi) viene prodotto e, incollato in un contesto vuoto, ripristina record, record sulle carte e nome (se mancante). Il testo viene riconosciuto anche circondato da altre parole.
- **Il ripristino non abbassa i record:** per ogni giorno si tiene il valore più alto.
- **Backup non validi:** testo senza prefisso, versione sconosciuta o dati danneggiati vengono rifiutati con un messaggio. Valori assurdi (negativi, oltre 10⁹, nomi di gioco con caratteri strani, serie oltre 500) vengono scartati.
- **Archiviazione non disponibile** (scrittura che fallisce, come in navigazione privata): compare l'avviso in home.
- **Limiti:** la protezione del browser (`navigator.storage.persist`) viene richiesta ma la decide il browser; in prova risultava "no". I record restano su un solo dispositivo, il backup è manuale. I punteggi non sono verificabili.

## Lampo

- **Regole:** sequenze 1,2,3 / 3,6,9 / 2,4,6 / 30,29…1 e poi di nuovo 30; moltiplicatore della combo con tetto ×5 (×1, ×2,5 a 10, ×5 a 100).
- **La partita finisce sempre:** giocatore simulato perfetto a 1,4 colpi/s: fine dopo 338 s (518 colpi, combo 518, 661.000 punti); a 2,2 colpi/s: 400 s. Il prototipo originale non finiva mai (777 milioni di punti in 10 minuti).
- **Febbre:** una sola attivazione ogni 28 s circa (8 s attiva, 20 s di pausa); nel prototipo era attiva il 91% del tempo.
- **Bonus:** la stella aggiunge tempo senza far avanzare la sequenza; lo scudo para un errore; un errore costa 8 s e azzera la combo.
- **Tocchi reali:** 6 su 6 sul numero richiesto; fine partita, record sulla carta, storico e conteggio nel launcher; schermi 360×640, 844×390 e 1280×800 senza scorrimento orizzontale.
- **Limite:** i punteggi arrivano a centinaia di migliaia per un giocatore perfetto (base 250 × moltiplicatore fino a 7); non è stato provato con persone vere.

## Uscita dalla partita e record per periodo

- **Uscita:** in tutti gli otto giochi il link "← Tutti i giochi" è visibile a partita in corso, dentro lo schermo a 360×700, senza scorrimento orizzontale. In partita la prima pressione chiede conferma e la seconda torna al launcher; la conferma scade dopo 2,5 s; un abbandono non entra nello storico.
- **Leggibilità:** il colore del link si adatta allo sfondo (chiaro su scuro, scuro su chiaro): in Resto, dove il pannello in basso è scuro, prima era quasi invisibile.
- **Record per periodo** (storico costruito a mano): oggi, settimana (da lunedì), mese, anno e sempre calcolati correttamente. Il record di sempre include il valore già salvato dal gioco prima dello storico (1.200 con storico a 900).
- **Dentro ogni gioco:** riga "Record · oggi · settimana · mese · sempre" nel menu e a fine partita, aggiornata dopo ogni partita.
- **Corretto:** il listener di Lampo su `document` non veniva rimosso all'uscita e poteva dare un errore dopo il ritorno al launcher.
- **Limite:** i record restano sul dispositivo (backup manuale), i punteggi non sono verificabili, e le partite abbandonate non contano nemmeno come record.

## Cassaforte

- **Prototipo ricevuto (simulazione):** il verde era mostrato sulla cifra con indice uguale al *numero* di cifre giuste, non su quelle giuste: 12-18% delle cifre colorate in modo falso. Un solutore casuale coerente apriva il codice in 4,2-4,8 tentativi su 6-9 disponibili e non perdeva mai: troppo facile. Gli altri due giochi del file (ponte e equazione in caduta) non sono stati integrati: nel ponte la prima scelta è alla cieca (10-20% di successo con la scelta migliore al primo tentativo), nell'equazione il primo numero va scelto senza vedere gli operatori.
- **Nuovo feedback (solo conteggi):** un solutore casuale che usa solo le informazioni del gioco apre il codice in media in 5,3 tentativi (3 cifre), 5,5 (4), 5,9 (5), 6,4 (6). Con 7 tentativi per 3 cifre perdeva il 3,8% delle volte; i tentativi sono stati portati a 8 (3 cifre), 8 (4), 9 (5), 10 (6).
- **Logica:** feedback, lunghezza per cassaforte, moltiplicatore con tetto ×5 (×1, ×1,25, ×2, ×5, ×5), tentativi validi (cifre diverse), codici sempre a cifre diverse, codice del giorno stabile, punti entro i limiti.
- **La serie finisce sempre:** 6 serie del bot a velocità massima finite tutte (20 casseforti a testa), oltre ai limiti di vite e tempo.
- **Tocchi reali a 360×700 e 320×560:** cifra ripetuta rifiutata, cancellazione, tentativo incompleto non inviato, tastierino bloccato durante la rivelazione, note, un solo indizio per cassaforte, vita persa per tentativi finiti e per tempo scaduto, record registrato per periodo e in `cass_best`, nessuno scorrimento orizzontale, pulsante di uscita dentro lo schermo.
- **Codice del giorno:** 4 cifre, 8 tentativi, nessun tempo; uscendo e rientrando la partita riprende (tentativo e codice uguali); una volta finita non si rigioca: il risultato si rivede senza contare una seconda partita.
- **Corretto durante i test:** l'ultimo fotogramma dopo l'uscita dal gioco dava un errore su un elemento già rimosso (stessa causa già vista in Lampo).
- **Limite:** non provato con persone vere; la difficoltà delle serie lunghe (5 e 6 cifre, tempo che cala) è calibrata sul solutore, non sui giocatori.

## Calamita (serie, obiettivo, gancio di fine partita)

- **Serie di giorni:** ieri e l'altro ieri giocati → "2 giorni di fila" con l'avviso per tenerla; un giorno vuoto la azzera; nuovo giocatore: "Inizia la tua serie". Home senza scorrimento orizzontale a 360 px.
- **Obiettivo:** pallini 0/3 e 1/3 corretti; la carta del gioco giocato oggi mostra "✓ oggi"; il gioco consigliato non è mai il più giocato.
- **Fine partita (partita vera di Cassaforte):** con un record di oggi già alto compare "Ti mancano N punti per il record di oggi", la 2ª partita di oggi, la serie e l'obiettivo; con un record precedente basso "Nuovo record di sempre" con coriandoli; "Prossimo" apre il gioco suggerito; Invio rigioca.
- **Corretto durante i test:** i giochi aggiornano il proprio record *prima* di mostrare la schermata finale, quindi il record di sempre risultava già "pari": ora si usa il record che c'era prima della partita. Un fotogramma di Cassaforte dopo il passaggio a un altro gioco dava un errore perché l'id `app` era già di un altro gioco.
- **Girasette e Bilancia (partita libera):** nessun "Copia risultato" proprio → lo aggiunge il launcher, con il nome.
- **Limite:** sono ingredienti noti, ma non è provato che trattengano i giocatori. Il segnale si vedrà nelle statistiche anonime: partite a testa, quanti arrivano a 3 partite e quanti tornano in giorni diversi.

## Girasette: partita del giorno

- **Stessi pezzi per tutti:** tre partite del giorno con strategie diverse (prima mossa valida, ultima, casuale) hanno visto le stesse 33 riserve (da 33 a 46 riserve per partita, fino al game over). La partita libera resta casuale.
- **Costo:** nella partita del giorno manca l'aiuto della libera (che pesca il 40% delle volte tra i valori già in plancia, in calo col livello), perché dipende dalle mosse del giocatore e farebbe divergere i pezzi. Non è stata misurata la differenza di difficoltà. [Ipotesi: la partita del giorno è un po' più dura]
- **Fine partita:** tessera massima, giri, catena; testo condiviso del tipo "Girasette · partita del giorno 03/10 · 9.385 punti · tessera 7 · 32 giri · catena ×2"; il record del giorno ha una chiave propria; le partite finite entrano nello storico del launcher; nessun "Copia risultato" duplicato.
- **Osservato:** con la strategia "prima mossa valida" una partita libera è arrivata a 336 giri e 179.645 punti prima di finire: Girasette non ha un limite di durata proprio, finisce solo quando la plancia si riempie. Non l'ho modificato.
- I test precedenti di Girasette (logica, giro, bot, launcher) passano ancora.

## Prototipo valutato e non integrato: Number Tide

- **Simulazione dell'acqua** (livello 1-6): un giocatore senza errori che tocca un numero ogni 0,4-2 s non perde mai; solo al livello 6, con un tocco ogni 3 s, la partita finisce (dopo 20 s). Il gioco non può finire per chi gioca bene, come il prototipo originale di Lampo.
- **Difetti:** le vite non scendono mai (mostra sempre ❤️❤️❤️); combo senza tetto (300 tocchi perfetti = circa 2 milioni di punti); la sequenza Fibonacci contiene due "1" ma conta solo quello giusto per indice, quindi toccare l'altro "1" dà errore; i livelli 1-5 ripetono sempre la stessa sequenza.
- **Sovrapposizione:** è Lampo (tocca in ordine con pressione di tempo) con l'acqua al posto della barra. Unica idea nuova: sequenze Fibonacci e numeri primi.

## Istruzioni per bambini

- **Nove giochi su nove:** le istruzioni compaiono da sole alla prima apertura, si chiudono con il pulsante o con Esc, non ricompaiono alla seconda apertura, si riaprono dal menu e dalla schermata finale.
- **Lettura ad alta voce:** il pulsante "Leggi per me" chiama la sintesi vocale del browser in italiano (`it-IT`, velocità 0,85) con titolo, introduzione, passi e trucco; uscire dal gioco la ferma. Nei test la voce è simulata: non ho sentito l'audio reale, e la qualità dipende dalle voci italiane installate sul dispositivo. [Ipotesi che su alcuni telefoni la voce sia scadente o manchi]
- **Lunghezza:** da 4 a 6 passi per gioco; in media 9-14 parole per frase, al massimo 21; nessuna parola da 11 lettere o più (misurate nei testi).
- **Schermo 360×700:** titolo in cima e pulsanti sempre in vista; i passi scorrono (compare "⬇ Scorri per vedere tutto").
- **Corretti durante i test:** i nomi di classe `t` ed `e` della scheda coincidevano con quelli di Cassaforte (testo bianco su bianco); la scheda si apriva scorsa in fondo; i pulsanti coprivano il testo.
- **Limite:** nessun bambino ha provato i testi. Che un bambino di 5 anni capisca "tre esagoni uguali vicini diventano uno" o "il resto" è un'ipotesi, non un dato.

## Sentiero: percorso in rosa acceso

- **Cosa si vede:** per ogni passo un collegamento rosa (#ff1f8e) con bordo bianco, anello rosa e numero d'ordine (1, 2, 3…) sulle caselle toccate; la casella attuale pulsa con un alone. I collegamenti restano ai bordi delle caselle e non coprono i numeri.
- **Verificato a 390×844 e 320×560:** nessun tratto all'inizio; 5 tratti dopo 5 mosse con colore e bordo corretti; "Indietro" e il tocco su una casella già percorsa tolgono i tratti e i numeri giusti; a griglia finita 8 tratti, e una nuova griglia riparte pulita; il disegno copre esattamente la griglia; nessuno scorrimento orizzontale; il foglio finale spiega i colori ("In rosa il tuo percorso, in blu il percorso ottimo").
- **Corretti durante i test:** nella prima versione i collegamenti entravano troppo nelle caselle e coprivano le somme parziali ("=7"): ridotti; quando il percorso coincide con l'ottimo l'anello blu nascondeva quello rosa: ora si vedono entrambi.
- **Limite:** a 320×560 il foglio dei risultati copre la parte bassa della griglia (comportamento già presente, non modificato).
