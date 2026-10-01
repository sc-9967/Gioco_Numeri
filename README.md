# Numeri in Tasca

Sette giochi di numeri da partite brevi, pensati per il telefono. Sono tutti dentro un unico file HTML, `index.html`, senza dipendenze: si apre nel browser.

| Gioco | In breve |
|---|---|
| **Bilancia** | Posa i pesi sui due piatti e pareggiali senza superare la portata di 10. |
| **Quadrante** | Muovi la lancetta di un quadrante a 12 ore con le carte e centra le ore accese prima che si spengano. |
| **Primo** | Scomponi in fattori primi i blocchi che cadono prima che la torre tocchi il soffitto. |
| **Resto** | Alla cassa: calcola il resto e consegnalo con monete e banconote, meglio se con meno pezzi. |
| **Girasette** | Fondi tre o più tessere uguali su una griglia esagonale fino al 7. Finiti i tre pezzi, gli anelli della plancia girano. |
| **Sentiero** | Da in alto a sinistra a in basso a destra di una griglia 5×5: ogni casella somma, moltiplica o sottrae. Trova il percorso che dà il valore più alto. Una serie di 5 griglie al giorno, uguale per tutti. |
| **Raddoppio** | Scorri la griglia 4×4 e fondi le tessere uguali. Le catene di fusioni moltiplicano i punti, il martello rompe una tessera. |

`index.html` è il launcher con tutti e sette i giochi (la copia `Numeri in Tasca.html` è identica). I file singoli dei giochi sono stati eliminati: ogni gioco si apre direttamente con `index.html#bilancia`, `#quadrante`, `#primo`, `#resto`, `#girasette`, `#raddoppio`, `#sentiero`.

## Come provarli

Apri `index.html` in un browser. Su GitHub Pages basta attivare Pages sul ramo `main`.

**Nome del giocatore:** nella schermata iniziale va scritto il proprio nome (massimo 20 caratteri) prima di giocare. Resta salvato sul dispositivo e compare nei risultati che si condividono (Bilancia, Quadrante, Primo, Resto, Raddoppio, Sentiero). Non viene mai incluso nelle statistiche anonime inviate all'autore. Con un link diretto (`#sentiero?c=…`) si apre la home finché il nome non è stato scritto.

Ogni gioco ha record locale, sfida del giorno (stessa sequenza per tutti, risultato condivisibile) e rigioco immediato.

Nel launcher, l'ordine delle carte è casuale per ogni persona e la pagina conta, in forma anonima, aperture, partite, giorni di gioco e minuti per gioco. Il conteggio automatico verso un database funziona solo quando la pagina è ospitata come Artifact su claude.ai. In ogni altro caso (file locale, GitHub Pages) compare il pulsante "Copia le mie statistiche", che prepara un testo da inviare a mano.

## Girasette

Puzzle di fusione su griglia esagonale (raggio 3, 37 celle, coordinate assiali).

- Tre o più tessere adiacenti con lo stesso valore si fondono in una sola, di valore + 1, nella cella di rilascio. La fusione può proseguire a catena.
- Fondendo tre o più 7, la cella centrale e le sei vicine esplodono.
- Regola propria del gioco: finiti i tre pezzi, i tre anelli esterni ruotano di un passo (quello interno e quello esterno in un verso, quello medio nel verso opposto). Le fusioni causate dal giro valgono doppio. Con un solo pezzo rimasto, delle frecce mostrano dove andrà ogni tessera.
- Pezzi doppi: si ruotano toccandoli, con il pulsante "Ruota" o con il tasto R.

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
- **Limite:** i punteggi non sono verificabili. Va bene tra amici, non per una classifica pubblica.

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
node raddoppio-logica.js      # scorrimento, fusioni, undo, catena, martello, vittoria, game over
node launcher-raddoppio.js    # Raddoppio dentro il launcher
node sentiero-logica.js       # percorso ottimo, generatore, codici sfida, record per periodo
node sentiero-partita.js      # partita completa, una sola sfida al giorno, condivisione
node launcher-sentiero.js     # Sentiero dentro il launcher
node launcher-nome.js         # nome obbligatorio, testi condivisi, statistiche anonime
```

Risultati e misure del 30/09/2026 in `docs/risultati-test.md`. L'analisi dei giochi simili è in `docs/giochi-simili.md`.

## Note

- Il gioco "Cassaforte", descritto nelle prime sessioni di lavoro, non è stato recuperato: non esiste in nessuna delle copie disponibili.
- Il riquadro del contributo PayPal è nascosto. Per riattivarlo, in `index.html` imposta `SHOW_DONATE = true`.

Copyright © 2026 Silvio Chiaverini. Licenza GNU GPL v3: vedi il file `LICENSE`.
