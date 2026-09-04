"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Camera,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImageOff,
  MapPin,
  Pencil,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorMessage } from "@/components/shared/ErrorMessage"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSites } from "@/features/sites/api/queries"
import { parkingTypeLabels } from "@/features/sites/utils/labels"
import { parkingTypeIcons } from "@/features/sites/utils/icons"
import { formatOperatingHours } from "@/features/sites/utils/format"
import type { Site } from "@/types/site"

import { DeleteSiteButton } from "./DeleteSiteButton"
import { SiteStatusBadge } from "./SiteStatusBadge"

function SiteCard({ site }: { site: Site }) {
  const router = useRouter()
  const [photoIndex, setPhotoIndex] = useState(0)
  const photos = site.photos
  const hasMultiplePhotos = photos.length > 1
  const currentPhoto = photos[photoIndex]
  const ParkingTypeIcon = parkingTypeIcons[site.parkingType]
  const parkingTypeLabel =
    site.parkingType === "other"
      ? site.parkingTypeOther || "Other"
      : parkingTypeLabels[site.parkingType]
  const deleteBlocked = site.status !== "draft"
  const deleteBlockedReason =
    site.status === "submitted"
      ? "This site has been submitted and is awaiting manager review — it can no longer be deleted."
      : "This site has been reviewed by a manager and can no longer be deleted."

  function goToPhoto(event: React.MouseEvent, next: number) {
    event.stopPropagation()
    event.preventDefault()
    setPhotoIndex((next + photos.length) % photos.length)
  }

  return (
    <Link
      href={`/sites/${site.id}`}
      className="surface-card surface-card-interactive group block overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-[16/10] w-full bg-muted stripe-texture">
        {currentPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentPhoto}
            alt={site.propertyName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <ImageOff className="h-6 w-6" />
            <p className="text-xs">No photos</p>
          </div>
        )}

        {hasMultiplePhotos && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 left-2 size-6 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={(event) => goToPhoto(event, photoIndex - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="sr-only">Previous photo</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={(event) => goToPhoto(event, photoIndex + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="sr-only">Next photo</span>
            </Button>
          </>
        )}

        {photos.length > 1 && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
            <Camera className="h-3 w-3" />
            {photos.length}
          </span>
        )}

        <div className="absolute top-2 right-2 flex gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 hover:text-white"
                onClick={(event) => {
                  event.stopPropagation()
                  event.preventDefault()
                  router.push(`/sites/${site.id}/edit`)
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <DeleteSiteButton
            siteId={site.id}
            iconOnly
            className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
            deleteDisabled={deleteBlocked}
            deleteDisabledReason={deleteBlockedReason}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{site.propertyName}</p>
            <p className="line-clamp-3 text-sm leading-snug break-words text-muted-foreground">
              {site.address}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <SiteStatusBadge status={site.status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400">
              <ParkingTypeIcon className="h-3 w-3" />
            </span>
            {parkingTypeLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-400">
              <Car className="h-3 w-3" />
            </span>
            {site.totalSlots} slots
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:bg-teal-400/15 dark:text-teal-400">
              <Clock className="h-3 w-3" />
            </span>
            {formatOperatingHours(site.operatingHours)}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function SitesList() {
  const { data: sites, isLoading, isError } = useSites()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-4xl font-bold tracking-tight">My sites</h1>
        <Button asChild size="sm">
          <Link href="/sites/new">
            <Plus className="h-4 w-4" />
            Add new site
          </Link>
        </Button>
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && (
        <ErrorMessage message="Couldn't load your sites. Try refreshing the page." />
      )}

      {sites && sites.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="No sites logged yet"
          description="Visit a parking site and add your first inspection to see it here."
          className="stripe-texture rounded-2xl"
          action={
            <Button asChild>
              <Link href="/sites/new">Add new site</Link>
            </Button>
          }
        />
      )}

      {sites && sites.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  )
}
