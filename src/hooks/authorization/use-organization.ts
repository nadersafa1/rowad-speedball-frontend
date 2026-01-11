'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'

/**
 * Hook to access organization context data
 * Returns organization information without permission logic
 *
 * Use this hook when you need:
 * - Organization ID
 * - Organization details
 * - Organization-related context data
 *
 * For permissions, use useOrganizationPermissions instead
 */
export const useOrganization = () => {
  const { context, isLoading } = useOrganizationContext()

  return useMemo(
    () => ({
      organization: context.organization,
      organizationId: context.organization?.id,
      activeOrgId: context.activeOrgId,
      isOwner: context.isOwner,
      isAdmin: context.isAdmin,
      isLoading,
    }),
    [context.organization, context.activeOrgId, context.isOwner, context.isAdmin, isLoading]
  )
}
