'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { Organization } from '@/db/schema'

/**
 * Hook to check organization-based permissions
 * Returns permission flags based on user role and organization ownership
 */
export const useOrganizationPermissions = (
  targetOrganization: Organization | null | undefined
) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, organization, isAuthenticated } = context

  return useMemo(() => {
    // Create permission: System admins only
    const canCreate = isSystemAdmin

    if (!targetOrganization) {
      return {
        canRead: isAuthenticated, // Require authentication
        canCreate, // Use the same logic for general creation permission
        canUpdate: false,
        canDelete: false,
      }
    }

    // Check if target organization is the user's organization
    const isUserOrganization =
      !!organization?.id && targetOrganization.id === organization.id

    // Read permission: Must be authenticated
    const canRead = isAuthenticated

    // Update permission: System admins OR (org admin/owner of the same organization)
    const canUpdate =
      isSystemAdmin || ((isAdmin || isOwner) && isUserOrganization)

    // Delete permission: Disabled (organization deletion is not allowed)
    const canDelete = false

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [targetOrganization, isSystemAdmin, isAdmin, isOwner, organization, isAuthenticated])
}
