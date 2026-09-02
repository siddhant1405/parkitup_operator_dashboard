"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { type UseFormReturn, useWatch } from "react-hook-form"
import {
  APIProvider,
  Map,
  AdvancedMarker,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps"

import { Button } from "@/components/ui/button"
import type { SiteFormValues } from "@/features/sites/schemas/site"

/* ---------- Constants ---------- */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

/** Default center when GPS is unset (0,0). */
const DELHI_CENTER = { lat: 28.6139, lng: 77.209 }

const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID"

/* ---------- Props ---------- */

interface SiteLocationPickerProps {
  form: UseFormReturn<SiteFormValues>
}

/* ---------- Component ---------- */

export function SiteLocationPicker({ form }: SiteLocationPickerProps) {
  const lat = useWatch({ control: form.control, name: "gps.lat" })
  const lng = useWatch({ control: form.control, name: "gps.lng" })
  const address = useWatch({ control: form.control, name: "address" })

  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null)
  const visibleSuggestedAddress =
    suggestedAddress && address?.trim() !== suggestedAddress.trim()
      ? suggestedAddress
      : null

  /** Prevents Map onClick from firing right after a marker dragend. */
  const isDraggingRef = useRef(false)

  /** Tracks whether we already reverse-geocoded for the current coordinates. */
  const lastGeocodedRef = useRef<string>("")

  // ── Helpers ──────────────────────────────────────────────────────────

  const hasValidCoords = lat !== 0 || lng !== 0
  const mapCenter = hasValidCoords ? { lat, lng } : DELHI_CENTER
  const markerPosition = hasValidCoords ? { lat, lng } : DELHI_CENTER

  const updatePosition = useCallback(
    (newLat: number, newLng: number) => {
      form.setValue("gps.lat", newLat, { shouldValidate: true })
      form.setValue("gps.lng", newLng, { shouldValidate: true })
    },
    [form],
  )

  // ── Reverse geocode ──────────────────────────────────────────────────

  const reverseGeocode = useCallback(
    async (geoLat: number, geoLng: number) => {
      if (!GOOGLE_MAPS_API_KEY) return

      const coordKey = `${geoLat.toFixed(6)},${geoLng.toFixed(6)}`
      if (lastGeocodedRef.current === coordKey) return
      lastGeocodedRef.current = coordKey

      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${geoLat},${geoLng}&key=${GOOGLE_MAPS_API_KEY}`,
        )
        const data = await res.json()
        const formatted: string | undefined =
          data?.results?.[0]?.formatted_address

        if (!formatted) return

        const currentAddress = form.getValues("address")
        if (!currentAddress || currentAddress.trim() === "") {
          // Auto-fill empty address
          form.setValue("address", formatted, { shouldValidate: true })
          setSuggestedAddress(null)
        } else {
          // Show suggestion without overwriting
          setSuggestedAddress(formatted)
        }
      } catch {
        // Geocoding failure is non-critical — silently ignore.
      }
    },
    [form],
  )

  // ── Fire reverse geocode when coordinates change ─────────────────────

  useEffect(() => {
    if (lat === 0 && lng === 0) return
    const timeoutId = window.setTimeout(() => {
      void reverseGeocode(lat, lng)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [lat, lng, reverseGeocode])

  // ── Event handlers ───────────────────────────────────────────────────

  function handleMarkerDragEnd(event: google.maps.MapMouseEvent) {
    isDraggingRef.current = true
    const pos = event.latLng
    if (pos) {
      updatePosition(pos.lat(), pos.lng())
    }
  }

  function handleMapClick(event: MapMouseEvent) {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      return
    }
    const detail = event.detail
    if (detail?.latLng) {
      updatePosition(detail.latLng.lat, detail.latLng.lng)
    }
  }

  // ── Suggestion accept ────────────────────────────────────────────────

  function acceptSuggestion() {
    if (suggestedAddress) {
      form.setValue("address", suggestedAddress, { shouldValidate: true })
      setSuggestedAddress(null)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Map unavailable — API key not configured
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Map */}
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <div className="h-[300px] w-full overflow-hidden rounded-lg border border-border">
          <Map
            defaultCenter={mapCenter}
            center={mapCenter}
            defaultZoom={hasValidCoords ? 15 : 11}
            mapId={MAP_ID}
            onClick={handleMapClick}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: "100%", height: "100%" }}
          >
            <AdvancedMarker
              position={markerPosition}
              draggable
              onDragEnd={handleMarkerDragEnd}
            />
          </Map>
        </div>
      </APIProvider>

      {/* Coordinates display */}
      {hasValidCoords && (
        <p className="text-xs text-muted-foreground">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}

      {/* Address suggestion (rendered here; SiteForm places this after the address field) */}
      {visibleSuggestedAddress && (
        <div className="flex flex-wrap items-baseline gap-1 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium">Suggested:</span>
          <span className="break-all">{visibleSuggestedAddress}</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs font-medium text-primary"
            onClick={acceptSuggestion}
          >
            Use this
          </Button>
        </div>
      )}
    </div>
  )
}
