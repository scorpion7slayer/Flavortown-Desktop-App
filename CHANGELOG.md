# Changelog

All notable changes to this project should be documented in this file.

The format is based on Keep a Changelog, adapted to the current size of the project.

## [Unreleased]

- No unreleased entries yet.

## [0.1.0]

### Added

- Initial Tauri desktop shell for Flavortown
- React frontend bootstrapped with Vite and TypeScript
- API key sign-in flow with session validation on startup
- Local persistence for API key, theme, and language preferences
- Kitchen dashboard page with:
  - user stats
  - cumulative devlog time chart
  - activity heatmap
  - project list
- Settings page with language switching
- English and French UI translations
- Theme switching with system preference fallback
- Local caching layer with in-memory storage, `localStorage` fallback, and TTL invalidation
- Tauri HTTP and opener plugin setup

### Notes

- Several navigation entries already exist in the UI but are still placeholders:
  `Explorer`, `Projects`, `Sidequests`, `Vote`, `Shop`, `Achievements`, and `Leaderboard`.
