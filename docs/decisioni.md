# Decisioni aperte e prese: licenza, donazioni, pubblicità, bambini

Aggiornato il 03/10/2026. Non è una consulenza legale né fiscale.

## Licenza
- **Oggi:** GNU GPL v3 (file `LICENSE`, dichiarata in README e in `index.html`). Consigliata finché l'obiettivo è limitare i cloni chiusi: con MIT o Apache chiunque può chiudere il codice e ripubblicarlo con pubblicità.
- Essendo l'unico titolare del copyright puoi distribuire una tua versione con altre regole (per esempio con un SDK pubblicitario in un APK). Non accettare codice di altri senza un accordo scritto.
- La licenza non copre i **nomi** («Numeri in Tasca», «Lampo», «Cassaforte»): cercare i marchi su EUIPO, UIBM e negli store prima di pubblicare.
- Da chiarire: il codice scritto con l'IA potrebbe non avere copyright; chi ha scritto i prototipi ricevuti (Lampo ne è partito, Cassaforte non ne contiene più codice).
- Font Google (Fredoka e altri, licenza OFL): ok se caricati dal sito di Google; se incorporati vanno citati.

## Donazioni
- **Decisione 03/10/2026:** il pulsante "Dona" PayPal è visibile nella home e a fine partita (`SHOW_DONATE = true`). Testo rivolto a un adulto, importo libero da 1 €. È un regalo: non cambia nulla nei giochi.
- **Da verificare:** le regole di PayPal sul pulsante "Dona" per un privato (nasce per enti non profit) e la commissione fissa su importi piccoli (su 1 € resta circa il 60%). Non ho potuto provare il pagamento.
- Niente "dona e togli la pubblicità": sarebbe un acquisto (IVA, e sul Play Store obbligo del loro sistema di pagamento).

## Pubblicità
- **Modello voluto (03/10/2026):** pubblicità per chi non sostiene; un **codice che la toglie, da rinnovare una volta l'anno**. Una prima versione di questa nota aveva frainteso "una volta l'anno" come "una pubblicità l'anno": era un errore.
- Il codice annuale è un **abbonamento**, non una donazione: può essere trattato come pagamento di un servizio (IVA, tasse) e sul Play Store serve il loro sistema di pagamento. Chiamarlo "Sostenitore annuale" e chiedere a un commercialista. Tecnicamente: codice firmato con una chiave privata tua, con scadenza; il gioco contiene solo la chiave pubblica e controlla la firma (nessun server). I codici si possono condividere.
- Con una rete pubblicitaria servono: approvazione, banner dei consensi certificato da Google nello Spazio Economico Europeo (obbligatorio dal gennaio 2024), informativa privacy. Gli annunci a schermo intero vanno solo nelle pause naturali (fine partita), non durante il gioco.
- Non è stato fatto nulla: nessuna pubblicità è presente.

## Bambini (regole in sintesi)
- **Italia/UE (GDPR):** per i servizi online basati sul consenso l'età minima è 14 anni in Italia; sotto, serve un genitore. I dati dei minori hanno tutele rafforzate.
- **USA (COPPA):** vale per servizi rivolti a minori di 13 anni che raccolgono dati personali.
- **Google Play (Families) e App Store (Kids):** per app rivolte anche ai bambini niente pubblicità personalizzata, reti pubblicitarie certificate, informativa privacy, niente identificativo pubblicitario.
- **Oggi:** il gioco non raccoglie dati personali (il nome resta sul dispositivo; le statistiche inviate sono anonime, da verificare che non contengano identificativi). Le istruzioni semplici per bambini non rendono il gioco "per bambini" da sole, ma lo avvicinano. Il pulsante di donazione si rivolge agli adulti.
- **Deciso 03/10/2026:** il gioco è per ragazzi e adulti. Dichiararlo "dai 14 anni in su" (età del consenso digitale in Italia) per non rientrare nelle regole per i bambini. Se si volesse includere chi ha meno di 14 anni: consenso del genitore, nessuna pubblicità personalizzata, informativa privacy.

