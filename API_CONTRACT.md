# API Contract

This document is for whoever builds the real backend for the ParkItUp
two-portal system (this Operator Portal + the Admin Dashboard). Both apps
read and write the **same** `Site` record; there is no per-app data model.

The canonical `Site` shape lives in this repo, at
[`features/sites/schemas/site.ts`](features/sites/schemas/site.ts) (Zod
schema, source of truth) and [`types/site.ts`](types/site.ts) (re-exported
TypeScript type). **This app's schema is the canonical base — the admin
dashboard's `Site` type should be brought in line with it, not the other way
around.** All field names are camelCase; see "Backend framework notes" below.

## The `Site` type

```ts
type Site = {
  id: string
  propertyName: string
  address: string
  gps: { lat: number; lng: number }

  parkingType:
    | "residential" | "society" | "commercial" | "corporate"
    | "mcd" | "standalone" | "free-parking" | "other"
  parkingTypeOther?: string // required (non-empty) when parkingType === "other"

  entryExit: {
    configuration: "same" | "separate"
    entryGateCount: number // >= 1
    exitGateCount: number  // >= 1; must equal entryGateCount when configuration === "same"
  }

  totalSlots: number // >= 1

  operatingHours: {
    start: { time: string; period: "AM" | "PM" } // time as "H:MM", e.g. "9:00"
    end: { time: string; period: "AM" | "PM" }
  }
  peakPeriods: string

  surface: "covered" | "uncovered" | "fenced"

  security: {
    guardroom: boolean
    cameras: "covered" | "open" | "none"
  }

  posDevice: Array<"manual" | "pos-machine" | "mobile-app"> // at least one
  vendorNotes?: string
  competitorNotes?: string
  internetQuality: "unavailable" | "poor" | "good" | "excellent"
  lighting: "none" | "partial" | "full"
  boomBarrier: boolean
  anpr: boolean
  signage: "none" | "partial" | "full"
  restrictions: string

  owner: { name: string; phone: string } // phone: 10 digits
  paymentRecipient: {
    type: "individual" | "company"
    registeredName?: string
  }
  gst: { registered: boolean; gstNumber?: string }

  caretaker: { name: string; phone: string }
  workerCount: number // >= 0

  pricingRules: Array<{
    id: string
    dayType: "weekday" | "weekend" | "holiday" | "all"
    startTime?: string
    endTime?: string
    rateType: "hourly" | "daily" | "one-time"
    amount: number // >= 0
  }> // at least one rule

  riskFactors: string
  rwaPassSystem?: boolean
  photos: string[]

  // --- Lifecycle / ownership ---
  status: "draft" | "submitted" | "active" | "inactive"
  operatorId: string
  createdAt: string   // ISO 8601, set once at creation
  updatedAt: string   // ISO 8601, set on every write
  deleted: boolean    // soft delete flag

  // Each of the three fields below is stamped exactly once and never
  // overwritten after being set — they record the timestamp of a one-way
  // state transition, not a "last changed" time.
  activatedAt?: string   // stamped when status first becomes 'active'. Written
                          // by the ADMIN DASHBOARD's approval action, never by
                          // this app — but the field must exist here since
                          // both apps operate on the same Site record.
  inactivatedAt?: string // stamped when status first becomes 'inactive'.
                          // Same reasoning: admin-dashboard-written, must
                          // still be present in this app's type.
  deletedAt?: string     // stamped when `deleted` is first set to true. This
                          // app's own deleteSite() sets it (see below).
}
```

### Notes on fields whose meaning isn't obvious

- **Status is a 4-state, mostly one-way model**: `draft` → `submitted` →
  `active` | `inactive`. Operators create/edit `draft` sites and submit them
  (`submitted`). Only the admin dashboard moves a site to `active` or
  `inactive` (an approval/rejection action) — this app never writes those
  two status values itself, only reads them.
- `createdAt` / `updatedAt` / `activatedAt` / `inactivatedAt` / `deletedAt`
  are each stamped **exactly once** at the moment of their corresponding
  event and must never be overwritten afterward (except `updatedAt`, which
  updates on every write, unlike the others).
- `entryExit.exitGateCount` must equal `entryGateCount` when
  `configuration === "same"` — this is validated, not just a convention.
- `posDevice` is an array (an operator can support multiple payment/POS
  methods at one site), not a single value.

## `lib/api.ts` functions

The mock implementation lives in
[`lib/api.ts`](lib/api.ts) and is backed by `localStorage`. A real backend
must preserve this exact function contract (names, params, return shapes) —
see [`AGENTS.md`](AGENTS.md).

### `getSites(): Promise<Site[]>`
Returns all non-deleted sites belonging to the current operator
(`site.operatorId === CURRENT_OPERATOR_ID && !site.deleted`), sorted by
`updatedAt` descending (most recently updated first).

### `getSite(id: string): Promise<Site | undefined>`
Returns a single site by id, or `undefined` if not found. Note: unlike
`getSites`, this does **not** filter by operator or `deleted` — any site can
be fetched by id if you know it.

