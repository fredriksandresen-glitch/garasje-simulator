# Lagerbygg III Simulator

Interaktiv kapasitets- og begrensningsmodell for Lagerbygg III.

Appen modellerer foreløpig:

- Lager 1 og Lager 2 med justerbare tilgjengelige arealer
- stablehøyde, gangavstand, veggklarering og 900 mm dør-/sluseavstand
- 210L tønner, stålkasser og kokiller
- ISO-container-valg
- containervekt, trailerlast, kollivekt og dosegrenser
- behovsscenario basert på eksisterende beholdning og årlig tilvekst i drum equivalents

## Lokal utvikling

```bash
cd src/frontend
npm install
npm run dev
```

## Build

```bash
cd src/frontend
npm install
npm run build
```

Build-output havner i:

```text
src/frontend/dist
```

## Vercel

Vercel bør kobles til GitHub-repoet med disse innstillingene:

```text
Framework Preset: Vite
Root Directory: src/frontend
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

## ICP

Live frontend canister:

```text
https://znz7v-gyaaa-aaaal-qxdtq-cai.icp0.io/
```

Codex skal ikke deploye direkte til ICP fra denne maskinen. ICP-deploy gjøres av clawdbot etter at Vercel-preview er godkjent.
