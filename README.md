# DVS — Comunicazione, produzione e media

Sito vetrina statico per DVS di Ugo Colista. La pagina è in italiano e si adatta a desktop e smartphone.

## Anteprima locale

Aprire `index.html` in un browser. Non servono dipendenze o una fase di build.

## Contenuti

- Presentazione e ambiti di attività
- Progetti e riferimenti pubblici
- Metodo di lavoro
- Modulo contatti con riepilogo richiesta e invio predisposto tramite Web3Forms

## Attivazione dell’invio email

Il modulo è già strutturato per inviare nome, email di risposta, telefono facoltativo,
ambito del progetto e messaggio tramite Web3Forms. Per attivarlo, inserire in
`index.html` la Web3Forms access key associata all’indirizzo DVS destinatario,
nella variabile `web3FormsAccessKey` vicino allo script del modulo. La chiave va
generata su [Web3Forms](https://web3forms.com/) per l’indirizzo
`dvsvideoproduzioni@gmail.com`; il servizio la invia a quella casella. Finché la
chiave è vuota il sito non invia i dati e mostra un messaggio esplicito.

Il marchio SVG in `assets/dvs-logo.svg` è una ricostruzione vettoriale basata sul logo fornito come immagine di riferimento.
