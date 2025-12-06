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

  // isLoading should be true if we haven't fetched yet OR if we're currently loading
  const isContextLoading = !hasFetched || isLoading

  return { context, isLoading: isContextLoading, error }
}
