# Mood Universe

A single-page app where you pick how you feel and the page becomes that mood: color, motion, and a short original line. Log moments to a private journal and see them as a galaxy. Everything stays in `localStorage` on this device. There is no account and no server.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build
npm run preview
```

`npm run build` typechecks, then writes a static site to `dist/`.

## Deploy

The app uses hash routes (`#/journal`, `#/galaxy`), so the host does not need a single-page rewrite.

**Vercel:** import the repo, leave the framework preset on Vite, and deploy. Output is `dist`.

**Netlify:** build command `npm run build`, publish directory `dist`.

## Add a mood

Edit `src/data/moods.ts` and add an object to `MOODS`. The picker, journal filters, and galaxy colors all read that list.

Each mood needs:

- `id`, `label`, `emoji`
- `palette` (`bgTop`, `bgBottom`, `accent`, `text`, `particle`, `glow`)
- `particles` (`count`, `speed`, `size`, `direction`, `shape`)
- six original `affirmations`
- a one-line `description`
- `tone`, a soft oscillator frequency in hertz

Shapes: `circles`, `stars`, `rain`, `embers`, `bubbles`, `hearts`, `lines`, `fireflies`.

Directions: `up`, `down`, `drift`, `float`, `wander`, `across`.

Use `lines` if you want the single soft center glow (that is the Focused universe).
