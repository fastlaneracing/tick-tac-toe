# AGENTS.md

## Project

This is a browser-based tic-tac-toe game called **Citrus Critter Brawl**.

The game uses:

- `index.html` for the page structure
- `src/styles.css` for the extravagant visual design
- `src/app.js` for all gameplay logic
- `src/assets/turtle.svg` and `src/assets/alligator.svg` for the player pieces
- `server.js` as a tiny static file server
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

## Development Notes

- Keep the app dependency-free unless a new dependency is clearly worth it.
- Keep gameplay in `src/app.js`.
- Keep styling in `src/styles.css`.
- Keep the page usable in a normal browser without a build step.
- Preserve direct-file compatibility: avoid requiring module imports or server-only behavior unless the project is intentionally changed.
- Use turtle and alligator imagery instead of X and O.
- Keep the loud, over-the-top style. This app is supposed to be ridiculous.
- Keep this `AGENTS.md` file updated when project structure, deployment, scripts, or important workflows change.

## Deployment

The app is deployed with Azure Static Web Apps.

Current deployment facts:

- Git branch: `master`
- Workflow file: `.github/workflows/azure-static-web-apps-kind-pebble-00fe0ec0f.yml`
- App location: `/`
- API location: empty
- Output location: empty
- App build is skipped with `skip_app_build: true`
- API build is skipped with `skip_api_build: true`
- Deployment token secret name: `AZURE_STATIC_WEB_APPS_API_TOKEN_KIND_PEBBLE_00FE0EC0F`

The workflow includes a safe preflight check that confirms the deployment token is present and long enough to look like a real Azure Static Web Apps token. It must never print the token value.

If Azure reports `No matching Static Web App was found or the api key was invalid`, first check the token secret value and the Azure Static Web App branch/workflow mapping. During initial setup, a rebuild/recreated Azure Static Web Apps binding fixed a stale token/resource mismatch.

Keep `setup.md` updated with any deployment procedure changes.

## Verification

Before finishing changes, check:

- The grid accepts clicks.
- Pieces appear in selected squares.
- Computer mode works.
- Two-player mode works.
- The New Round button resets the board.
- The Erase Shame button resets the score.
- The layout still works on a narrow mobile-sized window.
