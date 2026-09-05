import { z } from "zod"

export const parkingTypeValues = [
  "residential",
  "society",
  "commercial",
  "corporate",
  "mcd",
  "standalone",
  "free-parking",
  "other",
] as const

export const entryExitValues = ["same", "separate"] as const

export const surfaceValues = ["covered", "uncovered", "fenced"] as const

export const cameraValues = ["covered", "open", "none"] as const

export const siteStatusValues = [
  "draft",
  "submitted",
  "active",
  "inactive",
] as const

export const timePeriodValues = ["AM", "PM"] as const

export const dayTypeValues = ["weekday", "weekend", "holiday", "all"] as const

export const rateTypeValues = ["hourly", "daily", "one-time"] as const

export const posDeviceValues = [
  "manual",
  "pos-machine",
  "mobile-app",
] as const

export const paymentRecipientTypeValues = ["individual", "company"] as const

export const internetQualityValues = [
  "unavailable",
  "poor",
  "good",
  "excellent",
] as const

export const lightingValues = ["none", "partial", "full"] as const

export const signageValues = ["none", "partial", "full"] as const

const phoneRegex = /^\d{10}$/
const phoneErrorMessage = "Enter a valid 10-digit phone number."
const timeRegex = /^([1-9]|1[0-2]):[0-5]\d$/

function requireParkingTypeOther(data: { parkingType: string; parkingTypeOther?: string }) {
  return (
    data.parkingType !== "other" ||
    (!!data.parkingTypeOther && data.parkingTypeOther.trim().length > 0)
  )
}

const parkingTypeOtherRefinement = {
  message: "Please specify the parking type",
  path: ["parkingTypeOther"],
}

const gstSchema = z.object({
  registered: z.boolean(),
  gstNumber: z.string().optional(),
})

const timeOfDaySchema = z.object({
  time: z.string().regex(timeRegex, "Use H:MM, e.g. 9:00"),
  period: z.enum(timePeriodValues),
})

export type TimeOfDay = z.infer<typeof timeOfDaySchema>

const pricingRuleSchema = z.object({
  id: z.string(),
  dayType: z.enum(dayTypeValues),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  rateType: z.enum(rateTypeValues),
  amount: z.coerce.number().min(0),
})

export type PricingRule = z.infer<typeof pricingRuleSchema>

const entryExitSchema = z
  .object({
    configuration: z.enum(entryExitValues),
    entryGateCount: z.coerce.number().int().min(1),
    exitGateCount: z.coerce.number().int().min(1),
  })
  .superRefine((value, ctx) => {
    if (
      value.configuration === "same" &&
      value.entryGateCount !== value.exitGateCount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Entry and exit counts must match for same gate sites.",
        path: ["exitGateCount"],
      })
    }
  })

const siteObjectSchema = z.object({
  id: z.string(),
  propertyName: z.string().min(1, "Property name is required"),
  address: z.string().min(1, "Address is required"),
  gps: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  parkingType: z.enum(parkingTypeValues),
  parkingTypeOther: z.string().optional(),
  entryExit: entryExitSchema,
  totalSlots: z.coerce.number().int().min(1, "Must be at least 1"),
  operatingHours: z.object({
    start: timeOfDaySchema,
    end: timeOfDaySchema,
  }),
  peakPeriods: z.string().min(1, "Peak periods are required"),
  surface: z.enum(surfaceValues),
  security: z.object({
    guardroom: z.boolean(),
    cameras: z.enum(cameraValues),
  }),
  posDevice: z.array(z.enum(posDeviceValues)).min(1, "Select at least one payment method"),
  vendorNotes: z.string().optional(),
  competitorNotes: z.string().optional(),
  internetQuality: z.enum(internetQualityValues),
  lighting: z.enum(lightingValues),
  boomBarrier: z.boolean(),
  anpr: z.boolean(),
  signage: z.enum(signageValues),
  restrictions: z.string(),
  owner: z.object({
    name: z.string().min(1, "Owner name is required"),
    phone: z.string().regex(phoneRegex, phoneErrorMessage),
  }),
  paymentRecipient: z.object({
    type: z.enum(paymentRecipientTypeValues),
    registeredName: z.string().optional(),
  }),
  gst: gstSchema,
  caretaker: z.object({
    name: z.string().min(1, "Caretaker name is required"),
    phone: z.string().regex(phoneRegex, phoneErrorMessage),
  }),
  workerCount: z.coerce.number().int().min(0),
  pricingRules: z
    .array(pricingRuleSchema)
    .min(1, "Add at least one pricing rule"),
  riskFactors: z.string(),
  rwaPassSystem: z.boolean().optional(),
  photos: z.array(z.string()),
  // 'active' / 'inactive' are set by a manager via the admin dashboard, not by
  // operators. This app's localStorage mock is separate from the admin
  // dashboard's — status changes made in admin won't reflect here until a
  // real shared backend exists.
  status: z.enum(siteStatusValues),
  operatorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deleted: z.boolean().default(false),
  // Stamped exactly once when status first becomes 'active'/'inactive'/deleted.
  // activatedAt and inactivatedAt are written by the admin dashboard's approval
  // flow, not by this app; deletedAt is written by this app's deleteSite. All
  // three must stay on this type since both apps read/write the same Site
  // record once a real shared backend exists.
  activatedAt: z.string().optional(),
  inactivatedAt: z.string().optional(),
  deletedAt: z.string().optional(),
})

export const siteSchema = siteObjectSchema.refine(
  requireParkingTypeOther,
  parkingTypeOtherRefinement
)

export type Site = z.infer<typeof siteSchema>

export const siteFormSchema = siteObjectSchema
  .omit({
    id: true,
    status: true,
    operatorId: true,
    createdAt: true,
    updatedAt: true,
    deleted: true,
    activatedAt: true,
    inactivatedAt: true,
    deletedAt: true,
  })
  .refine(requireParkingTypeOther, parkingTypeOtherRefinement)

export type SiteFormValues = z.infer<typeof siteFormSchema>

export const defaultSiteFormValues: SiteFormValues = {
  propertyName: "",
  address: "",
  gps: { lat: 0, lng: 0 },
  parkingType: "residential",
  parkingTypeOther: "",
  entryExit: {
    configuration: "same",
    entryGateCount: 1,
    exitGateCount: 1,
  },
  totalSlots: 1,
  operatingHours: {
    start: { time: "9:00", period: "AM" },
    end: { time: "9:00", period: "PM" },
  },
  peakPeriods: "",
  surface: "uncovered",
  security: { guardroom: false, cameras: "none" },
  posDevice: ["manual"],
  vendorNotes: "",
  competitorNotes: "",
  internetQuality: "good",
  lighting: "none",
  boomBarrier: false,
  anpr: false,
  signage: "none",
  restrictions: "",
  owner: { name: "", phone: "" },
  paymentRecipient: { type: "individual", registeredName: "" },
  gst: { registered: false, gstNumber: "" },
  caretaker: { name: "", phone: "" },
  workerCount: 0,
  pricingRules: [],
  riskFactors: "",
  rwaPassSystem: undefined,
  photos: [],
}
