"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
  Pencil,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useUpdateSite } from "@/features/sites/api/mutations"
import { DeleteSiteButton } from "./DeleteSiteButton"
import { SiteStatusBadge } from "./SiteStatusBadge"
import {
  dayTypeLabels,
  internetQualityLabels,
  lightingLabels,
  parkingTypeLabels,
  posDeviceLabels,
  rateTypeLabels,
  signageLabels,
} from "@/features/sites/utils/labels"
import {
  formatOperatingHours,
  formatPricingAmount,
} from "@/features/sites/utils/format"
import type { Site } from "@/types/site"

interface SiteDetailProps {
  mode: "review" | "view"
  site: Site
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function PhotoGallery({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (photos.length === 0) {
    return (
      <div className="stripe-texture flex aspect-square w-full max-w-md flex-col items-center justify-center gap-2 rounded-lg bg-muted text-muted-foreground">
        <ImageOff className="h-8 w-8" />
        <p className="text-sm">No photos</p>
      </div>
    )
  }

  const hasMultiplePhotos = photos.length > 1

  function goTo(next: number) {
    setIndex((next + photos.length) % photos.length)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
      <div className="photo-frame-lg relative aspect-square w-full overflow-hidden bg-muted">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[index]}
            alt={`Site photo ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </button>

        {hasMultiplePhotos && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 left-2 size-8 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
              onClick={() => goTo(index - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous photo</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-2 size-8 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
              onClick={() => goTo(index + 1)}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next photo</span>
            </Button>
          </>
        )}
      </div>

      {hasMultiplePhotos && (
        <div className="flex items-center justify-center gap-1.5">
          {photos.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              onClick={() => goTo(dotIndex)}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all",
                  dotIndex === index
                    ? "w-4 bg-foreground"
                    : "w-1.5 bg-muted-foreground/40"
                )}
              />
              <span className="sr-only">Go to photo {dotIndex + 1}</span>
            </button>
          ))}
        </div>
      )}

      {hasMultiplePhotos && (
        <div className="flex flex-wrap justify-center gap-2">
          {photos.map((photo, thumbIndex) => (
            <button
              key={thumbIndex}
              type="button"
              onClick={() => goTo(thumbIndex)}
              className={cn(
                "photo-frame h-16 w-16 shrink-0 overflow-hidden ring-2 transition-colors",
                thumbIndex === index
                  ? "ring-primary"
                  : "ring-transparent hover:ring-foreground/20"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`Site photo ${thumbIndex + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="sr-only">Site photo</DialogTitle>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[index]}
              alt={`Site photo ${index + 1}`}
              className="photo-frame max-h-[70vh] w-full object-contain"
            />
            {hasMultiplePhotos && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 left-2 size-11 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white sm:size-7"
                  onClick={() => goTo(index - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous photo</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-2 size-11 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white sm:size-7"
                  onClick={() => goTo(index + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next photo</span>
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty = value === undefined || value === null || value === ""
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{isEmpty ? "—" : value}</dd>
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="surface-card flex flex-col gap-4 rounded-2xl p-6">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function SiteDetail({ mode, site }: SiteDetailProps) {
  const router = useRouter()
  const updateSite = useUpdateSite(site.id)
  const [pendingAction, setPendingAction] = useState<
    "submit" | "draft" | null
  >(null)

  async function handleConfirmSubmit() {
    setPendingAction("submit")
    try {
      await updateSite.mutateAsync({ status: "submitted" })
      toast.success("Site submitted.")
      router.push("/sites")
    } catch {
      toast.error("Couldn't submit this site. Try again.")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleSaveDraft() {
    setPendingAction("draft")
    try {
      await updateSite.mutateAsync({ status: "draft" })
      toast.success("Site saved as draft.")
      router.push("/sites")
    } catch {
      toast.error("Couldn't save this site. Try again.")
    } finally {
      setPendingAction(null)
    }
  }

  const parkingTypeLabel =
    site.parkingType === "other"
      ? site.parkingTypeOther || "Other"
      : parkingTypeLabels[site.parkingType]

  const operatingHoursLabel = formatOperatingHours(site.operatingHours)
  const entryExitLabel =
    site.entryExit.configuration === "same"
      ? `Same gate (${site.entryExit.entryGateCount})`
      : `Separate gates (Entry: ${site.entryExit.entryGateCount}, Exit: ${site.entryExit.exitGateCount})`

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-5xl font-bold tracking-tight">
              {site.propertyName}
            </h1>
            <SiteStatusBadge status={site.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{site.address}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {site.gps.lat.toFixed(5)}, {site.gps.lng.toFixed(5)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {mode === "review" ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/sites/${site.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={updateSite.isPending}
              >
                {pendingAction === "draft" && updateSite.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save as draft
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSubmit}
                disabled={updateSite.isPending}
              >
                {pendingAction === "submit" && updateSite.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Confirm and submit
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/sites/${site.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <DeleteSiteButton
                siteId={site.id}
                size="sm"
                deleteDisabled={site.status !== "draft"}
                deleteDisabledReason={
                  site.status === "submitted"
                    ? "This site has been submitted and is awaiting manager review — it can no longer be deleted."
                    : "This site has been reviewed by a manager and can no longer be deleted."
                }
              />
            </>
          )}
        </div>
      </div>

      <PhotoGallery photos={site.photos} />

      <DetailSection title="Parking configuration">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Parking type" value={parkingTypeLabel} />
          <Field label="Entry / exit" value={entryExitLabel} />
          <Field label="Total slots" value={site.totalSlots} />
          <Field label="Operating hours" value={operatingHoursLabel} />
          <Field label="Peak periods" value={site.peakPeriods} />
          <Field label="Surface" value={capitalize(site.surface)} />
          {site.parkingType === "society" && site.rwaPassSystem != null && (
            <Field
              label="RWA / society pass system"
              value={site.rwaPassSystem ? "Yes" : "No"}
            />
          )}
        </dl>
      </DetailSection>

      <DetailSection title="Security & site conditions">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Guardroom"
            value={site.security.guardroom ? "Yes" : "No"}
          />
          <Field label="Cameras" value={capitalize(site.security.cameras)} />
          <Field
            label="Boom barrier"
            value={site.boomBarrier ? "Yes" : "No"}
          />
          <Field label="ANPR" value={site.anpr ? "Yes" : "No"} />
          <Field label="Lighting" value={lightingLabels[site.lighting]} />
          <Field label="Signage" value={signageLabels[site.signage]} />
          <Field
            label="POS / payment device"
            value={site.posDevice.map((v) => posDeviceLabels[v]).join(", ")}
          />
          <Field label="Vendor & pricing notes" value={site.vendorNotes} />
          <Field
            label="Internet / network"
            value={internetQualityLabels[site.internetQuality]}
          />
        </dl>
        <Field label="Restrictions" value={site.restrictions} />
      </DetailSection>

      <DetailSection title="People">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Owner" value={site.owner.name} />
          <Field label="Owner phone" value={site.owner.phone} />
          <Field label="Caretaker" value={site.caretaker.name} />
          <Field label="Caretaker phone" value={site.caretaker.phone} />
          <Field label="Workers on site" value={site.workerCount} />
        </dl>
        <Separator />
        <h3 className="text-sm font-semibold">Payment recipient</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Recipient type"
            value={capitalize(site.paymentRecipient.type)}
          />
          <Field
            label="Registered name"
            value={site.paymentRecipient.registeredName}
          />
        </dl>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="GST No." value={site.gst.gstNumber} />
          <Field
            label="GST status"
            value={site.gst.registered ? "GST registered" : "Not GST registered"}
          />
        </dl>
      </DetailSection>

      <DetailSection title="Pricing">
        {site.pricingRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pricing rules logged.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {site.pricingRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {dayTypeLabels[rule.dayType]}
                    {rule.startTime || rule.endTime
                      ? ` (${rule.startTime || "—"} – ${rule.endTime || "—"})`
                      : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {rateTypeLabels[rule.rateType]}
                  </p>
                </div>
                <p className="font-medium">{formatPricingAmount(rule)}</p>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Risk factors">
        <Field label="Risk factors" value={site.riskFactors} />
      </DetailSection>
    </div>
  )
}
