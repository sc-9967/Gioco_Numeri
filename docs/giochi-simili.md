# Giochi simili e rischio di somiglianza

Verifica del 01/10/2026, con ricerche sul web. Non è una consulenza legale.

## Cosa esiste già

Il primo prototipo di Girasette, chiamato "Make 7", coincideva con titoli già in commercio:

- **Make7! Hexa Puzzle** (BitMango): si trascinano esagoni numerati sulla plancia, si fondono tre numeri uguali per salire di uno, e quando si uniscono dei sette diventano bombe. Disponibile su App Store, Google Play e Amazon Appstore.
- **Hexa Puzzle: Make 7**, **Merge Hexa Blocks & Make 7**, **Merge Hexa**, **Hex Merge!**: stesso schema o simile.
- **Hextris**: gioco diverso (un esagono centrale che gira, segmenti che cadono), ma l'unico trovato in cui la rotazione è la meccanica centrale.

Nella ricerca non è emerso un gioco in cui gli anelli della plancia ruotano dopo ogni gruppo di pezzi e le fusioni causate dal giro valgono doppio. Questo non prova che non esista.

## Cosa dicono le fonti sul diritto d'autore

- Regole e meccaniche di gioco, da sole, non sono protette dal diritto d'autore negli Stati Uniti (distinzione tra idea ed espressione). Sono protetti grafica, testi, codice, musica; il nome può essere un marchio.
- Il caso Tetris Holding v. Xio Interactive mostra che copiare anche l'aspetto e l'impressione complessiva può portare a una condanna, anche senza copiare il codice.
- Il diritto europeo e italiano può differire.

## Decisioni prese

- Il prototipo "Make 7" non è incluso in questo repository.
- Il gioco è stato rinominato **Girasette** (nome non trovato in uso, ma da verificare su EUIPO, UIBM e negli store).
- Aggiunta la regola degli anelli che girano, con aspetto grafico diverso (tessere piatte con incisione, anelli di tinte diverse).

## Raddoppio: è un clone della famiglia "2048"

Raddoppio ha le stesse regole di base di 2048. Non è un caso fortuito: è la stessa meccanica.

- **Genealogia.** "2048" (Gabriele Cirulli, marzo 2014, licenza MIT) è nato come clone di "1024!", a sua volta clone di **Threes** (Sirvo, 2014, a pagamento). I creatori di Threes hanno denunciato pubblicamente l'ondata di copie.
- **Cosa è copiabile.** Come per Girasette, le regole da sole non sono protette negli Stati Uniti; lo sono grafica, codice e nome. Il codice di Raddoppio è scritto da zero (non deriva dal repository di Cirulli) e la grafica è diversa (tema verde petrolio e corallo, tessere con gradiente e bagliore, palette propria).
- **Nome.** Si chiama Raddoppio, non "2048". Il numero 2048 compare solo come traguardo di vittoria. Già nel 2014 Threes venne rimosso per poche ore da Google Play perché usava "2048" come parola chiave: evitare quel termine nelle schede degli store.
- **Aggiunte, e quanto valgono.** Il martello e l'annulla esistono già in molte varianti (2048 Legends, 2048 Merge Puzzle, Merge Block). Anche i moltiplicatori di combo esistono in vari titoli di fusione. Non sono quindi novità assolute. Le parti proprie sono la **catena legata alle mosse consecutive**, il **martello guadagnato con le tessere record**, l'**annulla che ripristina il generatore casuale** e la **sfida del giorno**. Non è stata trovata una variante con esattamente questa combinazione, ma la ricerca non lo prova.
- **Rischio residuo.** [Probabile] Basso sul piano legale se resta gratuito, con nome e grafica propri. Più alto se lo si pubblica negli store: lì contano le segnalazioni per "copycat" e il giudizio sull'impressione complessiva.

## Sentiero: cosa esiste e cosa no

