# AGENTS.md

## Project

This is a browser-based tic-tac-toe game called **Doms Game Sucks**.

The game uses:

- `index.html` for the page structure
- `src/styles.css` for the extravagant visual design
- `src/app.js` for all gameplay logic
- `src/assets/turtle.svg` and `src/assets/alligator.svg` for the player pieces
- `server.js` as a tiny static file server
- `package.json` for app scripts

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

## Verification

Before finishing changes, check:

- The grid accepts clicks.
- Pieces appear in selected squares.
- Computer mode works.
- Two-player mode works.
- The New Round button resets the board.
- The Erase Shame button resets the score.
- The layout still works on a narrow mobile-sized window.

