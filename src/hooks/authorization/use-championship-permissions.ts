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
    // Create permission: System admins or federation admins or federation editors
    const canCreate = isSystemAdmin || isFederationAdmin

    if (!championship) {
      return {
        canRead: isAuthenticated, // Require authentication
        canCreate, // Use the same logic for general creation permission
        canUpdate: false,
        canDelete: false,
      }
    }

    // Check if championship belongs to user's federation
    const isChampionshipFromUserFederation =
      !!federationId && championship.federationId === federationId

    // Read permission: Must be authenticated
    const canRead = isAuthenticated

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
