<p align="center">
  <img src="src-tauri/icons/icon.png" alt="Flavortown logo" width="96" height="96">
</p>

# Flavortown Desktop App

An unofficial desktop client for Flavortown built with Tauri and React.

The app signs in with a personal Flavortown API key, pulls account data from the official API, and presents it in a compact desktop dashboard.

## Current scope

What already works:

- API key sign-in
- Session check on startup
- Local storage for API key, theme, and language
- Kitchen dashboard
- Main user stats
- Cumulative devlog time chart
- Activity heatmap
- Project list
- Light and dark themes
- English and French UI

What is still a placeholder:

- Explorer
- Projects
- Sidequests
- Vote
- Shop
- Achievements
- Leaderboard

At the moment, the pages with real functionality are `Kitchen` and `Settings`.

## Stack

- Tauri
- React
- TypeScript
- Vite
- Tailwind CSS
- Font Awesome

## How it works

### Authentication

On launch, the app checks whether an API key is already stored locally. If it finds one, it calls `/users/me` to validate the session. If not, it shows the sign-in screen.

Once the key is accepted, it is stored locally and reused on the next launch.

### Data loading

The app talks to `https://flavortown.hackclub.com/api/v1` and fetches:

- the current user
- the user's projects
- the devlogs attached to each project

Those responses are then aggregated on the client to build:

- total logged time
- devlog counts
- average time per devlog
- the cumulative chart
- the activity heatmap

### Caching

Data fetching uses a small cache layer:

- in-memory cache first
- `localStorage` fallback
- 5 minute TTL

There is also a manual refresh action that invalidates the cached data for the current user and reloads everything.

### Theme and language

The app stores the active language (`en` or `fr`) in `localStorage`.

Theme selection is also stored locally. If nothing has been chosen yet, the app falls back to the system preference.

## Running the project

### Requirements

For desktop development you will need:

- Bun
- Rust
- the system dependencies required by Tauri 2 on your platform

This project is configured so Tauri starts the frontend with Bun (`bun run dev` and `bun run build`).

### Install dependencies

```bash
bun install
```

### Run the frontend only

```bash
bun run dev
```

### Run the desktop app in development

```bash
bun run tauri dev
```

### Build the web frontend

```bash
bun run build
```

### Build the desktop app

```bash
bun run tauri build
```

## Project layout

```text
src/
  components/
    ApiKeySetup.tsx
    Sidebar.tsx
  lib/
    api.ts
    cache.ts
    i18n.tsx
    icons.ts
    useTheme.ts
  pages/
    Kitchen.tsx
    Settings.tsx
  App.tsx
  main.tsx

src-tauri/
  src/
    lib.rs
    main.rs
  tauri.conf.json
  capabilities/
```

## Useful entry points

- `src/App.tsx` wires together boot, auth, navigation, and page selection.
- `src/lib/api.ts` contains the API client, type definitions, and chart/heatmap helpers.
- `src/lib/cache.ts` contains the local caching layer.
- `src/pages/Kitchen.tsx` is the main dashboard page.
- `src/pages/Settings.tsx` currently handles language switching.
- `src-tauri/src/lib.rs` is a minimal Tauri wrapper that initializes the HTTP and opener plugins.

## Security notes

- Desktop HTTP access is handled through the Tauri HTTP plugin.
- The Tauri capability file only allows requests to `https://flavortown.hackclub.com/**`.
- The CSP also allows Google Fonts, which is used for `Iosevka Charon Mono`.

## Project status

The app is already usable as a desktop dashboard for Flavortown, but the navigation is still ahead of the implementation. The base is in place for adding the remaining screens without reworking the app shell.
