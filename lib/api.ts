import { CURRENT_OPERATOR_ID } from "@/lib/constants"
import type { Site, SiteFormValues } from "@/types/site"

// Mock data boundary:
// This file intentionally stores sites in browser localStorage while the
// backend is pending. Preserve the exported function contracts when replacing
// it with real API calls: getSites, getSite, createSite, updateSite, deleteSite.
const DELAY_MS = 300
const STORAGE_KEY = "parkitup_sites"

type LegacySite = Omit<Site, "entryExit" | "anpr" | "posDevice"> & {
  entryExit: LegacyEntryExit
  anpr?: boolean
  vendorNotes?: string
  posDevice?: string | string[]
  gst?: Site["gst"]
  paymentRecipient?: Site["paymentRecipient"]
  rwaPassSystem?: boolean
  approvalStatus?: "pending" | "active" | "inactive"
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
  if (!raw) {
    // Seed with sample data on first load
    const seeds = createSeedSites()
    writeAll(seeds)
    return seeds
  }

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
  // Migrate posDevice: string (old format) → string[]
  const rawPos = site.posDevice
  const posDevice: Site["posDevice"] = Array.isArray(rawPos)
    ? (rawPos as Site["posDevice"])
    : typeof rawPos === "string"
      ? [rawPos as Site["posDevice"][number]]
      : (["none"] as unknown as Site["posDevice"])

  const { approvalStatus, ...rest } = site

  // Migrate the old status + approvalStatus split into a single status field:
  // draft stays draft; submitted with no/'pending' approvalStatus stays
  // submitted; approvalStatus 'active'/'inactive' becomes the site's status.
  const status: Site["status"] =
    approvalStatus === "active" || approvalStatus === "inactive"
      ? approvalStatus
      : site.status

  return {
    ...rest,
    entryExit: normalizeEntryExit(site.entryExit),
    anpr: site.anpr ?? false,
    vendorNotes: site.vendorNotes ?? "",
    posDevice,
    gst: site.gst ?? { registered: false, gstNumber: "" },
    paymentRecipient: site.paymentRecipient ?? {
      type: "individual",
      registeredName: "",
    },
    rwaPassSystem: site.rwaPassSystem,
    status,
  }
}

// DELAY_MS simulates network latency so loading states are exercised in the
// UI even though calls are actually synchronous localStorage reads/writes.

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

// New sites always start life as 'draft', owned by the hardcoded
// CURRENT_OPERATOR_ID (see lib/constants.ts), with id/timestamps generated
// here rather than by a server.
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
  values: Partial<SiteFormValues> & {
    status?: Site["status"]
  }
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
  const deletedAt = new Date().toISOString()
  sites[index] = {
    ...sites[index],
    deleted: true,
    deletedAt,
    updatedAt: deletedAt,
  }
  writeAll(sites)
}

export async function undeleteSite(id: string): Promise<void> {
  await sleep(DELAY_MS)
  const sites = readAll()
  const index = sites.findIndex((site) => site.id === id)
  if (index === -1) {
    throw new Error(`Site ${id} not found`)
  }
  sites[index] = {
    ...sites[index],
    deleted: false,
    updatedAt: new Date().toISOString(),
  }
  writeAll(sites)
}

// ---------------------------------------------------------------------------
// Seed data — realistic sample sites for first-time users.
// ---------------------------------------------------------------------------

