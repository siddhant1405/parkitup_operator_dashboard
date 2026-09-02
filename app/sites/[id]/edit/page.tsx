"use client"

import { useParams } from "next/navigation"

import { SiteForm } from "@/features/sites/components/SiteForm"
import { SiteLoader } from "@/features/sites/components/SiteLoader"

export default function EditSitePage() {
  const params = useParams<{ id: string }>()

  return (
    <SiteLoader id={params.id}>
      {(site) => <SiteForm mode="edit" site={site} />}
    </SiteLoader>
  )
}
