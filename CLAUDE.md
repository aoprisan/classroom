# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript compile (`tsc -b`) then Vite production build
- `npm run lint` — ESLint (flat config, TypeScript + React Hooks rules)
- `npm run preview` — Preview production build locally

No test framework is configured.

## Architecture

Classroom Shuffle is a client-side React 19 + TypeScript SPA that generates fair student pairings using a round-robin circle method algorithm. All state is persisted to browser localStorage — there is no backend.

### State Management

Uses `useReducer` in `src/hooks/use-classroom-state.ts` with actions: `SHUFFLE_NEXT`, `VIEW_ROUND`, `UPDATE_CONFIG`, `RESET_ALL`, `HYDRATE`. The `allRounds` array is computed (not persisted) and regenerated on hydration from saved config.

Two additional hooks manage derived/separate state:
- `use-student-meta.ts` — student names and heights (persisted separately)
- `use-pairing-stats.ts` — memoized pairing coverage statistics

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
- `layout/` — Header, TabNav

### Key Constraints

Config defaults/limits are in `src/constants.ts`: 4–60 students, 1–6 rows, 2 students per bench (fixed).

## Tech Stack

React 19, TypeScript 5.9 (strict), Vite 7, Tailwind CSS 4, deployed on Vercel.
