"use client"

import { useParams } from "next/navigation"

import { SiteDetail } from "@/features/sites/components/SiteDetail"
import { SiteLoader } from "@/features/sites/components/SiteLoader"

export default function ReviewSitePage() {
  const params = useParams<{ id: string }>()

  return (
    <SiteLoader id={params.id}>
      {(site) => <SiteDetail mode="review" site={site} />}
    </SiteLoader>
  )
}
