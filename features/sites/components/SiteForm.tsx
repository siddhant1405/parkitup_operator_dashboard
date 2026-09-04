"use client"

import { useEffect, useRef, useState, type MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch, type FieldPath } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, MapPinned, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { useCreateSite, useUpdateSite } from "@/features/sites/api/mutations"
import { filesToDataUrls } from "@/features/sites/utils/photos"
import { TimeOfDayField } from "@/features/sites/components/TimeOfDayField"
import { PricingRulesField } from "@/features/sites/components/PricingRulesField"
import { SiteLocationPicker } from "@/features/sites/components/SiteLocationPicker"
import {
  internetQualityLabels,
  lightingLabels,
  parkingTypeLabels,
  posDeviceLabels,
  signageLabels,
} from "@/features/sites/utils/labels"
import {
  cameraValues,
  defaultSiteFormValues,
  entryExitValues,
  internetQualityValues,
  lightingValues,
  parkingTypeValues,
  paymentRecipientTypeValues,
  posDeviceValues,
  signageValues,
  siteFormSchema,
  surfaceValues,
  type Site,
  type SiteFormValues,
} from "@/features/sites/schemas/site"

interface SiteFormProps {
  mode: "create" | "edit"
  site?: Site
}

const STEPS: { key: string; label: string; fields: FieldPath<SiteFormValues>[] }[] = [
  {
    key: "property",
    label: "Property",
    fields: ["propertyName", "address", "gps.lat", "gps.lng"],
  },
  {
    key: "parking",
    label: "Parking configuration",
    fields: [
      "parkingType",
      "parkingTypeOther",
      "entryExit.configuration",
      "entryExit.entryGateCount",
      "entryExit.exitGateCount",
      "totalSlots",
      "operatingHours.start.time",
      "operatingHours.start.period",
      "operatingHours.end.time",
      "operatingHours.end.period",
      "peakPeriods",
      "surface",
      "rwaPassSystem",
    ],
  },
  {
    key: "security",
    label: "Security",
    fields: [
      "security.guardroom",
      "security.cameras",
      "boomBarrier",
      "anpr",
      "lighting",
      "signage",
      "posDevice",
      "vendorNotes",
      "internetQuality",
      "restrictions",
    ],
  },
  {
    key: "people",
    label: "People",
    fields: [
      "owner.name",
      "owner.phone",
      "caretaker.name",
      "caretaker.phone",
      "workerCount",
      "paymentRecipient.type",
      "paymentRecipient.registeredName",
      "gst.registered",
      "gst.gstNumber",
    ],
  },
  {
    key: "pricing",
    label: "Pricing",
    fields: ["pricingRules"],
  },
  {
    key: "risk",
    label: "Risk & photos",
    fields: ["riskFactors", "photos"],
  },
]

function toFormValues(site: Site): SiteFormValues {
  return {
    propertyName: site.propertyName,
    address: site.address,
    gps: site.gps,
    parkingType: site.parkingType,
    parkingTypeOther: site.parkingTypeOther,
    entryExit: site.entryExit,
    totalSlots: site.totalSlots,
    operatingHours: site.operatingHours,
    peakPeriods: site.peakPeriods,
    surface: site.surface,
    security: site.security,
    posDevice: site.posDevice,
    vendorNotes: site.vendorNotes ?? "",
    internetQuality: site.internetQuality,
    lighting: site.lighting,
    boomBarrier: site.boomBarrier,
    anpr: site.anpr,
    signage: site.signage,
    restrictions: site.restrictions,
    owner: site.owner,
    paymentRecipient: site.paymentRecipient,
    gst: site.gst,
    caretaker: site.caretaker,
    workerCount: site.workerCount,
    pricingRules: site.pricingRules,
    riskFactors: site.riskFactors,
    rwaPassSystem: site.rwaPassSystem,
    photos: site.photos,
  }
}