### `createSite(values: SiteFormValues): Promise<Site> `
Creates a new site from form values (the `Site` shape minus
`id`/`status`/`operatorId`/`createdAt`/`updatedAt`/`deleted`/`activatedAt`/
`inactivatedAt`/`deletedAt`).
Business rules:
- Always sets `status: "draft"` — new sites can never be created directly
  into any other status.
- Generates `id` and sets `createdAt`/`updatedAt` to "now".
- Sets `operatorId` to the current operator (see "Auth" note below).
- Sets `deleted: false`.
- The mobile step-through wizard and the desktop scrollable form both build
  the same `SiteFormValues` shape and call this same function — there is no
  separate save path per form factor.

### `updateSite(id: string, values: Partial<SiteFormValues> & { status?: Site["status"] }): Promise<Site>`
Merges the given partial values onto the existing site and sets `updatedAt`
to "now". Throws if the site doesn't exist. This is also how a `draft` moves
to `submitted` (the frontend passes `status: "submitted"` as part of the
partial update) — the mock does not separately validate status transitions
here, but a real backend should enforce that this app can only ever write
`status` as `draft` or `submitted`, never `active`/`inactive`
(those are admin-dashboard-only writes) and never resurrect a `deleted` site
through this path (use `undeleteSite` instead).

### `deleteSite(id: string): Promise<void>`
Soft-deletes a site: sets `deleted: true`, stamps `deletedAt` and
`updatedAt` to the same "now" timestamp. Throws if the site doesn't exist.
**Business rule enforced only in the UI, not in this function**: the delete
action is only exposed/enabled when `site.status === "draft"` (see
`features/sites/components/SitesList.tsx`, `deleteBlocked`). A real backend
should enforce this same rule server-side rather than trusting the client.

### `undeleteSite(id: string): Promise<void>`
Reverses a soft delete: sets `deleted: false` and updates `updatedAt`. Does
**not** clear `deletedAt` — `deletedAt` records the timestamp of the most
recent delete, not "currently deleted since".

## Auth (pending real implementation)

`operatorId` currently comes from a hardcoded `CURRENT_OPERATOR_ID` constant
in [`lib/constants.ts`](lib/constants.ts), not from a logged-in session —
there is no real authentication yet (see `proxy.ts` / `app/login/page.tsx`,
which accept any non-empty credentials and set a placeholder cookie). A real
backend should replace this with the authenticated user's operator id from
a proper auth/session mechanism.

## Sample `Site` JSON

```json
{
  "id": "site-1730000000000-ab12cd",
  "propertyName": "Greenview Apartments",
  "address": "B-12, Sector 56, Gurugram, Haryana 122011",
  "gps": { "lat": 28.4231, "lng": 77.0430 },
  "parkingType": "society",
  "parkingTypeOther": "",
  "entryExit": { "configuration": "same", "entryGateCount": 2, "exitGateCount": 2 },
  "totalSlots": 120,
  "operatingHours": {
    "start": { "time": "6:00", "period": "AM" },
    "end": { "time": "11:00", "period": "PM" }
  },
  "peakPeriods": "Weekday evenings 6-9 PM",
  "surface": "covered",
  "security": { "guardroom": true, "cameras": "covered" },
  "posDevice": ["manual", "mobile-app"],
  "vendorNotes": "Society RWA manages parking passes internally.",
  "competitorNotes": "",
  "internetQuality": "good",
  "lighting": "full",
  "boomBarrier": true,
  "anpr": false,
  "signage": "partial",
  "restrictions": "No heavy vehicles. Visitor passes required after 10 PM.",
  "owner": { "name": "Rajesh Kumar", "phone": "9876543210" },
  "paymentRecipient": { "type": "company", "registeredName": "Greenview RWA" },
  "gst": { "registered": true, "gstNumber": "06AADCG1234M1Z5" },
  "caretaker": { "name": "Suresh Yadav", "phone": "9812345678" },
  "workerCount": 4,
  "pricingRules": [
    { "id": "pr-1", "dayType": "all", "rateType": "daily", "amount": 50 }
  ],
  "riskFactors": "Occasional waterlogging in monsoon season near gate 2.",
  "rwaPassSystem": true,
  "photos": [],
  "status": "active",
  "operatorId": "op-demo",
  "createdAt": "2024-10-27T09:00:00.000Z",
  "updatedAt": "2024-10-28T14:32:00.000Z",
  "deleted": false,
  "activatedAt": "2024-10-28T14:32:00.000Z",
  "inactivatedAt": null,
  "deletedAt": null
}
```

## Backend framework notes

- **All field names must be camelCase**, in both requests and responses,
  matching the `Site` type above exactly. Do not translate to snake_case at
  the API boundary.
- **Django REST Framework** defaults to snake_case field names. If the
  backend is built in DRF, use
  [`djangorestframework-camel-case`](https://github.com/vbabiy/djangorestframework-camel-case)
  to convert at the serializer/renderer layer rather than changing the
  frontend or hand-rolling field name translation.
- **CORS**: the frontend and backend will run on different origins in
  development (and likely in production too). Configure CORS on the backend
  — e.g. [`django-cors-headers`](https://github.com/adamchainz/django-cors-headers)
  for a Django backend — to allow the frontend origin.
