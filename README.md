# Numeri in Tasca

Cinque giochi di numeri da partite brevi, pensati per il telefono. Ogni gioco è un singolo file HTML, senza dipendenze: si apre nel browser.

| Gioco | File | In breve |
|---|---|---|
| **Bilancia** | `bilancia.html` | Posa i pesi sui due piatti e pareggiali senza superare la portata di 10. |
| **Quadrante** | `quadrante.html` | Muovi la lancetta di un quadrante a 12 ore con le carte e centra le ore accese prima che si spengano. |
| **Primo** | `primo.html` | Scomponi in fattori primi i blocchi che cadono prima che la torre tocchi il soffitto. |
| **Resto** | `resto.html` | Alla cassa: calcola il resto e consegnalo con monete e banconote, meglio se con meno pezzi. |
| **Girasette** | `girasette.html` | Fondi tre o più tessere uguali su una griglia esagonale fino al 7. Finiti i tre pezzi, gli anelli della plancia girano. |

`index.html` è il launcher con tutti e cinque i giochi (la copia `Numeri in Tasca.html` è identica).

## Come provarli

Apri `index.html` (o un singolo file) in un browser. Su GitHub Pages basta attivare Pages sul ramo `main`.

Ogni gioco ha record locale, sfida del giorno (stessa sequenza per tutti, risultato condivisibile) e rigioco immediato.

Nel launcher, l'ordine delle carte è casuale per ogni persona e la pagina conta, in forma anonima, aperture, partite, giorni di gioco e minuti per gioco. Il conteggio automatico verso un database funziona solo quando la pagina è ospitata come Artifact su claude.ai. In ogni altro caso (file locale, GitHub Pages) compare il pulsante "Copia le mie statistiche", che prepara un testo da inviare a mano.

## Girasette

Puzzle di fusione su griglia esagonale (raggio 3, 37 celle, coordinate assiali).

- Tre o più tessere adiacenti con lo stesso valore si fondono in una sola, di valore + 1, nella cella di rilascio. La fusione può proseguire a catena.
- Fondendo tre o più 7, la cella centrale e le sei vicine esplodono.
- Regola propria del gioco: finiti i tre pezzi, i tre anelli esterni ruotano di un passo (quello interno e quello esterno in un verso, quello medio nel verso opposto). Le fusioni causate dal giro valgono doppio. Con un solo pezzo rimasto, delle frecce mostrano dove andrà ogni tessera.
- Pezzi doppi: si ruotano toccandoli, con il pulsante "Ruota" o con il tasto R.

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
node giochi-singoli.js        # i cinque file aperti da soli
```

Risultati e misure del 30/09/2026 in `docs/risultati-test.md`. L'analisi dei giochi simili è in `docs/giochi-simili.md`.

## Note

- Il gioco "Cassaforte", descritto nelle prime sessioni di lavoro, non è stato recuperato: non esiste in nessuna delle copie disponibili.
- Il riquadro del contributo PayPal è nascosto. Per riattivarlo, in `index.html` imposta `SHOW_DONATE = true`.

Copyright © 2026 Silvio Chiaverini. Vedi il file `LICENSE`.
