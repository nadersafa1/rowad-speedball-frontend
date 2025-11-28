'use client'

import { useEffect } from 'react'
import { useOrganizationContextStore } from '@/store/organization-context-store'

export const useOrganizationContext = () => {
  const { context, isLoading, error, hasFetched, fetchContext } =
    useOrganizationContextStore()

  // Fetch context on mount if not already fetched
  useEffect(() => {
    if (!hasFetched && !isLoading) {
      fetchContext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { context, isLoading, error }
}
