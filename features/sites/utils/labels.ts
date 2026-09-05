import type {
  dayTypeValues,
  internetQualityValues,
  lightingValues,
  parkingTypeValues,
  posDeviceValues,
  rateTypeValues,
  signageValues,
} from "@/features/sites/schemas/site"

export const parkingTypeLabels: Record<
  (typeof parkingTypeValues)[number],
  string
> = {
  residential: "Residential",
  society: "Society",
  commercial: "Commercial",
  corporate: "Corporate / Office",
  mcd: "MCD (Municipal)",
  standalone: "Standalone",
  "free-parking": "Free parking",
  other: "Other",
}

export const posDeviceLabels: Record<(typeof posDeviceValues)[number], string> = {
  manual: "Manual / cash",
  "pos-machine": "POS machine",
  "mobile-app": "Mobile app",
}

export const internetQualityLabels: Record<
  (typeof internetQualityValues)[number],
  string
> = {
  unavailable: "Unavailable",
  poor: "Poor",
  good: "Good",
  excellent: "Excellent",
}

export const lightingLabels: Record<(typeof lightingValues)[number], string> = {
  none: "None",
  partial: "Partial",
  full: "Full",
}

export const signageLabels: Record<(typeof signageValues)[number], string> = {
  none: "None",
  partial: "Partial",
  full: "Full",
}

export const dayTypeLabels: Record<(typeof dayTypeValues)[number], string> = {
  weekday: "Weekday",
  weekend: "Weekend",
  holiday: "Holiday",
  all: "All days",
}

export const rateTypeLabels: Record<(typeof rateTypeValues)[number], string> = {
  hourly: "Hourly",
  daily: "Daily",
  "one-time": "One-time",
}
