# ADR-001: React Query vs local state / Zustand / MobX

- **Status:** accepted
- **Date:** 2026-05-31

## Context

Server data was stored in MobX stores alongside repositories. Caching, deduplication, and invalidation after mutations became manual and error-prone.

## Decision

- **React Query** — all server data (lists, details, availability)
- **react-hook-form** — form field values
- **useState / Zustand** — UI-only (tabs, wizard step, dialog open, draft before submit)
- **Repository class** — OOP data access; called from RQ hooks, not from components directly

## Consequences

- Hooks live in `data/repositories/{domain}/hooks/`
- No API lists in Zustand/MobX long-term
- MobX optional only if team already uses it for complex wizards
