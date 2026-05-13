"use client"

import { useQuery } from "@tanstack/react-query"
import { getPlayPackages } from "@/lib/firebase/play-packages"

export const PLAY_PACKAGES_QUERY_KEY = ["play-packages"] as const

export function usePlayPackages() {
  return useQuery({
    queryKey: PLAY_PACKAGES_QUERY_KEY,
    queryFn: getPlayPackages,
    staleTime: 10 * 60 * 1000,
  })
}
