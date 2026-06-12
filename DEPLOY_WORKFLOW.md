# Garasje Simulator deploy-flyt

Dette prosjektet skal bruke samme arbeidsflyt som Handball Tracker:

1. Codex lager endringer på en egen GitHub-branch, vanligvis `codex/<kort-navn>`.
2. Vercel bygger preview fra branchen.
3. Fredrik tester Vercel-previewen.
4. Når previewen er godkjent, gir Codex en ferdig melding som kan sendes til clawdbot.
5. Clawdbot deployer siste GitHub-versjon til eksisterende ICP-canister.

## Regler

- Ikke deploy direkte til ICP fra Codex.
- Ikke opprett ny ICP-canister når appen først har fått faste canistere.
- Deploy til ICP skal kun gjøres etter at Vercel-preview er godkjent.
- ICP-deploy skal bruke eksisterende canister-IDer.
- Codex skal alltid oppgi branch-navn og verifiseringspunkter i meldingen til clawdbot.

## Prosjektverdier

Fylles ut når repo, Vercel og ICP er klare:

```text
GitHub repo: https://github.com/fredriksandresen-glitch/garasje-simulator.git
Vercel project:
Vercel preview deployments:
ICP frontend canister:
ICP backend canister: ikke i bruk ennå
Live ICP URL:
Default branch: main
Frontend path: src/frontend
Build command: npm run build
Dist folder: src/frontend/dist
```

## Standard Codex-flyt

Når Fredrik ber om en endring:

1. Lag eller bruk branch `codex/<endring>`.
2. Gjør endringen i GitHub-repoet.
3. Push branchen.
4. Be Fredrik teste Vercel-preview.
5. Når Fredrik godkjenner, lever en ferdig clawdbot-melding basert på malen under.

## Clawdbot-mal for ICP-deploy

```text
Oppdater ICP-canisteren med siste GitHub-versjon.

Viktig:
- Ikke opprett ny canister.
- Bruk eksisterende frontend canister: <FRONTEND_CANISTER_ID>
- Repo: https://github.com/fredriksandresen-glitch/garasje-simulator.git
- Branch: <BRANCH_NAME>
- Gi statusoppdatering hvert 2. minutt hvis build/deploy tar tid.

Kjør:

export PATH="$HOME/.local/share/dfx/bin:$PATH"
export DFX_WARNING=-mainnet_plaintext_identity

rm -rf /tmp/garasje-icp-deploy
git clone https://github.com/fredriksandresen-glitch/garasje-simulator.git /tmp/garasje-icp-deploy

cd /tmp/garasje-icp-deploy
git checkout <BRANCH_NAME>
git log -1 --oneline

cd src/frontend
npm install
npm run build
cd /tmp/garasje-icp-deploy

cat > canister_ids.json <<'EOF'
{
  "frontend": {
    "ic": "<FRONTEND_CANISTER_ID>"
  }
}
EOF

Sjekk:
ls -lah src/frontend/dist
test -f dfx.json && echo "dfx.json OK"
test -f canister_ids.json && echo "canister_ids.json OK"

Deploy kun frontend:
dfx deploy --network ic frontend

Etter deploy:
echo "Deploy ferdig:"
echo "<LIVE_ICP_URL>"

Verifiser i appen:
1. <SJEKKPUNKT_1>
2. <SJEKKPUNKT_2>
3. <SJEKKPUNKT_3>
```
