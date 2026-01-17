/**
 * Hook to fetch organizations list
 * Used for organization/club filters in tables
 */

'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

export interface Organization {
  id: string
  name: string
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrganizations = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const orgs = await apiClient.getOrganizations()
        setOrganizations(orgs)
      } catch (err) {
        console.error('Failed to fetch organizations:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to fetch organizations'
        )
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrganizations()
  }, [])

  return {
    organizations,
    isLoading,
    error,
  }
}
