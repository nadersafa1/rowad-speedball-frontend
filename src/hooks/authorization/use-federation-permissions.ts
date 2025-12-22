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
    // Create permission: System admins only
    const canCreate = isSystemAdmin

    if (!federation) {
      return {
        canRead: isAuthenticated, // Require authentication
        canCreate, // Use the same logic for general creation permission
        canUpdate: false,
        canDelete: false,
      }
    }

    // Check if federation is the user's federation
    const isUserFederation = !!federationId && federation.id === federationId

    // Read permission: Must be authenticated
    const canRead = isAuthenticated

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
