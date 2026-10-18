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
`score-tracker-download.html`. La versione disponibile è la 1.0.1.
Gli installer sono ospitati su GitHub Releases nel repository
`domecose96/ScoreTracker-Downloads`, tag `v1.0.1`:

- Windows x64: https://github.com/domecose96/ScoreTracker-Downloads/releases/download/v1.0.1/ScoreTracker-Setup-v1.0.1.exe
- macOS Apple Silicon (M1 e successivi, non Intel): https://github.com/domecose96/ScoreTracker-Downloads/releases/download/v1.0.1/ScoreTracker-macOS-v1.0.1.dmg

Java è incluso; per utilizzare l’app serve una licenza valida. La pagina segnala
che Windows non è firmato digitalmente e macOS non è notarizzato.
Per aggiornare, chiudere ScoreTracker e installare la nuova versione senza disinstallare
la precedente. Eseguire prima un backup della cartella dati.
Caricare solo installer definitivi. Per ogni rilascio aggiornare versione, link,
compatibilità effettiva e note reali nella pagina e nella presentazione prodotto.
La pagina non implementa un controllo aggiornamenti: quello esistente nell’app
rimane collegato al suo server. Versione e relativi link sul server si configurano
nella chat ScoreTracker; questo progetto non introduce un `updates.json`.
