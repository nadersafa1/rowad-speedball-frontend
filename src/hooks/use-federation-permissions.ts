'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { Federation } from '@/db/schema'

/**
 * Hook to check federation-based permissions
 * Returns permission flags based on user role and federation ownership
 */
export const useFederationPermissions = (
  federation: Federation | null | undefined
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
    if (!federation) {
      return {
        canRead: false, // Require authentication
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      }
    }

    // Check if federation is the user's federation
    const isUserFederation = !!federationId && federation.id === federationId

    // Read permission: Must be authenticated
    const canRead = isAuthenticated

    // Create permission: System admins only
    const canCreate = isSystemAdmin

    // Update permission: System admins OR (federation admin/editor of the same federation)
    const canUpdate =
      isSystemAdmin ||
      ((isFederationAdmin || isFederationEditor) && isUserFederation)

    // Delete permission: System admins only
    // Federation admins/editors CANNOT delete federations
    const canDelete = isSystemAdmin

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [
    federation,
    isSystemAdmin,
    isFederationAdmin,
    isFederationEditor,
    federationId,
    isAuthenticated,
  ])
}
