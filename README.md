# Garasje Simulator

Garasje Simulator er satt opp for samme arbeidsflyt som Handball Tracker:

1. Codex lager endringer på en egen GitHub-branch.
2. Vercel lager preview-deploy fra branchen.
3. Fredrik tester previewen.
4. Når previewen er godkjent, får clawdbot en ferdig melding for ICP-deploy.
5. Clawdbot deployer til eksisterende ICP-canister.

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

Dette prosjektet er klargjort for assets-canister på ICP via `dfx.json`.
Canister-IDer legges inn i `canister_ids.json` når clawdbot har opprettet dem.

Codex skal ikke deploye direkte til ICP fra denne maskinen. ICP-deploy gjøres av clawdbot etter at Vercel-preview er godkjent.
