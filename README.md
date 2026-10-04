# Numeri in Tasca

Nove giochi di numeri da partite brevi, pensati per il telefono. Sono tutti dentro un unico file HTML, `index.html`, senza dipendenze: si apre nel browser.

| Gioco | In breve |
|---|---|
| **Bilancia** | Posa i pesi sui due piatti e pareggiali senza superare la portata di 10. |
| **Quadrante** | Muovi la lancetta di un quadrante a 12 ore con le carte e centra le ore accese prima che si spengano. |
| **Primo** | Scomponi in fattori primi i blocchi che cadono prima che la torre tocchi il soffitto. |
| **Resto** | Alla cassa: calcola il resto e consegnalo con monete e banconote, meglio se con meno pezzi. |
| **Girasette** | Fondi tre o più tessere uguali su una griglia esagonale fino al 7. Finiti i tre pezzi, gli anelli della plancia girano. |
| **Sentiero** | Da in alto a sinistra a in basso a destra di una griglia 5×5: ogni casella somma, moltiplica o sottrae. Trova il percorso che dà il valore più alto. Una serie di 5 griglie al giorno, uguale per tutti. |
| **Lampo** | Gioco di riflessi: tocca i numeri in movimento nell'ordine giusto prima che finisca il tempo. Combo, febbre, bonus e regole diverse. |
| **Cassaforte** | Scassina un codice di cifre tutte diverse: dopo ogni tentativo sai quante cifre sono giuste al posto giusto (●) e quante giuste ma altrove (○). Serie di 20 casseforti con tre vite e codice del giorno uguale per tutti. |
| **Dieci** | Trascina un rettangolo sui numeri di una griglia 10×10: se la somma di quelli dentro è 10, spariscono (i buchi valgono 0). Due minuti, un punto per numero tolto; togliere 4 o più numeri insieme regala secondi. Aiuto a pagamento (−6 s) e sfida del giorno. |
| **Raddoppio** | Scorri la griglia 4×4 e fondi le tessere uguali. Le catene di fusioni moltiplicano i punti, il martello rompe una tessera. |

`index.html` è il launcher con tutti e nove i giochi (la copia `Numeri in Tasca.html` è identica). I file singoli dei giochi sono stati eliminati: ogni gioco si apre direttamente con `index.html#bilancia`, `#quadrante`, `#primo`, `#resto`, `#girasette`, `#raddoppio`, `#sentiero`, `#lampo`, `#cassaforte`.

## Come provarli

Apri `index.html` in un browser. Su GitHub Pages basta attivare Pages sul ramo `main`.

**Nome del giocatore:** nella schermata iniziale va scritto il proprio nome (massimo 20 caratteri) prima di giocare. Resta salvato sul dispositivo e compare nei risultati che si condividono (Bilancia, Quadrante, Primo, Resto, Raddoppio, Sentiero). Non viene mai incluso nelle statistiche anonime inviate all'autore. Con un link diretto (`#sentiero?c=…`) si apre la home finché il nome non è stato scritto.

**Uscire da una partita:** in ogni gioco, in fondo alla schermata, c'è "← Tutti i giochi". In partita chiede una seconda pressione ("Sicuro? Esci dalla partita (non conta)", si annulla da solo dopo 2,5 secondi); dal menu o dalla fine partita esce subito. Una partita abbandonata non viene registrata nei record.

**Record salvati:** ogni partita conclusa viene registrata sul dispositivo per gioco e per giorno (giorno di Roma). Il pulsante "I miei record" mostra, per ciascun gioco, il migliore di oggi, della settimana (da lunedì), del mese, dell'anno e di sempre. La stessa riga (oggi, settimana, mese, sempre) compare dentro ogni gioco, nel menu e a fine partita. Il record "di sempre" non scende mai sotto quello già salvato dal gioco prima dell'introduzione dello storico. Per non perderli (cambio telefono, dati del sito cancellati) c'è il **backup**: "Copia backup" o "Scarica file" producono un testo che inizia con `NIT1.`; "Ripristina" lo incolla e lo fonde con i record presenti, tenendo sempre il valore più alto. Il browser viene anche invitato a proteggere i dati dalla cancellazione automatica. Se non permette di salvare (navigazione privata) compare un avviso. I record restano sul dispositivo: una classifica condivisa richiederebbe un server.

Ogni gioco ha record locale, sfida del giorno (stessa sequenza per tutti, risultato condivisibile) e rigioco immediato.

