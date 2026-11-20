# Itinera: trip planner

Plan multi-stop trips for a group: choose where you start, the destinations in order, dates, group size, budget per person and how you travel. Itinera builds a timed day-by-day itinerary, a live route map and a per-person budget, and you can edit all of it.

**Phase 1 (this release)** is the full planner with no AI. **Phase 2** adds a Gemini-powered assistant (see [Roadmap](#roadmap)).

## Features

- **Trip wizard**: starting city (or any town via search), multiple destinations in order, start date, 1–30 days, 1–20 travellers, budget cap per person, interests, and a live cost estimate while you fill it in.
- **Transport choices**: non-AC or AC sleeper bus, sleeper or 3-tier AC train, flight, own car, motorbike. The return can differ from the outbound. Long journeys can run overnight, which saves a hotel night.
- **Getting around**: rented scooters, taxi, buses and autos, or a self-drive car. Nearby destinations are linked by local transport and far ones by your main mode.
- **Itinerary engine**: respects opening hours, puts one sunset spot and one evening spot at the right time of day, fits lunch and dinner, adds travel time between stops, keeps each day in one area, and splits days between destinations by how much there is to see.
- **Live map** (Leaflet + OpenStreetMap): numbered stops coloured by day, road routes from OSRM for the selected day, dashed lines for intercity journeys, place search, drop a pin to add a place, "my location", and Google Maps links on every stop.
- **Editing**: reorder, remove or add stops (suggestions, search, map pin or a custom stop). Times update to fit, and timing clashes are flagged.
- **Budget**: transport per leg, rooms by tier and group size, food, local transport, entry fees and contingency, split per person and checked against the cap. "Ways to save" offers cheaper options and applies them in one click.
- **Checklist** generated from the plan (tickets per leg, stays, documents, money, packing), plus your own items.
- **Sharing and export**: view-only share links (the whole trip is compressed into the link, so nothing is uploaded), calendar `.ics`, JSON export and import, print or save as PDF.
- **Workspace**: dashboard with search and filters, trip status (draft, planned, booked, completed), duplicate, backup and restore, default preferences, light and dark themes, and phone layouts.
- **Catalog**: 14 curated destinations, 147 places with OpenStreetMap coordinates, hours, fees and notes. Any other town works too: Itinera pulls its attractions from OpenStreetMap (Overpass).

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 18, TypeScript (strict), Tailwind CSS |
| Routing | React Router (hash routing, so deep links work on GitHub Pages) |
| State | Zustand with persistence to `localStorage` |
| Maps | Leaflet + react-leaflet, OpenStreetMap tiles |
| Geo services | Nominatim (search), OSRM (routing), Overpass (attractions). All free, no API keys |
| Build and test | Vite, Vitest |
| Hosting | GitHub Pages via GitHub Actions |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine unit tests
npm run build      # production build in dist/
npm run preview    # serve the build at http://localhost:4173
```

Requires Node 18 or newer (CI uses Node 22).

## Deploy to GitHub Pages

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`: install, test, build, deploy.
4. The site is served at `https://<your-user>.github.io/<repo-name>/`.

No configuration changes are needed for the repository name: `vite.config.ts` uses relative asset paths and the app uses hash routing.

## Project structure

```
src/
  engine/          Pure planning logic, unit-tested, no UI
    planner.ts     Builds legs, splits time across destinations, schedules each day
    budget.ts      Per-person budget and "ways to save"
    rates.ts       Every price, speed and timing constant in one place
    transport.ts   Leg and hop estimates per mode
    edit.ts        Reorder, insert, remove, re-time, clash detection
    checklist.ts   Checklist generated from the plan
  data/            Destination catalog and origin cities
  services/
    geo.ts         Nominatim, OSRM and Overpass clients
    ai/provider.ts Phase 2 interface for the AI assistant
  store/           Zustand stores (trips, settings)
  components/      UI kit, layout, map, trip workspace panels
  pages/           Landing, Dashboard, NewTrip, TripView, Explore, Settings, SharedTrip
```

## Notes on the free map services

Nominatim, OSRM's demo server, Overpass and the OpenStreetMap tile server are community services with fair-use limits. They are fine for personal use and demos. For real production traffic, point `src/services/geo.ts` and the tile URL in `src/components/map/TripMap.tsx` at a paid or self-hosted provider (for example MapTiler, Stadia Maps, or your own OSRM).

Prices in `src/engine/rates.ts` and the catalog are typical figures for India and are estimates. Fares and room rates change, so check before booking.

## Roadmap

### Phase 2: AI assistant (Gemini)

The seam is already in place: `src/services/ai/provider.ts` defines `TripAIProvider` and `FEATURES.ai` in `src/config.ts` gates the UI.

1. **Server proxy for the Gemini key.** A small serverless function (Cloudflare Workers, Vercel or Firebase Functions) holds the key. The static site calls the proxy, never Gemini directly, so the key is never shipped to browsers.
2. **Place suggestions.** Ask Gemini for places matching the group's interests as structured JSON (`Place[]`), validate the coordinates against Nominatim, and merge them into the destination before planning.
3. **Edit in plain words.** "Swap day 3 for a Dudhsagar trip" becomes structured edits that the deterministic engine re-times and re-costs, so the AI never invents timings or prices.
4. **Trip chat.** Answer questions with the itinerary as context.
5. **Accounts and sync.** Replace the `localStorage` store with a backend (Supabase or Firebase) for sign-in, multi-device sync and shared editing. The store's actions in `src/store/trips.ts` are the integration point.
