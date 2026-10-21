# DVS — Comunicazione, produzione e media

Sito vetrina statico per DVS di Ugo Colista. La pagina è in italiano e si adatta a desktop e smartphone.

## Anteprima locale

Aprire `index.html` in un browser. Non servono dipendenze o una fase di build.

## Contenuti

- Presentazione e ambiti di attività
- Progetti e riferimenti pubblici
- Metodo di lavoro
- Modulo contatti attivo tramite Web3Forms
- Informativa privacy dedicata al modulo

## Invio delle richieste

Il modulo invia nome, email di risposta, telefono facoltativo, ambito del progetto
e messaggio tramite Web3Forms all’indirizzo DVS configurato per la chiave. Prima di
modificare o rigenerare la chiave, aggiornare la variabile `web3FormsAccessKey` in
`index.html`. L’indirizzo inserito dal visitatore viene impostato come `replyto`,
così la risposta alla notifica email torna direttamente a chi ha compilato il
modulo. L’informativa collegata al modulo si trova in `privacy.html`.

Il marchio SVG in `assets/dvs-logo.svg` è una ricostruzione vettoriale basata sul logo fornito come immagine di riferimento.

## Download ScoreTracker

La pagina prodotto `score-tracker.html` contiene il pulsante Download verso
`score-tracker-download.html`. Versione, novita' e pulsanti si aggiornano
dall'ultima release stabile pubblicata in `domecose96/ScoreTracker-Downloads`.
Non servono aggiornamenti manuali dei numeri versione o dei link nel sito.

I pulsanti Windows e Mac avviano direttamente il file ufficiale senza
navigare verso una pagina intermedia. Prima del download viene verificata
di nuovo l'ultima release; durante la richiesta il pulsante rimane occupato.
Se la richiesta fallisce, un messaggio nella pagina permette di riprovare,
senza mandare il visitatore su GitHub.

Le novita' sono mostrate nella pagina: il modulo richiede il formato HTML
delle note all'API GitHub, lo analizza in un template inerte e copia soltanto
testo in un elenco locale. Link, immagini, script e altro markup esterno
non vengono inseriti nel documento visibile. Se la release non ha un elenco,
vengono utilizzati i paragrafi disponibili.

Indirizzi permanenti opzionali, utilizzabili in altri siti o messaggi
(non utilizzati dai pulsanti della pagina principale):

- Windows x64: `score-tracker-installer.html?platform=windows`
- macOS Apple Silicon: `score-tracker-installer.html?platform=macos`

`assets/score-tracker/downloads.mjs` legge l'API pubblica GitHub e accetta
esclusivamente installer EXE/DMG del repository ufficiale, corrispondenti al
tag della release, caricati e dotati di digest SHA-256. Bozze, prerelease,
URL estranei, parametri aggiuntivi e asset duplicati vengono respinti.
Il gateway opzionale risolve l'ultima release a ogni apertura e mantiene un
ripiego verso i download ufficiali se l'API non risponde. La pagina principale
invece gestisce l'errore sul posto. Non si salvano link obsoleti in localStorage.
I download automatici richiedono JavaScript; in sua assenza rimane disponibile
il contatto di assistenza.

Java è incluso; per utilizzare l’app serve una licenza valida. La pagina segnala
che Windows non è firmato digitalmente e macOS non è notarizzato.
Per aggiornare, chiudere ScoreTracker e installare la nuova versione senza disinstallare
la precedente. Eseguire prima un backup della cartella dati.
Caricare soltanto installer definitivi e verificati, con nomi
`ScoreTracker-Setup-vX.Y.Z.exe` e `ScoreTracker-macOS-vX.Y.Z.dmg`, in una
release `vX.Y.Z` contrassegnata come ultima stabile. La pubblicazione da
ScoreTracker aggiorna cosi' i download del sito senza modificarlo. L'avviso
nell'app resta gestito dal servizio aggiornamenti/License Manager; non si
introducono nuovi endpoint nel backend licenze ne' un `updates.json`.
Compatibilita' e avvisi sulle firme rimangono contenuti editoriali: se cambiano
i requisiti del prodotto, aggiornare quei testi.

Test: `node --test tests/score-tracker-downloads.test.mjs`.
Per l'anteprima dei moduli JavaScript usare un server HTTP locale invece di
aprire direttamente il file HTML.