Nel launcher, l'ordine delle carte è casuale per ogni persona e la pagina conta, in forma anonima, aperture, partite, giorni di gioco e minuti per gioco. Il conteggio automatico verso un database funziona solo quando la pagina è ospitata come Artifact su claude.ai. In ogni altro caso (file locale, GitHub Pages) compare il pulsante "Copia le mie statistiche", che prepara un testo da inviare a mano.

## Girasette

Puzzle di fusione su griglia esagonale (raggio 3, 37 celle, coordinate assiali).

- Tre o più tessere adiacenti con lo stesso valore si fondono in una sola, di valore + 1, nella cella di rilascio. La fusione può proseguire a catena.
- Fondendo tre o più 7, la cella centrale e le sei vicine esplodono.
- Regola propria del gioco: finiti i tre pezzi, i tre anelli esterni ruotano di un passo (quello interno e quello esterno in un verso, quello medio nel verso opposto). Le fusioni causate dal giro valgono doppio. Con un solo pezzo rimasto, delle frecce mostrano dove andrà ogni tessera.
- Pezzi doppi: si ruotano toccandoli, con il pulsante "Ruota" o con il tasto R.
- **Partita del giorno:** gli stessi pezzi, nello stesso ordine, per tutti i giocatori (ogni riserva ha un seme ricavato dalla data di Roma e non guarda la plancia, quindi non cambia con le mosse). Per questo in quella modalità manca l'aiuto della partita libera, che pesca spesso i valori già presenti. Si può rigiocare; il record del giorno ha una chiave propria e non tocca il record della partita libera.
- **La difficoltà cresce: i sassi.** Fino alla 12ª riserva circa nessun sasso; poi arrivano sassi grigi che non si fondono mai, girano con il loro anello e occupano una cella per sempre. All'inizio uno ogni 7 riserve circa, alla fine uno o più a riserva. Si rompono solo con un'esplosione di 7 che li raggiunge. In alto una riga annuncia quando arriva il prossimo ("🪨 Un sasso tra 2 riserve"). Quando la plancia è piena la partita finisce: prima, con le stesse regole, un giocatore bravo non perdeva mai. Nella partita del giorno il calendario è uguale per tutti e le posizioni hanno un seme (se la cella scelta è occupata si scorre alla successiva). I valori sono in `ROCK_START`, `ROCK_A`, `ROCK_B` all'inizio del gioco.
- **Fine partita:** tessera massima, giri della plancia e catena più lunga; "Copia risultato" con il nome (partita libera o del giorno) e il pulsante per passare all'altra modalità.

## Raddoppio

Puzzle a scorrimento su griglia 4×4, della stessa famiglia di regole dei classici "2048" (vedi `docs/giochi-simili.md`).

- Le tessere scivolano fino in fondo; due tessere uguali adiacenti si fondono e raddoppiano. Ogni tessera si fonde al massimo una volta per mossa: `[2,2,2,2]` verso sinistra dà `[4,4,0,0]`.
- Dopo ogni mossa valida compare un 2 (90%) o un 4 (10%).
- **Catena:** fusioni in mosse consecutive moltiplicano i punti (×2 dalla seconda, ×3 dalla quarta, ×4 dalla sesta). Una mossa senza fusioni azzera la catena.
- **Martello:** ogni nuova tessera record da 64 in su regala un martello (massimo 3). Si tocca il pulsante e poi una tessera per romperla.
- **Annulla:** ripristina anche il generatore casuale, quindi rifare la stessa mossa dà lo stesso risultato (non serve a "ritirare i dadi").
- Vittoria a 2048 con possibilità di continuare; game over solo senza mosse e senza martelli.
- Comandi: frecce o WASD, swipe, Z per annullare, H per il martello.

## Sentiero

Puzzle di calcolo: griglia 5×5, si parte da 1 in alto a sinistra e si arriva in basso a destra muovendosi solo a destra o in basso. Ogni casella applica +n, ×n o −n. Ci sono 70 percorsi possibili.