function createSeedSites(): Site[] {
  const now = new Date().toISOString()
  const base = {
    operatorId: CURRENT_OPERATOR_ID,
    createdAt: now,
    updatedAt: now,
    deleted: false,
  }

  return [
    {
      ...base,
      id: "seed-society-rwa",
      propertyName: "Greenview Apartments",
      address: "B-12, Sector 56, Gurugram, Haryana 122011",
      gps: { lat: 28.4231, lng: 77.0430 },
      parkingType: "society",
      parkingTypeOther: "",
      entryExit: { configuration: "same", entryGateCount: 2, exitGateCount: 2 },
      totalSlots: 120,
      operatingHours: {
        start: { time: "6:00", period: "AM" },
        end: { time: "11:00", period: "PM" },
      },
      peakPeriods: "Weekday evenings 6-9 PM",
      surface: "covered",
      security: { guardroom: true, cameras: "covered" },
      posDevice: ["manual", "mobile-app"],
      vendorNotes: "Society RWA manages parking passes internally.",
      internetQuality: "good",
      lighting: "full",
      boomBarrier: true,
      anpr: false,
      signage: "partial",
      restrictions: "No heavy vehicles. Visitor passes required after 10 PM.",
      owner: { name: "Rajesh Kumar", phone: "9876543210" },
      paymentRecipient: { type: "company", registeredName: "Greenview RWA" },
      gst: { registered: true, gstNumber: "06AADCG1234M1Z5" },
      caretaker: { name: "Suresh Yadav", phone: "9812345678" },
      workerCount: 4,
      pricingRules: [
        { id: "pr-1", dayType: "all", rateType: "daily", amount: 50 },
      ],
      riskFactors: "Occasional waterlogging in monsoon season near gate 2.",
      rwaPassSystem: true,
      photos: [],
      status: "active",
    },
    {
      ...base,
      id: "seed-society-no-rwa",
      propertyName: "Palm Heights Society",
      address: "A-7, Vasant Kunj, New Delhi 110070",
      gps: { lat: 28.5208, lng: 77.1537 },
      parkingType: "society",
      parkingTypeOther: "",
      entryExit: { configuration: "separate", entryGateCount: 1, exitGateCount: 1 },
      totalSlots: 60,
      operatingHours: {
        start: { time: "7:00", period: "AM" },
        end: { time: "10:00", period: "PM" },
      },
      peakPeriods: "Weekend mornings",
      surface: "uncovered",
      security: { guardroom: true, cameras: "open" },
      posDevice: ["manual"],
      vendorNotes: "",
      internetQuality: "poor",
      lighting: "partial",
      boomBarrier: false,
      anpr: false,
      signage: "none",
      restrictions: "Two-wheelers only in basement level.",
      owner: { name: "Meera Sharma", phone: "9988776655" },
      paymentRecipient: { type: "individual", registeredName: "" },
      gst: { registered: false, gstNumber: "" },
      caretaker: { name: "Dinesh Gupta", phone: "9871234567" },
      workerCount: 2,
      pricingRules: [
        { id: "pr-2", dayType: "weekday", rateType: "hourly", amount: 20 },
        { id: "pr-3", dayType: "weekend", rateType: "hourly", amount: 30 },
      ],
      riskFactors: "",
      rwaPassSystem: false,
      photos: [],
      status: "draft",
    },
    {
      ...base,
      id: "seed-commercial-gst",
      propertyName: "Sunrise Mall Parking",
      address: "Plot 5, MG Road, Bengaluru, Karnataka 560001",
      gps: { lat: 12.9753, lng: 77.6066 },
      parkingType: "commercial",
      parkingTypeOther: "",
      entryExit: { configuration: "separate", entryGateCount: 2, exitGateCount: 2 },
      totalSlots: 350,
      operatingHours: {
        start: { time: "8:00", period: "AM" },
        end: { time: "11:00", period: "PM" },
      },
      peakPeriods: "Weekends and public holidays",
      surface: "covered",
      security: { guardroom: true, cameras: "covered" },
      posDevice: ["pos-machine", "mobile-app"],
      vendorNotes: "POS provider: PayNearby. Monthly reconciliation with mall admin.",
      internetQuality: "excellent",
      lighting: "full",
      boomBarrier: true,
      anpr: true,
      signage: "full",
      restrictions: "Max height 1.8m for basement levels.",
      owner: { name: "Vikram Patel", phone: "9845123456" },
      paymentRecipient: {
        type: "company",
        registeredName: "Sunrise Mall Management Pvt Ltd",
      },
      gst: { registered: true, gstNumber: "29AAFCS5678N1Z2" },
      caretaker: { name: "Arun Nair", phone: "9845678901" },
      workerCount: 8,
      pricingRules: [
        { id: "pr-4", dayType: "weekday", rateType: "hourly", amount: 40 },
        { id: "pr-5", dayType: "weekend", rateType: "hourly", amount: 60 },
      ],
      riskFactors: "High theft risk — cameras cover only 70% of basement.",
      photos: [],
      status: "inactive",
    },
    {
      ...base,
      id: "seed-standalone",
      propertyName: "Station Road Open Lot",
      address: "Near Platform 1, Jaipur Railway Station, Jaipur 302006",
      gps: { lat: 26.9199, lng: 75.7878 },
      parkingType: "standalone",
      parkingTypeOther: "",
      entryExit: { configuration: "same", entryGateCount: 1, exitGateCount: 1 },
      totalSlots: 45,
      operatingHours: {
        start: { time: "5:00", period: "AM" },
        end: { time: "11:00", period: "PM" },
      },
      peakPeriods: "Festival seasons, early mornings",
      surface: "uncovered",
      security: { guardroom: false, cameras: "none" },
      posDevice: ["manual"],
      vendorNotes: "Cash only. No digital payments accepted.",
      internetQuality: "unavailable",
      lighting: "none",
      boomBarrier: false,
      anpr: false,
      signage: "partial",
      restrictions: "No overnight parking.",
      owner: { name: "Gopal Joshi", phone: "9414123456" },
      paymentRecipient: { type: "individual", registeredName: "Gopal Joshi" },
      gst: { registered: false, gstNumber: "" },
      caretaker: { name: "Mohan Lal", phone: "9414654321" },
      workerCount: 1,
      pricingRules: [
        { id: "pr-6", dayType: "all", rateType: "one-time", amount: 30 },
      ],
      riskFactors: "Unlit at night. Dispute with neighboring shop over boundary.",
      photos: [],
      status: "draft",
    },
    {
      ...base,
      id: "seed-corporate-submitted",
      propertyName: "TechPark Tower B Parking",
      address: "Survey 15, Whitefield, Bengaluru, Karnataka 560066",
      gps: { lat: 12.9698, lng: 77.7500 },
      parkingType: "corporate",
      parkingTypeOther: "",
      entryExit: { configuration: "separate", entryGateCount: 1, exitGateCount: 1 },
      totalSlots: 200,
      operatingHours: {
        start: { time: "7:00", period: "AM" },
        end: { time: "10:00", period: "PM" },
      },
      peakPeriods: "Weekday mornings 8-10 AM",
      surface: "covered",
      security: { guardroom: true, cameras: "covered" },
      posDevice: ["pos-machine"],
      vendorNotes: "Managed by facility team. RFID tags issued to tenants.",
      internetQuality: "excellent",
      lighting: "full",
      boomBarrier: true,
      anpr: true,
      signage: "full",
      restrictions: "Tenant vehicles only during business hours.",
      owner: { name: "Priya Reddy", phone: "9900112233" },
      paymentRecipient: {
        type: "company",
        registeredName: "TechPark Facilities Pvt Ltd",
      },
      gst: { registered: true, gstNumber: "29BBHPT4567K1Z8" },
      caretaker: { name: "Kiran Das", phone: "9900445566" },
      workerCount: 6,
      pricingRules: [
        { id: "pr-7", dayType: "weekday", rateType: "daily", amount: 100 },
      ],
      riskFactors: "",
      photos: [],
      status: "submitted",
    },
    {
      ...base,
      id: "seed-pacific-mall-nsp",
      propertyName: "Pacific Mall NSP",
      address: "Sector 18, Noida, Uttar Pradesh 201301",
      gps: { lat: 28.5895, lng: 77.3830 },
      parkingType: "commercial",
      parkingTypeOther: "",
      entryExit: { configuration: "separate", entryGateCount: 3, exitGateCount: 3 },
      totalSlots: 500,
      operatingHours: {
        start: { time: "9:00", period: "AM" },
        end: { time: "11:00", period: "PM" },
      },
      peakPeriods: "Weekends 11 AM - 9 PM",
      surface: "covered",
      security: { guardroom: true, cameras: "covered" },
      posDevice: ["pos-machine", "mobile-app"],
      vendorNotes: "Prime shopping destination. CCTV in all zones. Rapid payment system.",
      internetQuality: "excellent",
      lighting: "full",
      boomBarrier: true,
      anpr: true,
      signage: "full",
      restrictions: "EV charging available. No heavy commercial vehicles.",
      owner: { name: "Amit Singh", phone: "9876543210" },
      paymentRecipient: {
        type: "company",
        registeredName: "Pacific Mall Management Ltd",
      },
      gst: { registered: true, gstNumber: "09AABCP1234A1Z0" },
      caretaker: { name: "Rahul Kumar", phone: "9876543211" },
      workerCount: 12,
      pricingRules: [
        { id: "pr-8", dayType: "weekday", rateType: "hourly", amount: 50 },
        { id: "pr-9", dayType: "weekend", rateType: "hourly", amount: 75 },
        { id: "pr-10", dayType: "holiday", rateType: "hourly", amount: 75 },
      ],
      riskFactors: "",
      rwaPassSystem: false,
      photos: [],
      status: "active",
    },
  ]
}
