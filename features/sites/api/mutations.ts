import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createSite, deleteSite, updateSite } from "@/lib/api"
import type { Site, SiteFormValues } from "@/types/site"

import { sitesKeys } from "./queries"

export function useCreateSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: SiteFormValues) => createSite(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sitesKeys.all })
    },
  })
}

export function useUpdateSite(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      values: Partial<SiteFormValues> & { status?: Site["status"] }
    ) => updateSite(id, values),
    onSuccess: (site) => {
      queryClient.invalidateQueries({ queryKey: sitesKeys.all })
      queryClient.setQueryData(sitesKeys.detail(id), site)
    },
  })
}

export function useDeleteSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sitesKeys.all })
    },
  })
}
