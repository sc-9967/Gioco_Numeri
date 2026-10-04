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

## Sentiero: percorso in rosa tenue

- **Cosa si vede:** anello rosa tenue (#e98aab) e numero d'ordine (1, 2, 3…) sulle caselle toccate; la casella attuale pulsa. **Nessuna linea** (tolte su richiesta: nella prima versione il rosa era #ff1f8e, troppo acceso, e i collegamenti coprivano le somme parziali).
- **Verificato a 390×844 e 320×560:** nessuna linea disegnata; anello e numeri rosa sulle caselle del percorso; "Indietro" e il tocco su una casella già percorsa tolgono i segni giusti; a griglia finita 8 caselle numerate e una nuova griglia riparte pulita; nessuno scorrimento orizzontale; il foglio finale spiega i colori ("In rosa il tuo percorso, in blu il percorso ottimo").
- **Corretto durante i test:** quando il percorso coincide con l'ottimo l'anello blu nascondeva quello rosa: ora si vedono entrambi.
- **Limite:** a 320×560 il foglio dei risultati copre la parte bassa della griglia (comportamento già presente, non modificato).

## Girasette: la difficoltà cresce (sassi)

- **Il problema, misurato:** simulando solo la logica (le stesse funzioni del gioco), un giocatore automatico che sceglie la mossa che libera più celle **non perdeva mai**: 3.000 pezzi (1.000 giri) senza finire, 430.000 punti. Solo un giocatore a caso finiva (mediana 101 pezzi). Prima, con una partita reale, la strategia "prima mossa valida" era arrivata a 336 giri.
- **La soluzione:** sassi grigi che non si fondono, girano con l'anello e restano finché un'esplosione di 7 non li raggiunge. Calendario: nessuno nelle prime 7 riserve, poi in numero crescente (primo verso la 13ª riserva; tra le riserve 20-29 ne arrivano 3, tra la 70 e la 79 ne arrivano 7). Una riga in alto annuncia il prossimo.
- **Risultati con giocatori automatici (25 partite ciascuno, tutte finite):** a caso mediana 77 pezzi (min 44, max 127); che libera celle mediana 154 pezzi (min 103, max 224), cioè circa 50 riserve, probabilmente 8-12 minuti. Confrontate con altre tarature provate: più lente (mediana fino a 299 pezzi) o più rapide (mediana 128). [Ipotesi: una persona gioca peggio del bot "che libera celle" ma meglio di quello a caso, quindi tra 3 e 10 minuti]
- **Test dentro al gioco:** la strategia che prima non finiva ora finisce dopo 27 giri e 82 pezzi; il primo sasso arriva alla riserva 14; i sassi si accumulano; annuncio ("Un sasso tra 2 riserve", "dopo questa riserva"); sassi che non si fondono, che girano, che si rompono con un'esplosione; plancia piena senza errori; nella partita del giorno stesse posizioni per tutti.
- **Limite 1:** i punteggi ora sono di un altro ordine (mediana circa 13.000 per il bot, contro 430.000 senza fine). **Un record vecchio molto alto non si batte più**: decidi se azzerare il record di Girasette sui dispositivi dei tester.
- **Limite 2:** nella partita del giorno le posizioni dei sassi non sono identiche per tutti: se la cella scelta dal seme è occupata si passa alla successiva, quindi dipende dalle mosse.
- **Limite 3:** la taratura è su bot, non su persone. I tre numeri (`ROCK_START`, `ROCK_A`, `ROCK_B`) si cambiano in una riga.

## Cassaforte: combinazione visibile a fine serie sbagliata

- Quando la serie finisce per vite perse (tentativi finiti o tempo scaduto), la schermata finale mostra «Il codice che non hai aperto era:» con le cifre esatte. Verificato a 360×700 e 320×560: il codice mostrato coincide con quello dell'ultima cassaforte persa. Nel codice del giorno la combinazione si vedeva già.
- Le casseforti mancate prima dell'ultima mostrano il codice per qualche secondo (come prima). Se vuoi vedere sempre tutti i codici mancati a fine serie, è una riga in più.

## Cassaforte: il codice non aperto, più evidente (seconda correzione)

- **Segnalazione:** «a fine gioco la combinazione non si vede». Nei miei test si vedeva già (provato anche con una partita a velocità normale, tre vite perse con tocchi veri sul tastierino: compare «Il codice che non hai aperto era: 7425»). La causa più probabile è che il file usato fosse una versione precedente. [Ipotesi, non l'ho potuto verificare]
- **Cosa ho comunque migliorato:** a ogni cassaforte mancata il codice compare grande al centro del tabellone per circa 3 secondi (prima: una riga piccola per 2 secondi); a fine serie si vedono l'ultimo codice e gli altri mancati prima («Prima: 123 · 2483»).
- **Numero di versione** in fondo alla home (`BUILD`, ora 2026-10-03.4): se qualcosa non corrisponde a quello che leggi qui, controlla prima quel numero.

## Cassaforte: l'indizio ora si vede e serve (versione 2026-10-03.5)

- **Segnalazione:** «una volta premuto non succede nulla». Il vecchio indizio segnava come escluso un numero assente dal codice: sul tastierino un tasto sbiadito e una riga di testo piccola per due secondi. In pratica invisibile, e di poco aiuto (toglie una cifra su dieci).
- **Ora:** l'indizio regala **una cifra giusta nel posto giusto**. Compare tratteggiata e dorata nella riga che stai scrivendo, con il riquadro «💡 posto 4: il 4», un messaggio, un testo che sale e il tasto lampeggiante. Va scritta lo stesso, così il giocatore resta protagonista. Costo: 120 punti (prima 50); 250 nel codice del giorno (prima 100). Un solo indizio per cassaforte. Nella partita del giorno la posizione è la stessa per tutti e si ritrova se si esce e si rientra.
- **Verificato a 360×700 e 320×560:** posizione scelta valida, cifra tratteggiata nel posto giusto, messaggio e riquadro coerenti, un solo indizio per cassaforte, punti ridotti di 120.
- **Non misurato:** quanto cambi la difficoltà. Una cifra giusta in posizione riduce molto i casi possibili (un codice a 4 cifre ha 5.040 combinazioni, con una cifra nota ne restano circa 504): potrebbe essere troppo conveniente a 120 punti. Il prezzo si cambia in `HINT_COST`. [Ipotesi]

## «← Tutti i giochi» in blu elettrico (versione 2026-10-04.1)

- **Cosa:** bordo blu elettrico 2 px con alone, sfondo azzurro tenue, in partita, nel menu e a fine partita, in tutti e nove i giochi a 360×700. Verificato: colore del bordo, pulsante dentro lo schermo, primo tocco che chiede conferma (bordo rosso), secondo che torna ai giochi, nessuno scorrimento orizzontale.
- **Trovato e corretto durante la prova:** nei menu bassi il pulsante finiva sotto la piega (nel menu di Resto a 360×700 era tagliato; a 320×560 serviva scorrere in 8 giochi su 9) perché avevo aggiunto «Come si gioca». Ora in menu sta in cima alla scheda: 0 casi su 27 con il pulsante fuori vista. In Girasette la scheda del menu non scorreva affatto e usciva dallo schermo (a 320×560 il pulsante era irraggiungibile): ora scorre come negli altri giochi.
- **Limite:** a 320×560 le schede dei menu più lunghe (Resto, Bilancia) continuano a scorrere per arrivare ai pulsanti principali.

## Primo: blocco su cui ci si ferma (versione 2026-10-04.2)

- **Segnalazione:** a fine partita compariva l'ultima sequenza *riuscita* e non quella su cui il gioco si era fermato.
- **Causa:** la schermata finale leggeva l'ultimo blocco frantumato; il blocco in corso quando la torre tocca il soffitto non veniva mai memorizzato.
- **Ora:** «Il gioco si è fermato sul blocco 15. Scomposizione: 15 = 3 × 5.» più «Avevi già tolto: …» se avevi cominciato; se il blocco era già primo: «era già un numero primo, bastava premere «È primo!»». Provato con due partite vere: senza nessun blocco finito e dopo 2 blocchi finiti; il prodotto dei fattori mostrati torna con il numero.

## Primo: anche l'ultimo blocco riuscito (versione 2026-10-04.3)

- Su richiesta la schermata finale mostra **entrambi**: il blocco su cui il gioco si è fermato (con la scomposizione) e, se ne hai finito almeno uno, «Ultimo blocco riuscito: …» in una seconda riga. Provato con due partite vere: senza blocchi finiti compare solo il primo; dopo blocchi finiti compaiono entrambi e i fattori mostrati danno il numero.

## Classifiche pubbliche (versione 2026-10-04.4)

Prova di `tests/classifica.js`: il launcher viene eseguito in un browser vero e le chiamate al server sono girate al **vero schema `docs/classifica.sql` su PostgreSQL 16 locale** (ruolo `anon`, come in Supabase). Non è stato provato contro il progetto Supabase reale: da questo ambiente l'indirizzo non è raggiungibile (il proxy risponde 403). [Certo]

- Classifica vuota: invito a essere il primo; aprirla non registra nessuno.
- Sentiero: percorso ottimo → 500; a fine partita «Sei 1° oggi su 1 (nome generato)»; riga sul server da 500; un solo giocatore registrato; il riepilogo di una sfida già giocata non invia nulla.
- Pannello: periodi Oggi/Settimana/Mese/Sempre, riga «(tu)», Cassaforte vuota, cambio nome (anche sul server).
- Cassaforte: il codice del giorno aperto entra (1.400 con 1 tentativo e nessun indizio); il pulsante «Vedi la classifica» apre la sua classifica; la serie normale non invia nulla.
- Server: 501 su un massimo di 500 rifiutato; segreto sbagliato rifiutato; due invii ravvicinati rifiutati; lettura diretta delle tabelle vietata; un punteggio più basso non sostituisce il migliore; giocatore escluso non compare più.
- Offline: messaggio chiaro, nessun errore in pagina. Sotto automazione senza `nit_pub_test` non parte nessuna chiamata.
- **Trovato durante la prova:** il pannello era dentro la home, quindi invisibile dalla schermata finale di un gioco → spostato fuori dalla home; Esc lo chiude.
- **Non coperto:** nessuna prova con Supabase vero (CORS, chiave pubblicabile, tempi di rete); nessuna prova con molti giocatori contemporanei. [Ipotesi] che il blocco di 60 registrazioni al minuto sia una soglia ragionevole.

## Ottimizzazione: memoria e caratteri (versione 2026-10-04.5)

Misura: per ogni gioco si apre e si esce 12 volte (dopo 3 di riscaldamento) e si contano elementi DOM e ascoltatori ancora in memoria dopo la raccolta dei rifiuti.

- **Primo perdeva memoria:** a ogni apertura restavano circa **194 elementi e 22 ascoltatori**. Causa: un ascoltatore del tema chiaro/scuro (`matchMedia`) e un osservatore di `data-theme` non venivano rimossi all'uscita. Ora i giochi possono registrare una pulizia con `window.onUnmount(...)`, eseguita all'uscita. Dopo: 0 elementi, 0 ascoltatori per ciclo.
- Gli altri otto giochi: 0 elementi e 0 ascoltatori in più per ciclo; restano pochi KB di heap per ciclo (rumore di misura). Nessun `requestAnimationFrame` né intervallo vivo dopo l'uscita.
- **Caratteri:** il foglio di stile di Google Fonts bloccava la prima visualizzazione. Ora si carica senza bloccare (`media="print"` poi `all`) e il testo compare subito con i caratteri di riserva. Non l'ho misurato su rete vera.
- **Non fatto, di proposito:** minificare il file (418 KB, 106 KB compressi). Toglierebbe leggibilità al codice sorgente, che è GPL, per un guadagno piccolo.
- **Non risolto:** i caratteri arrivano ancora da Google (indirizzo IP dei giocatori inviato a Google; offline il gioco usa i caratteri di riserva). Incorporarli nel file lo farebbe crescere e non ho potuto scaricarli da qui.

## Classifiche: scelta del nome da elenco (versione 2026-10-04.6)

- Sesso → animale declinato (Lupo/Lupa, Leone/Leonessa, Volpe, Aquila…) → numero 1-999; anteprima «Comparirai come: Volpe 27» e salvataggio sul server (`nit_set_nick`). Dopo la prima sfida compare anche il pulsante «Scegli il tuo nome».
- Prova (`tests/classifica.js`, schema SQL vero su PostgreSQL locale): nome salvato sul server e sul dispositivo; **le 32 combinazioni del gioco coincidono con quelle del server**; sesso, animale o numero fuori elenco rifiutati. Layout controllato a 360 px.
- **Da rieseguire in Supabase:** tutto `docs/classifica.sql` (rimuove `nit_new_nick`, aggiunge `nit_set_nick`). Finché non lo fai, «Salva» il nome dà errore.

## Dieci (versione 2026-10-05.1)

Prova di `tests/dieci.js` (browser vero, mouse reale per il trascinamento):
- Home con 10 giochi; 400 griglie con 100 cifre da 1 a 9 e somma multipla di 10; la ricerca di tutte le mosse coincide con la forza bruta su 30 griglie con buchi e costa meno di 1 ms.
- Rettangolo con somma 9 neutro e senza effetti; somma 10 verde e le cifre spariscono (+2 punti); oltre 10 rosso; un buco in mezzo vale 0; 4 cifre insieme regalano 1 s; l'aiuto mostra un rettangolo giallo e costa 6 s e sparisce da solo.
- Fine partita: nessuna somma 10 rimasta, tabellone pulito, tempo scaduto; record salvato e registrato nello storico del launcher; gancio di fine partita presente.
- Sfida del giorno: stessa griglia a ogni tentativo (24 mosse possibili nel caso provato). Tastiera: Spazio, freccia, Spazio toglie 3+7.
- Uscita senza residui; a 320×560 il tabellone sta nello schermo senza scorrimento orizzontale; uscendo e rientrando 12 volte: 0 elementi e 0 ascoltatori persi.
- **Trovato e corretto durante la prova:** (1) un fotogramma già in coda dopo l'uscita dal gioco scriveva su elementi non più presenti (errore in pagina); (2) dopo aver premuto «Nuova» o «Aiuto» la tastiera restava intrappolata sul pulsante: ora la partita toglie il focus ai pulsanti.
- **Non provato:** il gioco con un dito vero su un telefono vero (precisione del rettangolo con dita grosse, scorrimento della pagina durante il trascinamento). [Ipotesi] che a 10×10 su 360 px le caselle (circa 30 px) bastino.

## Dieci: griglia nuova quando non ci sono più somme 10 (versione 2026-10-05.2)

- **Perché:** la simulazione con tre bot semplici (600 griglie) dava questo: dopo circa 22-28 mosse non resta nessuna somma 10 e la partita finiva da sola intorno a 55-62 punti, con più di metà del tempo ancora disponibile. Così il tempo non era quasi mai il limite e il punteggio era fermo a circa 60.
- **Ora:** griglia nuova con tempo e punti invariati; tabellone pulito = griglia nuova + 5 s. Il gioco finisce solo a tempo scaduto; a fine partita compare il numero di griglie giocate.
- **Prova** (`tests/dieci.js`): «Nessuna somma 10: nuova griglia» compare, la partita continua con la griglia 2, i punti restano e il tempo anche; con il tabellone pulito +5 s; durante il cambio il gioco è fermo e poi riparte; la griglia 2 della sfida del giorno è uguale a ogni tentativo e diversa dalla 1; la partita finisce solo a tempo scaduto.
- **Effetto da sapere:** i punteggi non sono più limitati a 100, quindi i record fatti prima di questa versione (massimo 100) restano molto bassi e vengono superati subito. Il gioco è ora più una gara di velocità che di pianificazione. [Probabile]

## Dieci: tempo a 150 secondi (versione 2026-10-05.3)

- Su richiesta del titolare il tempo passa da 120 a 150 secondi. Dopo la prova sul suo telefono (Samsung A34): il rettangolo si prende bene e la schermata è leggibile; 120 secondi gli sembravano pochi.
- Con la griglia nuova automatica il tempo è il limite vero: i punteggi salgono per tutti. Chi ha già record fatti a 120 secondi li vede superati più facilmente. [Probabile]
- Il test `dieci.js` non dipende dalla durata (usa tempi impostati a mano).

## Record in ogni gioco e sfida tra amici (versione 2026-10-05.5)

- **Record per gioco** (`tests/record-gioco.js`): in tutti i giochi c'è il pulsante nel menu e a fine partita; con uno storico di prova (oggi 2 partite, migliore 300, somma 500; una partita vecchia da 900) la tabella dà oggi 300 / media 250 / 2 partite e sempre 900 / media 467 / 3 partite; anno e mese contano solo le partite recenti; Esc chiude il pannello senza uscire dal gioco; i due pulsanti affiancati stanno nello schermo a 360 px.
- **Sfida** (`tests/sfida.js`), per ognuno dei 7 giochi: il seme della partita libera è di 5 caratteri; a fine partita il pulsante «Sfida un amico» c'è; codice non valido e codice di un altro gioco danno un messaggio; incollando il codice parte la sfida con banner «Sfida di Anna: batti N punti»; **stesso seme e stessa sequenza di partenza** (Bilancia: primi pesi; Quadrante: carte, bersagli e ostacoli; Primo: primi blocchi; Resto: primi clienti; Raddoppio: tessere iniziali; Cassaforte: codice e lunghezza; Dieci: griglia); sfida persa / battuta con i messaggi giusti; etichetta «Sfida di un amico»; «Rigioca» parte libera con un seme nuovo; il link `#gioco?c=…&n=Nome` apre il gioco con il codice scritto e il nome dell'amico.
- **Cassaforte, controllo più profondo:** i primi 4 codici della serie (094, 517, 4186, 3215) sono identici in due sfide con lo stesso seme.
- **Non provato:** il pulsante «Copia» negli appunti su un telefono vero (in prova compare il testo da copiare a mano); due telefoni diversi che giocano lo stesso seme. [Ipotesi] Che in Quadrante e Raddoppio la sequenza resti identica a parità di mosse.
- **Esclusi per motivi tecnici:** Girasette (in partita libera i pezzi dipendono dalla plancia) e Lampo (casualità a ogni fotogramma e posizioni legate alle dimensioni dello schermo).

## Classifiche pubbliche in tutti i giochi (versione 2026-10-05.6)

Prova di `tests/classifica-giochi.js` con lo schema SQL vero su PostgreSQL locale. Per Bilancia, Quadrante, Primo, Resto, Girasette, Raddoppio, Lampo e Dieci: la sfida del giorno finita invia il punteggio, la schermata finale dice «Sei 1° oggi su 1», un secondo giocatore con meno punti è 2° su 2 con quanti punti mancano al primo; dal pannello **Record** del gioco il pulsante «🌍 Classifica pubblica» apre la classifica giusta con i due nomi e «(tu)»; il pannello Record dice che sono «I TUOI record». Il menu delle classifiche ha 10 voci; nel Sentiero c'è «🌍 Classifica» accanto a «Come si gioca».
- **Non provato:** i tetti dei punteggi (1.000.000, Raddoppio 5.000.000) sono scelti da me e non verificati contro partite vere. [Ipotesi] Un punteggio legittimo molto alto sopra il tetto verrebbe rifiutato e il giocatore non lo vedrebbe in classifica.
- **Rischio noto:** nei giochi senza massimo vero chi invia un numero enorme sotto il tetto vince. Il server non rifà la partita.
