# ParkItUp Operator Portal

The field-facing half of ParkItUp's two-portal system. Operators use this app
to log, edit, and submit parking site inspections from the field (mobile) or
desk (desktop). The companion **Admin Dashboard** app is where a manager
reviews submitted sites and approves/rejects them (moving a site's status to
`active` or `inactive`). Both apps read and write the same `Site` record —
see [`API_CONTRACT.md`](API_CONTRACT.md) for the full shared data contract.

The app is currently **frontend-only**, backed by a `localStorage`-based mock
API, so product and field workflows can move forward while the real backend
is still pending.

## Tech Stack

- **Next.js 16 (App Router)** — file-based routing, Server/Client components.
  Note: this repo uses Next 16's **Proxy** convention (`proxy.ts` /
  `export function proxy`), not the older `middleware.ts` — see
  [`AGENTS.md`](AGENTS.md).
- **React 19** / **TypeScript** — the app's UI and type-safety layer.
- **Tailwind CSS v4** — utility-first styling; see the design system note
  below.
- **shadcn/Radix UI primitives** (`components/ui/`) — accessible, unstyled
  primitives so we're not hand-rolling dialogs/dropdowns/forms.
- **React Hook Form + Zod** — one Zod schema
  (`features/sites/schemas/site.ts`) drives both form validation and the
  inferred `Site`/`SiteFormValues` TypeScript types, so the data shape and
  its validation rules never drift apart.
- **TanStack Query** — caching/loading/mutation state for the mock API,
  chosen so swapping the mock for a real backend later is a `lib/api.ts`
  change only, not a rewrite of every component that reads site data.
- **`@vis.gl/react-google-maps`** — the GPS location picker on the site form.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

Required env var in `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

The Google Cloud project behind this key must have both the **Maps
JavaScript API** and **Geocoding API** enabled. `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`
is optional (used for the AdvancedMarker map style). If the key is missing,
the map picker renders a fallback rather than failing — see
`features/sites/components/SiteLocationPicker.tsx`.

### Available scripts

```bash
npm run dev          # start the dev server
npm run lint          # eslint
npx tsc --noEmit      # type-check
npm run build         # production build
```

## Mock data and mock APIs

Nothing in this app talks to a real backend yet. Two things are mocked:

1. **Auth** (`app/login/page.tsx`, `lib/auth.ts`, `proxy.ts`,
   `lib/constants.ts`): login accepts any non-empty email/phone + password
   and sets a plain (unsigned, unvalidated) cookie. `proxy.ts` gates routes
   on that cookie's mere presence. The active operator is a hardcoded
   `CURRENT_OPERATOR_ID` constant, not derived from the logged-in session.
2. **The site data API** (`lib/api.ts`): `getSites`, `getSite`, `createSite`,
   `updateSite`, `deleteSite` (plus `undeleteSite`) all read/write a
   `localStorage` blob (key `parkitup_sites`), with an artificial delay to
   exercise loading states. On first run it self-seeds with sample sites.

Why mock instead of stub out a real API client: it lets the full CRUD +
form + list/detail UI be built, demoed, and iterated on end-to-end before a
backend exists, without any component needing to change when a real backend
is swapped in — as long as the new implementation preserves the same
function signatures.

**For the full data contract (the `Site` type, every `lib/api.ts` function's
behavior and business rules, and backend framework notes) see
[`API_CONTRACT.md`](API_CONTRACT.md).** That document is written for
whoever builds the real backend, in whatever language/framework they choose.

## Where to continue (for a backend developer)

**Done:** the full operator-facing UI — site list, six-step mobile wizard,
scrollable desktop form, site detail view, soft delete/undelete, dark mode,
GPS picker with fallback — all driven by a mock `localStorage` API with a
stable function contract.

**Explicitly not done:**
- Real authentication (current login is a placeholder that accepts any
  credentials).
- A real backend API (everything currently lives in the browser's
  `localStorage`, per-device, per-browser — nothing is shared across users
  or devices).
- Deployment/hosting configuration.

**Recommended path:**
1. Branch off `main`.
2. Read [`API_CONTRACT.md`](API_CONTRACT.md) end to end — it documents the
   exact `Site` shape (aligned with the Admin Dashboard's contract) and every
   `lib/api.ts` function's expected behavior and business rules.
3. Implement the real API, then replace the *internals* of `lib/api.ts`
   (HTTP calls instead of `localStorage`) while preserving its exported
   function names/signatures — this keeps every component and TanStack
   Query hook that calls it unchanged.
4. Replace the placeholder auth (`app/login/page.tsx`, `lib/auth.ts`,
   `proxy.ts`, `CURRENT_OPERATOR_ID`) with real session-based auth once the
   backend supports it.
5. PR back into `main`.

## Folder structure

```text
app/                    Next.js App Router routes — kept thin, delegate to features/
  login/                Login page
  sites/                Site list/detail/new/edit routes + shared layout (header)
  icon.svg              Favicon (Next.js auto-detects this file)
features/sites/         All site feature logic
  api/                  TanStack Query hooks (queries.ts, mutations.ts)
  components/           List, form (desktop + mobile wizard), detail, map picker
  schemas/              site.ts — Zod schema + inferred Site/SiteFormValues types (source of truth)
  utils/                Labels, icons, formatting, photo helpers
components/ui/          shadcn/Radix UI primitives
lib/                    api.ts (mock data layer), auth.ts, constants.ts
providers/              QueryProvider, ThemeProvider
types/site.ts           Re-exports the inferred types from features/sites/schemas/site.ts
public/logo.svg         Logo asset used in the app header
API_CONTRACT.md         Data contract for the real backend
AGENTS.md               Conventions and constraints for AI coding agents working in this repo
```

## Design system

Flat, monochrome UI — no gradients or heavy shadows, relying on spacing,
borders, and typography for hierarchy. Light mode is the default theme
(dark mode is supported and toggleable from the header). The one deliberate
splash of color is **status badges** (draft/submitted/active/inactive), which
are color-coded so a site's state is scannable at a glance in the list view.
Keep new UI consistent with this: default to the existing shadcn/Radix
primitives in `components/ui/`, and reserve color for meaningful state, not
decoration.