- **Punteggio:** per ogni griglia è la percentuale del valore ottimo (0-100); una serie di 5 griglie vale al massimo 500. Finita la griglia si vede il percorso ottimo in blu.
- **Sfida del giorno:** stesse 5 griglie per tutti (il seme è la data di Roma), un solo tentativo ufficiale al giorno. Più allenamenti liberi con griglie casuali.
- **Record** per giorno, settimana (da lunedì), anno e sempre, con migliore, media e giorni giocati, più la serie di giorni consecutivi. Sono calcolati dallo storico salvato **sul dispositivo**: senza un server non esiste una classifica condivisa.
- **Con gli amici, senza server:** il risultato si copia come testo con le caselle colorate; dopo un allenamento il testo contiene un codice sfida `SEN-…-punti` (e, se la pagina è online, un link `#sentiero?c=…`). Chi lo incolla nella schermata iniziale gioca le stesse 5 griglie e vede se ha battuto il punteggio.
- **Limite:** i punteggi non sono verificabili. Va bene tra amici; la classifica pubblica (sotto) li limita ma non li ricalcola.
- **Il tuo percorso è rosa tenue:** anello rosa e numero d'ordine (1, 2, 3…) sulle caselle toccate, senza linee. Alla fine della griglia il percorso ottimo compare in blu; dove i due coincidono si vedono entrambi gli anelli (rosa fuori, blu dentro).

## Lampo

Gioco di riflessi su campo in movimento. Si toccano i numeri nell'ordine della regola: Classico (1, 2, 3…), e come regola del giorno multipli di 3, pari o alla rovescia da 30.

- **Tempo:** cala di continuo; un colpo giusto ne restituisce sempre meno col passare dei secondi, uno sbagliato ne toglie 8 e azzera la combo. Quindi la partita finisce sempre (con 1,4 colpi al secondo e nessun errore dura circa 5-6 minuti).
- **Punti:** base crescente fino al 40° colpo, moltiplicata dalla combo (tetto ×5); la febbre (a 10 di fila, 8 s, poi pausa di 20 s) e il fuoco aggiungono +1 ciascuno.
- **Bonus nel campo:** stella (+15 s, non fa avanzare la sequenza), scudo (para un errore), ghiaccio (rallenta il tempo), fuoco, bomba (spazza i numeri vicini).
- **Ritmo:** conto alla rovescia 3-2-1, fasi ogni 25 secondi (più numeri, più veloci), battito e bordo rosso quando il tempo sta finendo, riconoscimenti a 5, 10, 20, 30 e 50 di fila, e a fine partita la distanza dal record.
- Pausa (anche con il tasto P e quando si cambia scheda).

## Cassaforte

Gioco di deduzione (la famiglia di "Bulls and Cows" e Mastermind). Il codice ha cifre tutte diverse; dopo ogni tentativo il gioco dice solo *quante* cifre sono giuste al posto giusto (●) e *quante* giuste ma fuori posto (○), non quali.

