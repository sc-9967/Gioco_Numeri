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
