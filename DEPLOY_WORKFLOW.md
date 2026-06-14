# Lagerbygg III deploy-flyt

Dette prosjektet bruker samme arbeidsflyt som Handball Tracker:

1. Codex lager endringer på en egen GitHub-branch, vanligvis `codex/<kort-navn>`.
2. Vercel bygger preview fra branchen.
3. Fredrik tester Vercel-previewen.
4. Når previewen er godkjent, gir Codex en ferdig melding som kan sendes til clawdbot.
5. Clawdbot deployer siste GitHub-versjon til eksisterende ICP-canister.

## Regler

- Ikke deploy direkte til ICP fra Codex.
- Ikke opprett ny ICP-canister.
- Bruk eksisterende frontend canister: `znz7v-gyaaa-aaaal-qxdtq-cai`.
- Deploy til ICP skal kun gjøres etter at Vercel-preview er godkjent.
- Codex skal alltid oppgi branch-navn og verifiseringspunkter i meldingen til clawdbot.

## Prosjektverdier

```text
GitHub repo: https://github.com/fredriksandresen-glitch/garasje-simulator.git
ICP frontend canister: znz7v-gyaaa-aaaal-qxdtq-cai
Live ICP URL: https://znz7v-gyaaa-aaaal-qxdtq-cai.icp0.io/
Default branch: main
Frontend path: src/frontend
Build command: npm run build
Dist folder: src/frontend/dist
Backend canister: ikke i bruk ennå
```

## Clawdbot-mal for ICP-deploy

```text
Oppdater ICP-canisteren med siste GitHub-versjon.

Viktig:
- Ikke opprett ny canister.
- Bruk eksisterende frontend canister: znz7v-gyaaa-aaaal-qxdtq-cai
- Repo: https://github.com/fredriksandresen-glitch/garasje-simulator.git
- Branch: <BRANCH_NAME>
- Gi statusoppdatering hvert 2. minutt hvis build/deploy tar tid.

Kjør:

export PATH="$HOME/.local/share/dfx/bin:$PATH"
export DFX_WARNING=-mainnet_plaintext_identity

rm -rf /tmp/lagerbygg-icp-deploy
git clone https://github.com/fredriksandresen-glitch/garasje-simulator.git /tmp/lagerbygg-icp-deploy

cd /tmp/lagerbygg-icp-deploy
git checkout <BRANCH_NAME>
git log -1 --oneline

cd src/frontend
npm install
npm run build
cd /tmp/lagerbygg-icp-deploy

cat > canister_ids.json <<'EOF'
{
  "frontend": {
    "ic": "znz7v-gyaaa-aaaal-qxdtq-cai"
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
echo "https://znz7v-gyaaa-aaaal-qxdtq-cai.icp0.io/"

Verifiser i appen:
1. Siden heter Lagerbygg III og ikke Garasje Simulator.
2. Lager 1 og Lager 2 vises i plassmodellen.
3. Slidere for høyde, containergrenser, scenario, vekt og dose endrer resultatene.
4. Varsler vises ved brudd på vekt, dose eller kapasitet.
```