- **Serie:** fino a 20 casseforti, con codici di 3, 4, 5 e poi 6 cifre, tre vite e un tempo per ogni cassaforte (che dopo l'ottava cala). Tentativi finiti o tempo scaduto costano una vita. La serie finisce sempre: per le vite, per il tempo o dopo la ventesima cassaforte.
- **Punti:** (100 × cifre + 40 × tentativi rimasti + fino a 100 di tempo − 50 se si usa l'indizio) × moltiplicatore. Il moltiplicatore sale di 0,25 per ogni cassaforte aperta di fila, con tetto ×5.
- **Fine serie sbagliata:** la schermata finale mostra la combinazione esatta dell'ultima cassaforte che non hai aperto (dopo l'ultima vita persa, per tentativi finiti o per tempo). Durante la partita, ogni cassaforte mancata mostra il codice grande al centro per circa 3 secondi, e a fine serie compaiono anche i codici mancati prima.
- **Codice del giorno:** 4 cifre, 8 tentativi, senza limite di tempo, uguale per tutti (seme dalla data di Roma). Una sola partita al giorno; se si esce a metà la partita riprende dal punto in cui era. A fine partita si copia un risultato senza spoiler (quadratini verdi e gialli).
- **Aiuti:** tastierino a schermo (anche tastiera fisica), modo "Note" per segnare le cifre escluse e **un indizio** per cassaforte: regala una cifra giusta nel posto giusto (compare tratteggiata nella riga che stai scrivendo, con un riquadro "posto 3: il 7"). Costa 120 punti (250 nel codice del giorno); va scritta lo stesso.
- **Ritmo:** le tessere si girano una a una con il suono del meccanismo, i pallini si accendono, la cassaforte si apre con monete e un messaggio a ogni serie di 3, 6, 10 e 15; vibrazione sul telefono; rispetta "riduci animazioni".
- Origine: il prototipo ricevuto ("La cassaforte a indizi") colorava di verde la cifra sbagliata. È stato riscritto da zero: stesso tema, regole e struttura proprie.

## Calamita: serie, obiettivo e gancio di fine partita

Uno strato del launcher che vale per tutti i giochi, senza toccare le loro regole. Tutto si ricava dallo storico dei record, quindi non servono nuovi dati e il backup lo porta con sé.

- **Serie di giorni** (giorno di Roma): quanti giorni di fila hai giocato almeno una partita, con il record personale e un riconoscimento a 3, 7, 14, 30 e 100 giorni. Un giorno vuoto la azzera. Una partita finita a 0 punti non conta.
- **Obiettivo del giorno:** 3 giochi diversi, con tre pallini sulla home e il segno "✓ oggi" sulle carte già giocate. Serve anche a far provare giochi che un tester non aveva aperto.
- **Gioca ora:** un pulsante che propone un gioco non ancora giocato oggi, scegliendo tra quelli che conosci meno.
- **Gancio di fine partita** (sotto "Rigioca", così il pulsante non si sposta): se hai battuto il record di oggi, della settimana o di sempre (con coriandoli e vibrazione per gli ultimi due); altrimenti quanti punti ti mancano per il primo record da superare, con "Quasi!" se sei entro il 10%. Poi quante partite hai fatto oggi, la serie, l'obiettivo e il pulsante "Prossimo: …".
- **Copia risultato** in tutti i giochi: dove il gioco lo offre solo per la sfida del giorno (o non lo offre, come Girasette) lo aggiunge il launcher.
- **Invio** nella schermata finale = "Rigioca".
- Nessun avviso, nessuna notifica, nessun conto alla rovescia finto: la serie si perde solo davvero.

## Istruzioni per bambini

Ogni gioco ha le istruzioni scritte per un bambino di 5 anni: frasi corte (in media 9-14 parole), parole semplici, un'emoji per ogni passo e un "trucco" finale. Compaiono da sole la prima volta che si apre un gioco e si riaprono quando si vuole con "❓ Come si gioca", nel menu e a fine partita.

- **Leggi per me:** il pulsante legge le istruzioni ad alta voce in italiano con la voce del telefono o del browser (un bambino di 5 anni di solito non sa ancora leggere). Esc chiude; uscendo dal gioco la voce si ferma.
- **Limite:** capire le regole non vuol dire saper giocare: Primo (divisioni), Resto (soldi) e Sentiero (somme e moltiplicazioni) richiedono matematica da scuola elementare.
- Il testo sta nella tabella `HOWTO` del launcher, una voce per gioco: si cambia lì.

## Navigazione: «← Tutti i giochi» e schermata finale di Primo

- **«← Tutti i giochi» blu elettrico:** il pulsante ha un bordo blu elettrico (#1e6bff) con un leggero alone, in partita (largo come lo schermo, sotto i comandi), nel menu di ogni gioco (in cima alla scheda, così si vede anche sugli schermi bassi dove il menu scorre) e nella schermata finale. In partita il primo tocco chiede conferma (bordo rosso), il secondo esce.
- **Primo, fine partita:** la schermata finale mostra il blocco su cui il gioco si è fermato (non l'ultimo riuscito), con la scomposizione completa, per esempio «Il gioco si è fermato sul blocco 84. Scomposizione: 84 = 2 × 2 × 3 × 7. Avevi già tolto: 2». Se ne hai finito almeno uno, sotto compare anche «Ultimo blocco riuscito: …».

## Test

I test usano Playwright e si trovano in `tests/`:

```sh
cd tests
npm install
sh prepara.sh                 # crea nit-test.html e la cartella shots/
node smoke.js                 # i quattro giochi del launcher, input casuali
node bots-esperti.js          # bot che non sbagliano, a velocità umana
node girasette-logica.js      # anelli, giro, moltiplicatori
node girasette-giro.js        # fusione causata dal giro
node girasette-bot.js         # partite automatiche di Girasette
node launcher-girasette.js    # Girasette dentro il launcher
node girasette-giorno.js      # partita del giorno (stessi pezzi per tutti), statistiche, condivisione
node girasette-durata.js      # sassi: regole, calendario, durata delle partite con giocatori automatici
node girasette-sassi.js       # sassi nel gioco vero: arrivo, annuncio, fine partita
node raddoppio-logica.js      # scorrimento, fusioni, undo, catena, martello, vittoria, game over
node launcher-raddoppio.js    # Raddoppio dentro il launcher
node sentiero-logica.js       # percorso ottimo, generatore, codici sfida, record per periodo
node sentiero-partita.js      # partita completa, una sola sfida al giorno, condivisione
node launcher-sentiero.js     # Sentiero dentro il launcher
node sentiero-percorso.js     # percorso rosa tenue: anelli, numeri d'ordine, indietro, fine griglia
node lampo.js                 # regole, punteggio, partita perfetta, bonus, launcher, schermi
node cassaforte.js            # regole, punteggio, partite complete del bot
node launcher-cassaforte.js   # tastierino, note, indizio, vite, tempo, codice del giorno, record, schermi
node launcher-calamita.js    # serie, obiettivo, gancio di fine partita, coriandoli, condivisione
node istruzioni.js            # istruzioni per bambini: prima apertura, riapertura, lettura, lunghezza delle frasi
node donazione.js             # pulsante Dona visibile, link sicuro
node tutti-i-giochi.js        # pulsante blu elettrico in partita, nel menu e a fine partita
node primo-ultimo.js          # Primo: a fine partita il blocco rimasto e la sua scomposizione
node launcher-nome.js         # nome obbligatorio, testi condivisi, statistiche anonime
node launcher-uscita.js       # uscita dalla partita in ogni gioco, record oggi/settimana/mese/anno/sempre
node launcher-record.js       # storico, periodi, backup e ripristino, avviso archiviazione
```

Risultati e misure del 30/09/2026 in `docs/risultati-test.md`. L'analisi dei giochi simili è in `docs/giochi-simili.md`.

## Note

- Il gioco "Cassaforte", descritto nelle prime sessioni di lavoro, non è stato recuperato: non esiste in nessuna delle copie disponibili.
- Il riquadro del contributo PayPal è nascosto. Per riattivarlo, in `index.html` imposta `SHOW_DONATE = true`.

Copyright © 2026 Silvio Chiaverini. Licenza GNU GPL v3: vedi il file `LICENSE`. Scelte su licenza, donazioni, pubblicità e bambini: `docs/decisioni.md`. In fondo alla home c'è il numero di versione (`BUILD` in `index.html`): serve a sapere quale file si sta usando.

## Classifiche pubbliche (versione 2026-10-04.6)

- **Cosa è pubblico:** la **sfida del giorno di ognuno dei dieci giochi** (stessa partita per tutti, quindi i punteggi sono confrontabili). Primi 10 per oggi, settimana (da lunedì), mese e sempre, con il nome scelto da chi ha fatto il punteggio, più la tua posizione. Si arriva da «Classifiche» in home (menu a tendina), da «Vedi la classifica» a fine sfida, da «🌍 Classifica pubblica» nel pannello Record di ogni gioco e, nel Sentiero, dal pulsante «🌍 Classifica». Il pannello «🏆 Record» dentro i giochi è invece **personale** (solo questo dispositivo).
- **Dove:** database Supabase del progetto. Lo schema e le protezioni sono in `docs/classifica.sql`, da eseguire una volta nello SQL Editor.
- **Privacy:** nessun account. Il dispositivo genera un segreto casuale (salvato solo qui; sul server resta solo l'impronta). Il nome in classifica lo **componi tu da un elenco**: sesso (maschio/femmina), animale declinato (Lupo/Lupa, Leone/Leonessa…) e numero da 1 a 999, per esempio «Volpe 27». Il server compone il nome: non si scrive testo libero, quindi niente insulti né dati personali. Fino alla scelta si ha un nome casuale.
- **Sicurezza:** le tabelle non sono leggibili né scrivibili dal browser; si possono solo chiamare 4 funzioni. Il server decide il giorno (Roma), scarta punteggi fuori scala, accetta un invio ogni 8 secondi e 200 al giorno per giocatore, tiene il migliore del giorno, può escludere un giocatore.
- **Massimi:** Sentiero 500, Cassaforte 1.400, Dieci 3.000. Negli altri sette giochi il punteggio non ha un massimo vero: il tetto nel database è volutamente largo (1.000.000; Raddoppio 5.000.000) e blocca solo numeri assurdi.
- **Limite onesto:** il server **non rifà la partita**. Un punteggio falso entro il massimo passa. Per rimuoverlo: istruzioni di moderazione in fondo a `docs/classifica.sql`.
- **Offline:** se il server non risponde il gioco funziona come prima e compare un avviso; il punteggio non viene rinviato in seguito.
- **Non pubblico:** serie normali, partite libere e sfide tra amici. Accendere un'altra classifica = una riga in `nit_boards` + il gioco che segna la partita (`over.dataset.board`).
- Sotto test automatici (`navigator.webdriver`) il launcher non chiama il server vero, salvo `nit_pub_test=1`.

## Dieci (versione 2026-10-05.2)

- **Regola:** griglia 10×10 di cifre da 1 a 9. Si trascina un rettangolo (dito, mouse, oppure frecce e Spazio): il cerchietto mostra la somma. A 10 il rettangolo diventa verde e, rilasciando, le cifre spariscono. Oltre 10 diventa rosso. I posti vuoti valgono 0.
- **Punteggio:** una cifra tolta = un punto. Togliere 4 o più cifre in una mossa regala 1 secondo, 6 o più ne regalano 2. Il punteggio non ha un massimo: dipende da quante griglie si fanno in 150 secondi.
- **Griglia nuova:** quando non resta nessun rettangolo con somma 10, arriva una griglia nuova (compare «Nessuna somma 10: nuova griglia»): **tempo e punti restano**. Se si pulisce tutto il tabellone, la griglia nuova regala anche **+5 secondi**. Il gioco finisce solo a tempo scaduto.
- **Tempo:** 150 secondi (due minuti e mezzo, scelto dal titolare dopo la prova). Se la pagina resta in secondo piano il tempo non scorre. «Aiuto» mostra un rettangolo valido e costa 6 secondi.
- **Sfida del giorno:** stessa **sequenza** di griglie per tutti (seme = data di Roma e numero della griglia), con più tentativi e il migliore del giorno.
- **Non ha classifica pubblica:** il server non potrebbe verificare il punteggio.

## Record dentro ogni gioco e sfida tra amici (versione 2026-10-05.5)

- **Pulsante «🏆 Record»** nel menu e nella schermata finale di ogni gioco (nel Sentiero resta il suo pulsante «Record»). Mostra, per oggi, settimana (da lunedì), mese, anno e sempre: **migliore, media e numero di partite**, più la serie di giorni. I dati sono quelli dello storico sul dispositivo; il «migliore di sempre» non scende mai sotto il record già salvato dal gioco.
- **Sfida un amico** in 7 giochi: Bilancia, Quadrante, Primo, Resto, Raddoppio, Cassaforte e Dieci (il Sentiero ha il suo codice `SEN-…`). Funziona come il Sentiero:
  1. a fine partita libera il pulsante **«🤝 Sfida un amico»** copia un testo con il codice `PREFISSO-seme-punti`, per esempio `DIE-k3f9a-412`, e, se la pagina è online, un link `#dieci?c=…`;
  2. l'amico incolla il codice in **«🤝 Sfida un amico»** nel menu del gioco, oppure apre il link: parte una partita con **lo stesso seme**, quindi la stessa sequenza casuale di partenza, con un avviso «Sfida di Anna: batti 412 punti»;
  3. a fine partita compare il confronto: «Hai battuto la sfida…», «Pareggio…» o «Sfida persa… (ti mancano N)».
- Prefissi: BIL, QUA, PRI, RES, RAD, CAS, DIE. «Rigioca» dopo una sfida avvia una partita libera nuova.
- **Cosa significa «stessa partita»:** stesso seme del generatore casuale, come nella sfida del giorno. Nei giochi in cui le scelte del giocatore cambiano quale casella o posto viene scelto (per esempio Quadrante) la sequenza è la stessa ma il tabellone può divergere secondo le mosse. I punteggi nel codice non sono verificabili.
- **Non hanno la sfida: Girasette e Lampo.** Girasette in partita libera pesca i pezzi guardando la plancia (un aiuto): per renderla riproducibile bisognerebbe toglierlo e cambierebbe la difficoltà. In Lampo i numeri si muovono con valori casuali a ogni fotogramma e le posizioni dipendono dalle dimensioni dello schermo, quindi due telefoni non vedrebbero mai la stessa partita.

## Classifiche in tutti i giochi (versione 2026-10-05.6)

- Ora ogni gioco ha la sua classifica pubblica della sfida del giorno: bilancia-giorno, quadrante-giorno, primo-giorno, resto-giorno, girasette-giorno, raddoppio-giorno, lampo-giorno, dieci-giorno (più sentiero-giorno e cassaforte-giorno). Il database si aggiorna con l'ultimo `docs/classifica.sql` (basta anche solo il blocco `insert into public.nit_boards`).
- **Meno a prova di imbroglio dove il punteggio non ha un massimo.** Se un punteggio è sospetto: istruzioni di moderazione in fondo a `docs/classifica.sql`.
