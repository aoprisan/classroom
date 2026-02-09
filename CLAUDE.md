# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend
- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript compile (`tsc -b`) then Vite production build
- `npm run lint` — ESLint (flat config, TypeScript + React Hooks rules)
- `npm run preview` — Preview production build locally

### Backend
- `cd backend && go build ./cmd/server` — Build Go server binary
- `cd backend && go vet ./...` — Run Go vet
- `cd backend && go build ./...` — Build all Go packages

No test framework is configured.

## Architecture

Classroom Shuffle is a React 19 + TypeScript SPA that generates fair student pairings using a round-robin circle method algorithm. It supports two modes:

1. **Standalone mode** (default) — All state persisted to browser localStorage, no backend needed. Deployed as static SPA to GitHub Pages.
2. **Authenticated mode** — Go + SQLite backend with Google OAuth. Multi-classroom support, server-side persistence. Single-binary deployment (Go embeds frontend).

### Storage Adapter Pattern

The `StorageAdapter` interface (`src/lib/storage-adapter.ts`) abstracts persistence. Two implementations:
- `LocalStorageAdapter` (`src/lib/storage-local.ts`) — Browser localStorage (standalone mode)
- `ApiStorageAdapter` (`src/lib/storage-api.ts`) — REST API calls with 500ms debounce (authenticated mode)

Mode is determined by `VITE_API_URL` env var: undefined → standalone, set → API mode.

`StorageContext` (`src/contexts/storage-context.tsx`) provides the adapter to hooks via React context.

### State Management

Uses `useReducer` in `src/hooks/use-classroom-state.ts` with actions: `SHUFFLE_NEXT`, `VIEW_ROUND`, `UPDATE_CONFIG`, `RESET_ALL`, `HYDRATE`. The `allRounds` array is computed (not persisted) and regenerated on hydration from saved config.

Additional hooks manage derived/separate state:
- `use-student-meta.ts` — student names and heights (persisted separately)
- `use-pairing-stats.ts` — memoized pairing coverage statistics
- `use-projects-state.ts` — multi-project team formation state
- `use-storage.ts` — StorageContext accessor hook
- `use-auth.ts` — Google OAuth auth state (API mode only)

### Core Algorithm

`src/lib/round-robin.ts` implements the circle method: student 1 stays fixed, others rotate each round. Handles odd counts via a phantom student (producing one "sits alone" per round). Generates n-1 rounds (even) or n rounds (odd).

`src/lib/seating.ts` sorts pairs by average height and distributes benches across rows.

### Component Organization

Components are feature-grouped under `src/components/`:
- `classroom/` — visual seating layout (ClassroomView → BenchRow → Bench)
- `students/` — editable student metadata table
- `history/` — round history with clickable RoundCards
- `matrix/` — n×n pairing coverage grid
- `config/` — layout configuration with preview
- `layout/` — Header, ModeSwitcher, TabNav
- `projects/` — team-based project management
- `auth/` — LoginPage, AuthGuard (API mode)
- `classrooms/` — ClassroomSelector (API mode, multi-classroom)

### Key Constraints

Config defaults/limits are in `src/constants.ts`: 4–60 students, 1–6 rows, 2 students per bench (fixed).

### localStorage Keys

Defined in `src/constants.ts`, used via storage adapters:
- `classroom-seating-state` — persisted classroom/config state (excludes computed `allRounds`)
- `classroom-student-meta` — student names and heights
- `classroom-projects-state` — project team state
- `classroom-auth-token` — JWT token (API mode only)

## Backend (Go)

Located in `backend/`. Go 1.22+ with `net/http` routing (no framework).

### Structure
- `cmd/server/main.go` — Entry point, embeds frontend `dist/`
- `internal/auth/` — Google OAuth, JWT, auth middleware
- `internal/handler/` — HTTP handlers (auth, classroom, student, project, sync)
- `internal/model/` — Domain types mirroring TypeScript types
- `internal/store/` — SQLite queries + embedded migrations
- `internal/server/` — HTTP server setup, router, CORS

### API Routes (all under `/classroom/api/`)
- `GET/POST /classrooms` — List/create classrooms
- `GET/PUT/DELETE /classrooms/:id` — CRUD
- `PATCH /classrooms/:id/shuffle|view|reset` — Actions
- `GET/PUT /classrooms/:id/students` — Student metadata
- `GET/POST /classrooms/:id/projects` — Project CRUD
- `POST /sync/import` — Import localStorage data

### Config (env vars)
`PORT`, `DATABASE_PATH`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `FRONTEND_ORIGIN`

## Mobile (Capacitor)

Located in `capacitor/`. Wraps the built frontend for iOS/Android.

Build: `VITE_API_URL=https://api.example.com VITE_BASE_PATH=/ npm run build && cd capacitor && npx cap sync`

## Deployment

### Standalone (GitHub Pages)
`.github/workflows/deploy.yml` — builds static SPA, deploys to GitHub Pages. **Do not modify.**

### Authenticated (Docker)
`backend/Dockerfile` — multi-stage build (Node frontend → Go binary → Debian slim runtime).
`.github/workflows/deploy-backend.yml` — builds Docker image on push to main.

## Tech Stack

React 19, TypeScript 5.9 (strict, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly`), Vite 7, Tailwind CSS 4 (Vite plugin, not PostCSS). Go 1.22+, SQLite (WAL mode), `go-sqlite3`, `golang-jwt/jwt/v5`.
