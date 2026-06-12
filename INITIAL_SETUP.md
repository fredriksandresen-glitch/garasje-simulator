# Første gangs oppsett

Dette gjøres bare én gang for Garasje Simulator.

## 1. GitHub-repo

Repoet er:

```text
fredriksandresen-glitch/garasje-simulator
```

Når repoet finnes, kan Codex jobbe med branches på samme måte som i Handball Tracker.

## 2. Koble Vercel til repoet

Bruk disse innstillingene i Vercel:

```text
Framework Preset: Vite
Root Directory: src/frontend
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Etterpå skal Vercel lage preview-deployments for branches som `codex/<endring>`.

## 3. Opprett ICP-canister med clawdbot

Send dette til clawdbot når GitHub-repoet er klart:

```text
Lag første ICP-oppsett for Garasje Simulator.

Viktig:
- Opprett nye canistere kun denne første gangen.
- Opprett én frontend assets-canister.
- Backend-canister er ikke nødvendig ennå hvis appen bare er frontend.
- Repo: https://github.com/fredriksandresen-glitch/garasje-simulator.git
- Branch: main
- Gi statusoppdatering hvert 2. minutt hvis build/deploy tar tid.

Kjør:

export PATH="$HOME/.local/share/dfx/bin:$PATH"
export DFX_WARNING=-mainnet_plaintext_identity

rm -rf /tmp/garasje-icp-initial
git clone https://github.com/fredriksandresen-glitch/garasje-simulator.git /tmp/garasje-icp-initial

cd /tmp/garasje-icp-initial
git checkout main
git log -1 --oneline

cd src/frontend
npm install
npm run build
cd /tmp/garasje-icp-initial

Sjekk:
ls -lah src/frontend/dist
test -f dfx.json && echo "dfx.json OK"

Opprett og deploy frontend assets-canister på mainnet:
dfx deploy --network ic frontend

Etter deploy:
echo "Deploy ferdig."
dfx canister --network ic id frontend

Gi meg:
1. Frontend canister ID
2. Live ICP URL
3. Eventuell canister_ids.json som ble laget
```

## 4. Etter første deploy

Når frontend canister-ID finnes, oppdater:

- `DEPLOY_WORKFLOW.md`
- eventuelt `canister_ids.json` lokalt hos clawdbot

Fra da av skal clawdbot-meldinger alltid si:

```text
Ikke opprett ny canister.
Bruk eksisterende frontend canister: <canister-id>
```