export function SiteForm({ mode, site }: SiteFormProps) {
  const router = useRouter()
  const createSite = useCreateSite()
  const updateSite = useUpdateSite(site?.id ?? "")
  const [currentStep, setCurrentStep] = useState(0)

  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: site ? toFormValues(site) : defaultSiteFormValues,
  })

  const isSubmitting = createSite.isPending || updateSite.isPending
  const parkingType = useWatch({ control: form.control, name: "parkingType" })
  const entryExitConfiguration = useWatch({
    control: form.control,
    name: "entryExit.configuration",
  })
  const photos = useWatch({ control: form.control, name: "photos" }) ?? []
  const [pendingAction, setPendingAction] = useState<"save" | "draft" | null>(
    null
  )

  function reportSaveError(err: unknown) {
    // Keep the raw error visible during field testing; the toast is user-facing.
    console.error("Failed to save site:", err)
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      toast.error(
        "Couldn't save — photos are too large for local storage. Try removing a photo or using smaller images."
      )
    } else {
      toast.error("Something went wrong while saving this site.")
    }
  }

  async function onSubmit(values: SiteFormValues) {
    setPendingAction("save")
    try {
      if (mode === "create") {
        const created = await createSite.mutateAsync(values)
        router.push(`/sites/${created.id}/review`)
      } else if (site) {
        await updateSite.mutateAsync(values)
        toast.success("Changes saved.")
        router.push(`/sites/${site.id}/review`)
      }
    } catch (err) {
      reportSaveError(err)
    } finally {
      setPendingAction(null)
    }
  }

  function onInvalid() {
    const errorKeys = Object.keys(form.formState.errors)
    const stepIndex = STEPS.findIndex((step) =>
      step.fields.some((field) => errorKeys.includes(field.split(".")[0]))
    )
    if (stepIndex !== -1 && stepIndex !== currentStep) {
      setCurrentStep(stepIndex)
    }
  }

  async function onSaveDraft(values: SiteFormValues) {
    if (!site) return
    setPendingAction("draft")
    try {
      await updateSite.mutateAsync({ ...values, status: "draft" })
      toast.success("Site saved as draft.")
      router.push("/sites")
    } catch (err) {
      reportSaveError(err)
    } finally {
      setPendingAction(null)
    }
  }

  async function handleNext(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    const valid = await form.trigger(STEPS[currentStep].fields)
    if (valid) setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1))
  }

  function handleBack(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation isn't available on this device.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("gps.lat", position.coords.latitude)
        form.setValue("gps.lng", position.coords.longitude)
        toast.success("Location captured.")
      },
      () => toast.error("Couldn't get your location.")
    )
  }

  async function handlePhotoSelect(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    try {
      const dataUrls = await filesToDataUrls(fileList)
      form.setValue("photos", [...photos, ...dataUrls])
    } catch (err) {
      console.error("Failed to process photo:", err)
      toast.error("Couldn't add that photo. Make sure it's a valid image file.")
    }
  }

  function removePhoto(index: number) {
    form.setValue(
      "photos",
      photos.filter((_, i) => i !== index)
    )
  }

  // Guard: only clear rwaPassSystem when parkingType transitions away from
  // 'society' during the session, not on initial mount/render.
  const prevParkingTypeRef = useRef(parkingType)
  useEffect(() => {
    const prev = prevParkingTypeRef.current
    prevParkingTypeRef.current = parkingType
    if (prev === "society" && parkingType !== "society") {
      form.setValue("rwaPassSystem", undefined)
    }
  }, [parkingType, form])

  useEffect(() => {
    const entryGateCount = form.getValues("entryExit.entryGateCount")

    if (entryExitConfiguration === "same") {
      const gateCount = entryGateCount >= 1 ? entryGateCount : 1
      form.setValue("entryExit.entryGateCount", gateCount, {
        shouldValidate: true,
      })
      form.setValue("entryExit.exitGateCount", gateCount, {
        shouldValidate: true,
      })
      return
    }

    if (entryGateCount < 1) {
      form.setValue("entryExit.entryGateCount", 1, { shouldValidate: true })
    }

    const exitGateCount = form.getValues("entryExit.exitGateCount")
    if (exitGateCount < 1) {
      form.setValue("entryExit.exitGateCount", 1, { shouldValidate: true })
    }
  }, [entryExitConfiguration, form])

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEPS.length - 1

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-4"
      >
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            {mode === "create" ? "Add new site" : "Edit site"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill in what you observe during the site visit.
          </p>
        </div>

        <p className="text-sm text-muted-foreground md:hidden">
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
        </p>

        <div className="flex flex-col gap-6">
          <section
            className={cn(
              "surface-card flex-col gap-4 rounded-2xl p-6",
              currentStep === 0 ? "flex" : "hidden",
              "md:flex"
            )}
          >
            <h2 className="font-heading text-base font-semibold">
              Property
            </h2>
            <FormField
              control={form.control}
              name="propertyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Sunrise Mall Parking"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full street address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={useMyLocation}
              className="h-11 w-fit sm:h-7"
            >
              <MapPinned className="h-4 w-4" />
              Use my current location
            </Button>
            <SiteLocationPicker form={form} />
          </section>

          <Separator className="hidden md:block" />

          <section
            className={cn(
              "surface-card flex-col gap-4 rounded-2xl p-6",
              currentStep === 1 ? "flex" : "hidden",
              "md:flex"
            )}
          >
            <h2 className="font-heading text-base font-semibold">
              Parking configuration
            </h2>
            <FormField
              control={form.control}
              name="parkingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parking type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parkingTypeValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {parkingTypeLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {parkingType === "other" && (
              <FormField
                control={form.control}
                name="parkingTypeOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify parking type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe the parking type"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="entryExit.configuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry / exit configuration</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {entryExitValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value === "same" ? "Same gate" : "Separate gates"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {entryExitConfiguration === "same" ? (
              <FormField
                control={form.control}
                name="entryExit.entryGateCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of gates</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(event) => {
                          const gateCount = Number(event.target.value)
                          field.onChange(gateCount)
                          form.setValue("entryExit.exitGateCount", gateCount, {
                            shouldValidate: true,
                          })
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="entryExit.entryGateCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry gates</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entryExit.exitGateCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit gates</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <FormField
              control={form.control}
              name="totalSlots"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total parking slots</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Operating hours</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TimeOfDayField
                  control={form.control}
                  name="operatingHours.start"
                  label="Opens"
                />
                <TimeOfDayField
                  control={form.control}
                  name="operatingHours.end"
                  label="Closes"
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="peakPeriods"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peak periods</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Weekday evenings, weekends"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="surface"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parking surface</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {surfaceValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value.charAt(0).toUpperCase() + value.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {parkingType === "society" && (
              <FormField
                control={form.control}
                name="rwaPassSystem"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Uses RWA / society-issued parking pass system
                    </FormLabel>
                  </FormItem>
                )}
              />
            )}
          </section>

          <Separator className="hidden md:block" />

          <section
            className={cn(
              "surface-card flex-col gap-4 rounded-2xl p-6",
              currentStep === 2 ? "flex" : "hidden",
              "md:flex"
            )}
          >
            <h2 className="font-heading text-base font-semibold">
              Security
            </h2>
            <FormField
              control={form.control}
              name="security.guardroom"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Guardroom present on site
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="security.cameras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Camera coverage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cameraValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value.charAt(0).toUpperCase() + value.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="boomBarrier"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Boom barrier</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="anpr"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    ANPR (Automatic Number Plate Recognition)
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lighting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lighting</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lightingValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {lightingLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="signage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {signageValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {signageLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="posDevice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>POS / payment device</FormLabel>
                  <div className="flex flex-col gap-2">
                    {posDeviceValues.map((value) => (
                      <label
                        key={value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={(field.value ?? []).includes(value)}
                          onCheckedChange={(checked) => {
                            const current = field.value ?? []
                            if (checked) {
                              field.onChange([...current, value])
                            } else {
                              field.onChange(
                                current.filter((v: string) => v !== value)
                              )
                            }
                          }}
                        />
                        {posDeviceLabels[value]}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vendorNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor & pricing notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. third-party company associated with this site, POS provider name, pricing model details."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="internetQuality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internet / network</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {internetQualityValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {internetQualityLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restrictions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. height limit, vehicle type restrictions"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <Separator className="hidden md:block" />

          <section
            className={cn(
              "surface-card flex-col gap-4 rounded-2xl p-6",
              currentStep === 3 ? "flex" : "hidden",
              "md:flex"
            )}
          >
            <h2 className="font-heading text-base font-semibold">People</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="owner.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="owner.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="caretaker.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caretaker name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caretaker.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caretaker phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="workerCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of workers on site</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <h3 className="text-sm font-semibold">Payment recipient</h3>
            <p className="text-xs text-muted-foreground">
              The individual or company that will receive parking revenue — may differ from the property owner.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="paymentRecipient.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentRecipientTypeValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentRecipient.registeredName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registered name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Sunrise Parking Pvt Ltd"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gst.gstNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST No. (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 07AABCU9603R1Z1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gst.registered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    GST registered
                  </FormLabel>
                </FormItem>
              )}
            />
          </section>

          <Separator className="hidden md:block" />

          <section
            className={cn(
              "surface-card flex-col gap-4 rounded-2xl p-6",
              currentStep === 4 ? "flex" : "hidden",
              "md:flex"
            )}
          >
            <h2 className="font-heading text-base font-semibold">Pricing</h2>
            <PricingRulesField control={form.control} />
            {form.formState.errors.pricingRules?.root?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.pricingRules.root.message}
              </p>
            )}
          </section>

          <Separator className="hidden md:block" />

          <section
            className={cn(
              "surface-card flex-col gap-4 rounded-2xl p-6",
              currentStep === 5 ? "flex" : "hidden",
              "md:flex"
            )}
          >
            <h2 className="font-heading text-base font-semibold">
              Risk & photos
            </h2>
            <FormField
              control={form.control}
              name="riskFactors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk factors</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note any hazards, disputes, access issues, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Photos</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoSelect(e.target.files)}
              />
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`Site photo ${index + 1}`}
                        className="photo-frame aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 inset-x-0 border-t bg-background/95 p-4 backdrop-blur-sm">
          {/* Desktop: full form, always-present action bar */}
          <div className="mx-auto hidden max-w-2xl flex-wrap gap-3 md:flex">
            <Button
              type="button"
              variant="outline"
              className="min-w-[8.5rem] flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            {mode === "edit" && (
              <Button
                type="button"
                variant="outline"
                className="min-w-[8.5rem] flex-1"
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSaveDraft)}
              >
                {pendingAction === "draft" && isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save as draft
              </Button>
            )}
            <Button
              type="submit"
              className="min-w-[8.5rem] flex-1"
              disabled={isSubmitting}
            >
              {pendingAction === "save" && isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {mode === "create" ? "Save and review" : "Save changes"}
            </Button>
          </div>

          {/* Mobile: step-through wizard controls */}
          <div className="mx-auto flex max-w-2xl gap-3 md:hidden">
            {!isFirstStep && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleBack}
              >
                Back
              </Button>
            )}
            {isLastStep ? (
              <Button
                key="mobile-submit"
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {pendingAction === "save" && isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Save and review" : "Save changes"}
              </Button>
            ) : (
              <Button
                key="mobile-next"
                type="button"
                className="flex-1"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}
