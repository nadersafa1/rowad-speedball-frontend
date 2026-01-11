'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'

/**
 * Hook to access federation context data
 * Returns federation information and role checks
 *
 * Use this hook when you need:
 * - Federation ID
 * - Federation admin status
 * - Federation editor status
 * - Federation-related context data
 *
 * For specific federation entity permissions, use useFederationPermissions instead
 */
export const useFederation = () => {
  const { context, isLoading } = useOrganizationContext()

  return useMemo(
    () => ({
      federationId: context.federationId,
      isFederationAdmin: context.isFederationAdmin,
      isFederationEditor: context.isFederationEditor,
      isSystemAdmin: context.isSystemAdmin,
      isLoading,
    }),
    [
      context.federationId,
      context.isFederationAdmin,
      context.isFederationEditor,
      context.isSystemAdmin,
      isLoading,
    ]
  )
}
