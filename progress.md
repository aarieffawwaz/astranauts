# A.R.M.O.R OpsCenter — Session Progress

## Map fixes
- Berau site coords wrong (south of equator) — fixed to real lat/lon (2.05, 117.45), north of equator. `mineGeoData.js` MINE_CENTER shifted to match, all boundary/road/waypoint/robot positions shifted by same delta.
- `MineMap.jsx`: added dark/satellite toggle (CARTO dark tiles vs Esri World Imagery). `mapMode` state, `TILE_LAYERS` map, dynamic boundary/road styling.
- `IndonesiaMap.jsx` (landing page hero + Operational Area): same dark/satellite toggle added. Satellite mode = real Leaflet `MapContainer` + Esri tiles (not CSS gradient fake — user explicitly rejected that). Real province borders drawn as Leaflet `Polygon`s using inverse-projected coords from existing dark-mode SVG path data (`indonesiaGeo.js`: added `unprojectXY`, `parseRings`, `INDONESIA_PROVINCES_LATLNG`). Pulse-glow + active-selection-ring effects replicated from dark mode onto satellite mode markers.
- Perf fix: province polygons (~38, thousands of points) moved to dedicated `L.canvas()` renderer so `flyTo` animation doesn't jitter (DOM reflow avoided); markers stay on SVG so `animate-pulse-dot` CSS animation still works. `fadeAnimation={false}` added to MapContainer. Committed `d5a8dca`.

## AI chat fixes
- Root cause of 429: frontend was calling Gemini directly from browser with exposed `VITE_GEMINI_API_KEY`. Removed `lib/gemini.js` entirely, removed key from frontend `.env`.
- New `opscenter-backend/src/config/gemini.js`: server-side Gemini call w/ retry-once on 503 + fallback to secondary model.
- `ragService.js`: Ollama (local, primary) → Gemini (cloud fallback) chain, graceful degrade if Ollama embeddings unreachable.
- Updated Gemini API key + model (`gemini-2.5-flash-lite`, fallback `gemini-2.5-flash`) in backend `.env`/`.env.example`, Vercel env, Railway env (user-approved both).

## UI/bug fixes (batch of 5)
1. Removed Battery row from Supervisor/Navigator dashboards (and Progress import where now unused).
2. Fixed leaderboard rank bug in `mockData.js` — was using array index as rank instead of sorting by score.
3. Landing page: removed "ESP32" mention, renamed "Gemini API" → "Ollama" in tech stack list.
4. Added "AI Agent" badge to AI Chat (Supervisor) and AI Co-pilot (Navigator).
5. Added dark/satellite toggle to landing page map mockups.

## Text-to-speech
- New `lib/useSpeech.js` hook — Web Speech API, `id-ID` lang, one-directional (AI response → speaker only). Wired into Supervisor + Navigator with Volume2/VolumeX toggle button.

## Scroll flashing/glitch fixes (two rounds)
1. `@keyframes fade-up` was animating `filter: blur()` — expensive per-frame repaint over heavy children (maps/video). Removed blur, kept translateY+opacity only.
2. Fixed nav header had `backdrop-blur-md` while scrolled — continuous blur resampling of scrolling content underneath. Replaced with solid `bg-slate-950/95`.

## Landing page mockups
- Supervisor/Navigator dashboard mockups on landing page rewritten to look like real app screens (KPI chips, fleet map dots, leaderboard rows, telemetry bars) instead of generic placeholders.

## Deploy
- Frontend (Vercel) + backend (Railway) CI/CD confirmed auto-deploy on push to `main`. Multiple rounds pushed and verified live.

## Satellite map flyTo jitter (round 2)
- Symptom: in satellite mode, site nodes "jump onto the ocean" mid-flyTo — vector overlay (canvas borders + SVG markers) re-projects per frame and desyncs from the tile pane. Dark mode never desyncs (single CSS-transformed SVG group).
- Fix `IndonesiaMap.jsx` `FlyToSelected`: toggle `sat-flying` class on `map.getContainer()` for the duration of the flight (added before flyTo, removed on `map.once("moveend")`). `useRef` `first` skips fade on initial mount.
- `index.css`: `.leaflet-container.sat-flying .leaflet-overlay-pane{opacity:0}` + 200ms opacity transition. Hides borders+markers while camera flies, reveals crisply on settle. Tiles fly smooth; nothing can jump. Verified live: after settle `flying:false`, overlayOpacity `1`, markers present.

## Landing card fix — Three dashboards mockup row
- Symptom: Supervisor/Cockpit/Navigator mockup cards had ragged unequal heights → labels misaligned at different y.
- Fix `Landing.jsx`: Reveal wrapper `flex h-full flex-col`, card `flex flex-1 flex-col`, content wrapped in `flex flex-1 flex-col justify-center`. Grid stretch → all 3 cards equal height, labels aligned, shorter content vertically centered. Verified live.

## Cockpit Videos integration
- Updated `Cockpit.jsx` to load custom front, back, left, right, up, 3D, and LiDAR video feeds from static `/media/` folder. Added the corresponding video assets to both public media folder and assets directories.

## Smooth Page Transitions (View Transitions API)
- Created custom `useSmoothNavigate` hook that wraps React Router's `useNavigate` using the native `document.startViewTransition` API with React `flushSync`.
- Added global fade + scale animations to `index.css` under the CSS View Transitions API specs for a smooth, high-fidelity native page transition experience.
- Refactored all main routes (`Landing`, `Login`, `Supervisor`, `Cockpit`, `Navigator`, and `Map`) to use the new transitions for entry, exit, navigation, and role-switching.

## Status
All recent changes committed to main. All feature branches fully merged/up-to-date with main.

