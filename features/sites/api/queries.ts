import { useQuery } from "@tanstack/react-query"

import { getSite, getSites } from "@/lib/api"

export const sitesKeys = {
  all: ["sites"] as const,
  detail: (id: string) => ["sites", id] as const,
}

export function useSites() {
  return useQuery({
    queryKey: sitesKeys.all,
    queryFn: getSites,
  })
}

export function useSite(id: string) {
  return useQuery({
    queryKey: sitesKeys.detail(id),
    queryFn: () => getSite(id),
    enabled: !!id,
  })
}
