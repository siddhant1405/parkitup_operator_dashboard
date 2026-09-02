import type { PricingRule, TimeOfDay } from "@/features/sites/schemas/site"

export function formatTimeOfDay(value: TimeOfDay) {
  return `${value.time} ${value.period}`
}

export function formatOperatingHours(hours: { start: TimeOfDay; end: TimeOfDay }) {
  return `${formatTimeOfDay(hours.start)} - ${formatTimeOfDay(hours.end)}`
}

export function formatPricingAmount(rule: Pick<PricingRule, "rateType" | "amount">) {
  switch (rule.rateType) {
    case "hourly":
      return `₹${rule.amount}/hr`
    case "daily":
      return `₹${rule.amount}/day`
    case "one-time":
      return `₹${rule.amount}`
  }
}
