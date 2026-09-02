# ParkItUp Operator Portal

Field-facing operator dashboard for logging, reviewing, and submitting parking site inspections. The app is currently frontend-only with a localStorage-backed mock API so product and field workflows can move while the backend is still pending.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/Radix UI primitives
- React Hook Form + Zod
- TanStack Query
- `@vis.gl/react-google-maps` for the GPS/map picker

## Getting Started

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.local.example .env.local
```

Required env vars:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

The Google key must have Maps JavaScript API and Geocoding API enabled. `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` is optional and is used by the AdvancedMarker map implementation.

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

## Mock Data Layer

The mock API lives in `lib/api.ts`. It stores sites in browser `localStorage` under the `parkitup_sites` key and exposes the same boundary a backend client should replace later:

- `getSites`
- `getSite`
- `createSite`
- `updateSite`
- `deleteSite`

When the backend arrives, keep callers stable by replacing the internals of `lib/api.ts` rather than rewriting components. TanStack Query hooks are in `features/sites/api/queries.ts` and `features/sites/api/mutations.ts`.

## Auth Placeholder

Login is a placeholder gate. `app/login/page.tsx` accepts non-empty credentials and writes `parkitup_session` through `lib/auth.ts`. The active operator is currently `CURRENT_OPERATOR_ID` in `lib/constants.ts`.

`proxy.ts` is the Next.js 16 Proxy file for the auth gate. In Next 16 this replaces the older `middleware.ts` convention.

## Feature Structure

The sites feature is organized feature-first:

```text
features/sites/
  api/          TanStack Query hooks
  components/   Site list, form, detail, map picker, shared site UI
  schemas/      Zod schema and inferred TypeScript types
  utils/        Labels, icons, formatting, photo helpers
```

Routes under `app/sites/*` are thin wrappers around feature components.

## Site Model Notes

`features/sites/schemas/site.ts` is the source of truth. Current notable fields include:

- Parking type: `residential`, `society`, `commercial`, `corporate`, `mcd`, `standalone`, `free-parking`, `other`
- Entry/exit: `{ configuration, entryGateCount, exitGateCount }`
- Security/site conditions: guardroom, cameras, boom barrier, ANPR, lighting, signage, restrictions, POS device, vendor notes, internet quality
- Pricing rules: applies-to day type, optional start/end time, rate type, amount
- Risk factors and photos

The form is one scrollable page on desktop and a six-step wizard on mobile.
