"use client"

import { ErrorMessage } from "@/components/shared/ErrorMessage"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useSite } from "@/features/sites/api/queries"
import type { Site } from "@/types/site"

export function SiteLoader({
  id,
  children,
}: {
  id: string
  children: (site: Site) => React.ReactNode
}) {
  const { data: site, isLoading, isError } = useSite(id)

  if (isLoading) return <LoadingSpinner />
  if (isError || !site) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorMessage message="Couldn't find this site." />
      </div>
    )
  }

  return <>{children(site)}</>
}
