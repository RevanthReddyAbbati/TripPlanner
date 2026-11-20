# Itinera: trip planner

Plan multi-stop trips for a group: choose where you start, the destinations in order, dates, group size, budget per person and how you travel. Itinera builds a timed day-by-day itinerary, a live route map and a per-person budget, and you can edit all of it.

**Phase 1** is the full planner and money tracker. **Phase 2** adds a Gemini-powered AI layer on top (see [AI features](#ai-features-gemini)). The planner works fully without AI.

## Features

- **Trip wizard**: starting city (or any town via search), multiple destinations in order, start date, 1–30 days, 1–20 travellers, budget cap per person, interests, and a live cost estimate while you fill it in.
- **Transport choices**: non-AC or AC sleeper bus, sleeper or 3-tier AC train, flight, own car, motorbike. The return can differ from the outbound. Long journeys can run overnight, which saves a hotel night.
- **Getting around**: rented scooters, taxi, buses and autos, or a self-drive car. Nearby destinations are linked by local transport and far ones by your main mode.
- **Itinerary engine**: respects opening hours, puts one sunset spot and one evening spot at the right time of day, fits lunch and dinner, adds travel time between stops, keeps each day in one area, and splits days between destinations by how much there is to see.
- **Live map** (Leaflet + OpenStreetMap): numbered stops coloured by day, road routes from OSRM for the selected day, dashed lines for intercity journeys, place search, drop a pin to add a place, "my location", and Google Maps links on every stop.
- **Editing**: reorder, remove or add stops (suggestions, search, map pin or a custom stop). Times update to fit, and timing clashes are flagged.
- **Budget**: transport per leg, rooms by tier and group size, food, local transport, entry fees and contingency, split per person and checked against the cap. "Ways to save" offers cheaper options and applies them in one click.
- **Expense tracking during the trip**: log spends in seconds (amount, category, who paid, who shares, UPI/cash/card), from the Expenses tab, any itinerary stop, a booking, or `Ctrl+K`. See spent vs cap, remaining, per-person spend, a daily allowance for the days left, a forecast at the current pace, category-vs-plan bars, daily and cumulative charts, and alerts when you go over.
- **Split and settle up**: per-traveller paid / share / balance and the fewest transfers that settle the group. Name your travellers in trip settings.
- **Bookings**: tickets, stays and activities with provider, PNR / confirmation number, dates and status. Suggested straight from the plan, and optionally logged as an expense when confirmed.
- **Trip overview**: live / upcoming / completed status, today's plan, route timeline, budget health, weather forecast per destination (Open-Meteo), recent expenses.
- **Workspace dashboards**: Home (live or next trip, needs-attention list), Trips (table or cards), a cross-trip Expenses ledger with CSV export, and Reports (by category, trip, traveller and month).
- **Command palette**: `Ctrl+K` / `Cmd+K` to jump to any trip, page or destination, or add an expense.
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
| Geo services | Nominatim (search), OSRM (routing), Overpass (attractions), Open-Meteo (weather). All free, no API keys |
| Charts | Small dependency-free SVG components (`src/components/charts`) |
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

## AI features (Gemini)

Phase 2 adds Gemini on top of the planner. Every AI feature returns structured JSON that the app validates and then hands to the deterministic engine, so **the model never sets timings or prices on its own**, and nothing changes in your plan until you click Apply.

| Feature | Where |
| --- | --- |
| **Trip assistant**: ask about the plan, budget, who owes whom, packing, food, weather | Trip → Assistant → Ask |
| **Change the plan in plain words**: "swap the fort on day 3 for a beach", previewed as add/remove/move operations before applying | Trip → Assistant → Change the plan |
| **Place ideas** near any destination that suit the group, with an optional "in the mood for" prompt | Itinerary → Add place → AI ideas |
| **Receipt scan**: photo of a bill or UPI screenshot → amount, title, category, method | Add expense → Scan receipt |
| **Describe your trip** in one sentence → wizard filled in (destinations, dates, group, budget, transport) | New trip → Describe your trip |

Safeguards: suggested places more than 80 km from the destination are dropped, numbers are clamped to sane ranges, edits can't touch travel or check-in stops, and AI place notes say to check hours and fees locally.

### Connecting Gemini

Open **Settings → AI assistant** and pick one:

- **My API key**: paste a key from [Google AI Studio](https://aistudio.google.com/apikey). It's stored only in that browser, sent only to Google in the `x-goog-api-key` header (never in a URL), and never included in backups, exports or share links. Best for personal use.
- **Proxy server**: deploy `proxy/cloudflare-worker.js` (instructions in [`proxy/README.md`](proxy/README.md)). The key stays on the server and the worker only accepts your site's origin. Set the repository variable `VITE_AI_PROXY_URL` and the GitHub Pages build turns AI on for every visitor without exposing your key.

Never put a Gemini key in a `VITE_` variable or in the repository: anything built into the site is public.

Models are selectable in Settings (default `gemini-3.6-flash`), and **Load my models** fetches the live list for your key. Gemini 3.x models ignore sampling parameters, so none are sent.

Code: `src/services/ai/gemini.ts` (REST client, streaming, structured output with automatic fallback), `src/services/ai/provider.ts` (prompts and validation), `src/engine/aiEdits.ts` (applies edits through the engine), `src/store/ai.ts` (connection settings).

## Roadmap

- **Accounts and sync.** Replace the `localStorage` store with a backend (Supabase or Firebase) for sign-in, multi-device sync and shared editing. The store's actions in `src/store/trips.ts` are the integration point; the AI proxy can move behind the same auth.