## Strategia di ingresso a costo minimo (03/10/2026)
Principio: prima scoprire se qualcuno rigioca, poi spendere. Costo per cominciare: 0 €.

1. **Un link, a costo zero.** Pubblicare il repository con GitHub Pages (gratis se il repository è pubblico), rendere il sito installabile («Aggiungi a Home», manifest e service worker) e mettere l'indirizzo nel testo "Copia risultato": oggi chi lo riceve non può raggiungere il gioco. [Da fare]
2. **Misurare.** Le statistiche anonime contano partite a testa e chi torna in giorni diversi. Soglie da fissare prima di guardare i dati, per esempio almeno 100 giocatori, 3 partite a testa, 20% che torna. [Ipotesi, valori da scegliere]
3. **Portale di giochi per la pubblicità, senza account tuo.** CrazyGames: pubblicare è gratis e senza esclusiva, parte con un "Basic Launch" senza SDK; quota circa 60% sulla pubblicità (dato non ufficiale). Poki: solo giochi selezionati, SDK obbligatorio, massimo 8 MB, 50% sul traffico che porta lui. Serve un gioco alla volta, non il launcher: scegliere il più rigiocato (probabilmente Lampo; Raddoppio è un genere saturo). Un portale probabilmente non permette link a donazioni.
4. **Play Store dopo il punto 2.** 25 $ una volta; un account personale nuovo deve fare un test chiuso con almeno 12 tester per 14 giorni di fila prima di pubblicare. Incapsulare il sito con Bubblewrap (gratis). Nell'app: nessuna pubblicità né pagamenti. Apple: 99 $ l'anno, rimandare.
5. **Pagamenti e pubblicità proprie solo se i numeri lo giustificano.** Alternativa a PayPal: itch.io (quota del 10% regolabile fino a 0, più commissione PayPal 0,30 $ + 2,9% o Stripe). Su piccole somme pesa lo stesso.

- **Realismo:** con questo traffico di partenza i ricavi saranno probabilmente poche decine di euro l'anno. [Ipotesi]
- **Prossimi passi proposti:** (a) pagina installabile e indirizzo nel testo condiviso, (b) pagina con l'informativa privacy (serve al Play Store e ai consensi).

Fonti: [Google Play Console](https://support.google.com/googleplay/android-developer/answer/14151465), [CrazyGames](https://app.cinevva.com/guides/publish-game-crazygames), [Poki](https://app.cinevva.com/guides/publish-game-poki), [Bubblewrap](https://www.thinktecture.com/en/pwa/twa-bubblewrap), [itch.io](https://itch.io/docs/creators/payments), [Google AdSense H5](https://support.google.com/publisherpolicies/answer/11975916), [Google, consensi nello SEE](https://support.google.com/admob/answer/13554020).


## Classifiche pubbliche (2026-10-04)

- **Scelta:** Supabase (login con GitHub, nessuna carta); controlli nel database, non servono funzioni a pagamento. Firebase avrebbe richiesto le Cloud Functions, che di norma chiedono un piano con carta.
- **Nomi:** generati dal server, nessun testo libero (minori, GDPR, nessuna moderazione dei contenuti). Decisione presa da me sulla raccomandazione: la domanda non ha avuto risposta.
- **Partenza:** solo le due sfide del giorno. Gli altri giochi aspettano che le classifiche piacciano ai tester.
- **Da fare prima di aprire al pubblico:** pagina con l'informativa privacy (dati: identificativo anonimo, nome generato, punteggi); controllare che il progetto Supabase sia in regione europea; ricordarsi che i progetti gratuiti inattivi vanno in pausa dopo circa una settimana.
- **Chiave:** nel file c'è solo l'indirizzo e la chiave pubblicabile. La chiave segreta non va mai incollata nel file né in chat.
