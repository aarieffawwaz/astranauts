# A.R.M.O.R OpsCenter

Remote operations center for an autonomous haul-truck fleet at the Berau open-pit
mine (Kalimantan Timur). Real-time telemetry, tactical satellite mapping, an
AI co-pilot, and three role-specific control surfaces.

The repo is a monorepo with two apps:

| Path | App | Stack |
|------|-----|-------|
| [`opscenter-frontend`](opscenter-frontend) | Web UI | React 19, Vite, Tailwind, Leaflet, Socket.IO client |
| [`opscenter-backend`](opscenter-backend) | API + realtime + RAG | Express, PostgreSQL + pgvector, Socket.IO, LangChain (Ollama → Gemini) |

## Dashboards

- **Supervisor** — site-wide command: fleet KPIs, leaderboard, alerts, predictive
  maintenance, fuel monitoring, fleet-wide quick actions and emergency stop.
- **Navigator** — single-unit remote operation: tactical satellite map of the pit,
  unit diagnostics/telemetry, session stats, live LiDAR, and an AI co-pilot.
- **Cockpit** — first-person drive console: live camera feeds, LiDAR sweep, truck
  schematic, route progress, speed/battery trends, and keyboard or hardware control.

Each dashboard locks to the viewport and scrolls its side/center columns
independently, so panels never squash or clip their content.

## Map

The tactical map (`MineMap`) and landing-page hero (`IndonesiaMap`) toggle between
a CARTO dark basemap and Esri World Imagery satellite tiles — satellite is the
default. Mine boundary, haul road, waypoints, and robot positions in
[`mineGeoData.js`](opscenter-frontend/src/lib/mineGeoData.js) are calibrated against
the real Esri imagery so the geofence sits over the actual pit.

## AI co-pilot

Retrieval-augmented Q&A runs server-side. The backend chains a local Ollama model
(primary) to Gemini (cloud fallback); API keys never reach the browser. The
frontend speaks responses via the Web Speech API (`useSpeech`).

## Getting started

### Backend

```bash
cd opscenter-backend
npm install
cp .env.example .env   # fill in DB + Gemini + JWT values
npm run init-db        # create schema (Postgres + pgvector required)
npm run ingest-docs    # embed knowledge-base docs for RAG
npm run dev            # http://localhost:3000
```

### Frontend

```bash
cd opscenter-frontend
npm install
npm run dev            # http://localhost:5173
```

Point the frontend at the API/socket via its `.env` (see Vite `VITE_*` vars).

## Scripts

**Frontend** — `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.
**Backend** — `npm run dev`, `npm start`, `npm run init-db`, `npm run ingest-docs`.

## Deploy

Frontend on Vercel, backend on Railway — both auto-deploy on push to `main`.
