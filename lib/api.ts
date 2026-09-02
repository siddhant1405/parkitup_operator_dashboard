import { CURRENT_OPERATOR_ID } from "@/lib/constants"
import type { Site, SiteFormValues } from "@/types/site"

const DELAY_MS = 300
const STORAGE_KEY = "parkitup_sites"

type LegacySite = Omit<Site, "entryExit" | "anpr"> & {
  entryExit: LegacyEntryExit
  anpr?: boolean
  vendorNotes?: string
}

type LegacyEntryExit =
  | Site["entryExit"]
  | Site["entryExit"]["configuration"]
  | {
      configuration: Site["entryExit"]["configuration"]
      gateCount: number
      entryGateCount?: number
      exitGateCount?: number
    }

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readAll(): Site[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  const sites = (JSON.parse(raw) as LegacySite[]).map(normalizeSite)
  writeAll(sites)
  return sites
}

function writeAll(sites: Site[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sites))
}

function generateId() {
  return `site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeEntryExit(
  entryExit: LegacySite["entryExit"]
): Site["entryExit"] {
  if (typeof entryExit === "string") {
    return {
      configuration: entryExit,
      entryGateCount: 1,
      exitGateCount: 1,
    }
  }

  const fallbackGateCount =
    "gateCount" in entryExit
      ? getPositiveInteger(entryExit.gateCount, 1)
      : 1
  const entryGateCount = getPositiveInteger(
    entryExit.entryGateCount,
    fallbackGateCount
  )
  const exitGateCount =
    entryExit.configuration === "same"
      ? entryGateCount
      : getPositiveInteger(entryExit.exitGateCount, fallbackGateCount)

  return {
    configuration: entryExit.configuration,
    entryGateCount,
    exitGateCount,
  }
}

function getPositiveInteger(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback
}

function normalizeSite(site: LegacySite): Site {
  return {
    ...site,
    entryExit: normalizeEntryExit(site.entryExit),
    anpr: site.anpr ?? false,
    vendorNotes: site.vendorNotes ?? "",
  }
}

export async function getSites(): Promise<Site[]> {
  await sleep(DELAY_MS)
  return readAll()
    .filter((site) => site.operatorId === CURRENT_OPERATOR_ID && !site.deleted)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getSite(id: string): Promise<Site | undefined> {
  await sleep(DELAY_MS)
  return readAll().find((site) => site.id === id)
}

export async function createSite(values: SiteFormValues): Promise<Site> {
  await sleep(DELAY_MS)
  const now = new Date().toISOString()
  const site: Site = {
    ...values,
    id: generateId(),
    status: "draft",
    operatorId: CURRENT_OPERATOR_ID,
    createdAt: now,
    updatedAt: now,
    deleted: false,
  }
  const sites = readAll()
  sites.push(site)
  writeAll(sites)
  return site
}

export async function updateSite(
  id: string,
  values: Partial<SiteFormValues> & { status?: Site["status"] }
): Promise<Site> {
  await sleep(DELAY_MS)
  const sites = readAll()
  const index = sites.findIndex((site) => site.id === id)
  if (index === -1) {
    throw new Error(`Site ${id} not found`)
  }
  const updated: Site = {
    ...sites[index],
    ...values,
    updatedAt: new Date().toISOString(),
  }
  sites[index] = updated
  writeAll(sites)
  return updated
}

export async function deleteSite(id: string): Promise<void> {
  await sleep(DELAY_MS)
  const sites = readAll()
  const index = sites.findIndex((site) => site.id === id)
  if (index === -1) {
    throw new Error(`Site ${id} not found`)
  }
  sites[index] = {
    ...sites[index],
    deleted: true,
    updatedAt: new Date().toISOString(),
  }
  writeAll(sites)
}
