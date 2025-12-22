'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { Championship } from '@/db/schema'

/**
 * Hook to check championship-based permissions
 * Returns permission flags based on championship federation ownership and user role
 * Note: Championships belong to federations, not organizations
 */
export const useChampionshipPermissions = (
  championship: Championship | null | undefined
) => {
  const { context } = useOrganizationContext()
  const {
    isSystemAdmin,
    isFederationAdmin,
    isFederationEditor,
    federationId,
    isAuthenticated,
  } = context

  return useMemo(() => {
    if (!championship) {
      return {
        canRead: false, // Require authentication
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      }
    }

    // Check if championship belongs to user's federation
    const isChampionshipFromUserFederation =
      !!federationId && championship.federationId === federationId

    // Read permission: Must be authenticated
    const canRead = isAuthenticated

    // Create permission: System admins or federation admins
    const canCreate = isSystemAdmin || isFederationAdmin

    // Update permission: System admins OR (federation admin/editor AND championship belongs to user's federation)
    const canUpdate =
      isSystemAdmin ||
      ((isFederationAdmin || isFederationEditor) &&
        isChampionshipFromUserFederation)

    // Delete permission: System admins OR (federation admin AND championship belongs to user's federation)
    // Federation editors CANNOT delete (only admins)
    const canDelete =
      isSystemAdmin || (isFederationAdmin && isChampionshipFromUserFederation)

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [
    championship,
    isSystemAdmin,
    isFederationAdmin,
    isFederationEditor,
    federationId,
    isAuthenticated,
  ])
}