- **Idea scartata.** Mettere numeri casuali in ordine crescente senza spostarli è già saturo: [20 Number Challenge](https://play.gameonfamily.com/number-challenge/), [Numble](https://www.numble.dev/en), [Ordrly](https://ordrlygame.com/), [Ordinal](https://www.ordinal.fyi/). Le equazioni quotidiane sono di [Nerdle](https://www.nerdlegame.com/), che ha anche duelli.
- **Il più vicino:** [Vector](https://apps.apple.com/us/app/vector-math-puzzle/id6757619221), una griglia in cui si massimizza un numero con le quattro operazioni. Differenze: lì si visitano tutte le caselle, si parte da qualsiasi punto, in 8 direzioni, e l'operazione dipende dalla direzione del passo. In Sentiero l'operazione sta nella casella, il percorso è monotono (solo destra e basso) e il punteggio è la percentuale dell'ottimo.
- **Meccanica generale.** Il cammino su griglia con somma massima è un esercizio classico di programmazione dinamica (non è un'opera protetta). Non è stata trovata una versione giornaliera con operazioni per casella e punteggio in percentuale dell'ottimo; la ricerca non lo esclude. [Ipotesi]
- **Rischio:** basso. Nome, grafica (carta millimetrata) e regole sono propri.

## Lampo: il genere "tocca in ordine"

- Il genere (tocca 1, 2, 3… in ordine, tavole di Schulte, app "Tap the numbers") è diffuso. Lampo non è nuovo come idea: aggiunge combo, bonus nel campo, regole diverse per sequenza e tempo che cala sempre più in fretta.
- Partito da un prototipo ricevuto (chiamato "Numblast"), ma ricostruito con altro nome, altra struttura e altra grafica. Il nome originale è stato abbandonato perché generico.
- **Rischio:** basso per il gioco, medio per il nome; da verificare su EUIPO, UIBM e negli store prima di una pubblicazione.

## Cassaforte: Bulls and Cows / Mastermind

- **Genere molto diffuso.** "Bulls and Cows" è un gioco da carta e penna molto antico; Mastermind (1970) lo ha reso commerciale con i pioli colorati. Le regole di deduzione non sono proteggibili, ma «Mastermind» è un marchio e il suo aspetto (tabellone a pioli) è del produttore. Esistono molte versioni a cifre, e giochi in stile Wordle con i numeri (Numble, Nerdle). La ricerca non è esaustiva. [Probabile]
- **Cosa lo distingue.** Serie con vite, tempo, moltiplicatore con tetto e codici sempre più lunghi; codice del giorno uguale per tutti con una sola partita; note e indizio. Tema (cassaforte), nome, grafica e testi sono propri. Si evita il nome Mastermind e i pioli colorati: i feedback sono pallini pieni (●) e vuoti (○).
- **Origine.** Rielaborato da un prototipo ricevuto ("La cassaforte a indizi", dentro un file "Tre nuove sfide"). Del prototipo non resta codice: aveva il colore verde sulla cifra sbagliata, l'indizio sulla somma e una sola partita senza tetto né fine definita.
- **Rischio:** basso per il gioco, basso-medio per il nome «Cassaforte» (parola comune: da verificare su EUIPO, UIBM e negli store prima di una pubblicazione).

## Fonti

- [Make7! Hexa Puzzle - App Store](https://apps.apple.com/us/app/make7-hexa-puzzle/id1095539172)
- [Make7! Hexa Puzzle - Google Play](https://play.google.com/store/apps/details?id=com.bitmango.go.make7hexapuzzle&hl=en_US)
- [Make7! Merge Hexa Block Puzzle - Amazon Appstore](https://www.amazon.com/Make7-Merge-Hexa-Block-Puzzle/dp/B08PKH4JK6)
- [Hexa Puzzle: Make 7 - Microsoft Store](https://apps.microsoft.com/detail/9pfbsnvfffm5?hl=en-US&gl=US)
- [Merge Hexa Number Puzzle Game - Google Play](https://play.google.com/store/apps/details?id=com.inspiredsquare.jupiter1&hl=en_US)
- [Hex Merge! - App Store](https://apps.apple.com/us/app/hex-merge/id1151098638)
- [Why Videogame Rules Are Not Expression Protected by Copyright Law (ABA)](https://www.americanbar.org/groups/intellectual_property_law/resources/landslide/archive/why-videogame-rules-are-not-expression-protected-copyright-law/)
- [Tetris Holding, LLC v. Xio Interactive, Inc.](https://en.wikipedia.org/wiki/Tetris_Holding,_LLC_v._Xio_Interactive,_Inc.)
- [Why You Cannot Copyright Game Mechanics in the United States](https://bridgelegal.org/why-you-cannot-copyright-game-mechanics-united-states/)
- [2048 (video game) - Wikipedia](https://en.wikipedia.org/wiki/2048_(video_game))
- [gabrielecirulli/2048 - GitHub](https://github.com/gabrielecirulli/2048)
- [Clones, Clones Everywhere: 1024, 2048 e altre copie di Threes - TechCrunch](https://techcrunch.com/2014/03/24/clones-clones-everywhere-1024-2048-and-other-copies-of-popular-paid-game-threes-fill-the-app-stores)
- [Threes! Removed from Google Play Because of '2048' Keyword - Gamezebo](https://www.gamezebo.com/news/threes-removed-from-google-play-because-of-2048-keyword/)
- [2048 Legends - Google Play](https://play.google.com/store/apps/details?id=com.redevsgames.addup&hl=en_US)
- [2048 Merge Puzzle Game - Google Play](https://play.google.com/store/apps/details?id=com.pixelhorizons.game2048)
