# AGENTS.md

## Project

This is a browser-based website for **Swamp Puppy Park**, a fictional Florida alligator petting zoo. It also includes a linked tic-tac-toe game called **Citrus Critter Brawl**.

The site uses:

- `index.html` for the Swamp Puppy Park homepage
- `game.html` for the Citrus Critter Brawl game page
- `src/styles.css` for the extravagant visual design across the site and game
- `src/app.js` for all gameplay logic on `game.html`
- `src/assets/turtle.svg` and `src/assets/alligator.svg` for the player pieces
- `server.js` as a tiny static file server
- `Dockerfile` to containerize the app for AKS while keeping the tiny Node server
- `.dockerignore` to keep the container build context small
- `k8s/namespace.yaml` for the Kubernetes namespace
- `k8s/deployment.yaml` for the multi-pod AKS workload
- `k8s/service.yaml` for the first public service exposure
- `package.json` for app scripts
- `setup.md` for Azure publishing notes
- `.github/workflows/azure-static-web-apps-kind-pebble-00fe0ec0f.yml` for Azure Static Web Apps deployment

## Run

If Node.js is installed:

```powershell
npm run dev
```

Then open:

```text
http://localhost:5173
```

The app is also designed to work by opening `index.html` directly in a browser.
Open `game.html` directly to test Citrus Critter Brawl without the local server.

## Development Notes

- Keep the app dependency-free unless a new dependency is clearly worth it.
- Keep gameplay in `src/app.js`.
- Keep styling in `src/styles.css`.
- Keep the page usable in a normal browser without a build step.
- Preserve direct-file compatibility: avoid requiring module imports or server-only behavior unless the project is intentionally changed.
- Use turtle and alligator imagery instead of X and O.
- Keep the Swamp Puppy Park homepage feeling like a plausible family attraction while staying ridiculous.
- Keep the loud, over-the-top style. This app is supposed to be ridiculous.
- Keep this `AGENTS.md` file updated when project structure, deployment, scripts, or important workflows change.

## Deployment

The app is currently deployed with Azure Static Web Apps and now also has a first-pass AKS container deployment path.

Current deployment facts:

- Git branch: `master`
- Workflow file: `.github/workflows/azure-static-web-apps-kind-pebble-00fe0ec0f.yml`
- App location: `/`
- API location: empty
- Output location: empty
- App build is skipped with `skip_app_build: true`
- API build is skipped with `skip_api_build: true`
- Deployment token secret name: `AZURE_STATIC_WEB_APPS_API_TOKEN_KIND_PEBBLE_00FE0EC0F`

AKS/container deployment facts:

- The container image is intended for ACR at `acrmainaksshared.azurecr.io`
- The app listens on `PORT`, and the container default is `8080`
- The first AKS workload uses two replicas
- The first AKS service is a `LoadBalancer` service for straightforward public testing

### Current AKS Handoff State

- The shared AKS platform deployment is already deployed.
- The AKS cluster deployment is already deployed.
- The target AKS resource group is `rg-main-akslab`.
- The target AKS cluster is `aks-main-akslab`.
- The next step is to deploy this app into the existing AKS cluster, not to change Terraform first.
- The expected first image target is `acrmainaksshared.azurecr.io/swamp-puppy-park:latest`.
- The expected first deployment path is:
  1. `az aks get-credentials --resource-group rg-main-akslab --name aks-main-akslab --overwrite-existing`
  2. `az acr login --name acrmainaksshared`
  3. `docker build -t acrmainaksshared.azurecr.io/swamp-puppy-park:latest .`
  4. `docker push acrmainaksshared.azurecr.io/swamp-puppy-park:latest`
  5. `kubectl apply -f .\k8s\namespace.yaml`
  6. `kubectl apply -f .\k8s\deployment.yaml`
  7. `kubectl apply -f .\k8s\service.yaml`
  8. `kubectl rollout status deployment/swamp-puppy-park -n swamp-puppy-park`
  9. `kubectl get svc -n swamp-puppy-park`

For repeatable updates later, prefer replacing `:latest` with a real tag such as `:v1` or a date-based version.

The workflow includes a safe preflight check that confirms the deployment token is present and long enough to look like a real Azure Static Web Apps token. It must never print the token value.

If Azure reports `No matching Static Web App was found or the api key was invalid`, first check the token secret value and the Azure Static Web App branch/workflow mapping. During initial setup, a rebuild/recreated Azure Static Web Apps binding fixed a stale token/resource mismatch.

Keep `setup.md` updated with any deployment procedure changes.

## Verification

Before finishing changes, check:

- The Swamp Puppy Park homepage loads.
- The homepage link to Citrus Critter Brawl opens `game.html`.
- The grid accepts clicks.
- Pieces appear in selected squares.
- Computer mode works.
- Two-player mode works.
- The New Round button resets the board.
- The Erase Shame button resets the score.
- The layout still works on a narrow mobile-sized window.
