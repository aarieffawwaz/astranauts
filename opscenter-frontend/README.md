# A.R.M.O.R OpsCenter — Frontend

AI-Relay Mining Operation Rover. A Physical Digital Twin platform for PT Pamapersada Nusantara (PAMA) that gives supervisors real-time fleet visibility and lets operators drive heavy equipment remotely from a connected cockpit.

Built for Astranauts 2026 (PAMA Challenge) by team **Ayam Jago**.

- Live demo: https://armor-pamapersada-nusantara.vercel.app/
- Backend repo: https://github.com/lutfialvarop/opscenter-backend
- Pitch deck: [`references/Astranauts 2026 Final.pdf`](references/Astranauts%202026%20Final.pdf)

## What's in here

Three dashboards, one platform:

- **Supervisor (Command Center)** — live fleet map, operator leaderboard, alerts, fuel monitoring, AI chat.
- **Cockpit** — full-screen camera feed, WASD keyboard drive, speed/distance HUD, emergency stop.
- **Navigator** — tactical map, live telemetry, session/fuel stats, AI co-pilot.

Plus a marketing landing page with PAMA's real operational-area map and pitch numbers pulled from the deck.

## Stack

- React 19 + Vite + Tailwind CSS
- React Router
- Socket.IO client (real-time telemetry)
- Leaflet / react-leaflet (pit map)
- Axios (REST), Gemini API (AI chat fallback)
- shadcn-style UI primitives (`src/components/ui`)

## Getting started

```bash
npm install
npm run dev
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend API (`opscenter-backend`) |
| `VITE_GEMINI_API_KEY` | Gemini API key, used as AI chat fallback when the backend RAG endpoint is unavailable |

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint with oxlint |

## Project structure

```
src/
  pages/        Route-level screens (Landing, Login, Supervisor, Cockpit, Navigator, Map)
  components/   Shared components (MineMap, IndonesiaMap, PamaLogo, ArmorLogo, ui/*)
  lib/          api client, socket client, constants, mock data, utils
scripts/
  gen-indonesia-map.cjs   regenerates src/lib/indonesiaGeo.js from real province
                          boundaries (github.com/ans-4175/peta-indonesia-geojson).
                          Run with `npm run gen:map`.
```

## Login (demo credentials)

| Role | Username | Password |
| --- | --- | --- |
| Supervisor / Fleet Manager | `supervisor` | `supervisor123` |
| Remote Operator | `operator1` | `operator123` |
