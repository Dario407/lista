# DALLA NOSTRA PARTE · ISIS Carducci-Dante Trieste

Sito mobile-first della lista **Dalla Nostra Parte** (candidato: Dario Nitu). Statico, nessun build: HTML + un CSS + un JS, deploy su Vercel.

## Pagine
| URL | File | Contenuto |
|---|---|---|
| `/` | `index.html` | Hero, 5 priorità, Cantiere aperto, metodo, chi decide cosa, FAQ, passaparola |
| `/proposte` | `proposte.html` | Le 5 proposte con filtro per competenza e registro stati |
| `/registro` | `registro.html` + `assets/registro.json` | Registro pubblico: stato di ogni proposta (si aggiorna modificando il JSON) |
| `/segnala` | `segnala.html` | Raccolta segnalazioni (messaggio pronto per il DM Instagram, bozza salvata sul telefono) |
| `404` | `404.html` | Pagina non trovata con la civetta |

## Scorciatoie per QR code e poster
- `/qr` → home
- `/ig` o `/instagram` → profilo Instagram (redirect diretto, senza passare dalla home)
- `/proposte` o `/programma` → proposte
- `/segnala` → raccolta segnalazioni
- `/cantiere` → priorità in home
- `/registro` (o `/stato`, `/trasparenza`) → registro pubblico
- I vecchi link `/?to=ig`, `?to=proposte`, `?to=segnala` continuano a funzionare.

## Aggiornare il registro (anche da telefono)
Apri `assets/registro.json` su GitHub, cambia `stato` (`da-esaminare`, `in-preparazione`, `presentata`, `in-valutazione`, `approvata`, `realizzata`, `non-accolta`), `presentata` (data `AAAA-MM-GG`), `risposta`, `prossimo` e `aggiornato`. Nessun nome di persone.

## Dove si cambia cosa
- **Colori, spaziature, componenti:** `assets/style.css` (variabili in `:root`, palette dal documento di programma).
- **Handle Instagram e modulo segnalazioni:** `CONFIG` in `assets/app.js`. Se si crea un Google Form, incollare l'URL in `reportFormUrl` e `/segnala` porterà lì.
- **Testi delle proposte:** `proposte.html` (una `<article class="prop …">` per proposta; categoria in `data-cat` e nella classe: `dirette`, `risorse`, `organi`).
- **Font:** Montserrat variabile self-hosted in `assets/fonts/` (niente richieste a Google Fonts).
- **Anteprima di condivisione (WhatsApp/Instagram):** `assets/og.png` (1200×630), tag `og:*` nell'`<head>` di ogni pagina.

## Regole di contenuto (dal documento di programma)
Distinguere sempre proposta *presentata*, *approvata* e *realizzata*; non promettere decisioni che spettano ad altri organi; i 15 giorni sui libri digitali sono un impegno a presentare, non ad ottenere.
