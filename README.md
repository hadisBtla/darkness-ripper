# Darkness Ripper

A p5.js sketch where **webcam motion** pulls the center of an organic, noisy vortex. The webcam feed is drawn full-screen and mirrored; movement in front of the camera becomes the force that drags and disturbs the “core”.

## Controls

- Move your hand (or any object) in front of the webcam: controls the vortex center
- **UP / DOWN arrows**: increase / decrease motion sensitivity (threshold)

## Run locally

You need a local server for webcam access (browsers block `getUserMedia()` on `file://`).

### Option A: Vite (included)

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

### Option B: Any static server

Example:

```bash
npx serve .
```

## Files

- `index.html` – minimal page + hint overlay
- `sketch.js` – the p5.js sketch
- `package.json` – optional dev server scripts

## Notes

- Works best with stable lighting.
- If the motion feels jittery, lower the sensitivity with the **DOWN** key.
