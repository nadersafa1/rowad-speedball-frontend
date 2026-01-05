'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { PointsSchema } from '@/db/schema'

/**
 * Hook to check points schema permissions
 * Returns permission flags based on user role
 *
 * Authorization rules:
 * - Read: All authenticated users
 * - Create/Update/Delete: System admins and federation admins only
 */
export const usePointsSchemaPermissions = (
  pointsSchema: PointsSchema | null | undefined
) => {
  const { context } = useOrganizationContext()
  const {
    isSystemAdmin,
    isFederationAdmin,
    isAuthenticated,
  } = context

  return useMemo(() => {
    // Create permission: System admins and federation admins
    const canCreate = isSystemAdmin || isFederationAdmin

    if (!pointsSchema) {
      return {
        canRead: isAuthenticated, // Require authentication
        canCreate, // Use the same logic for general creation permission
        canUpdate: false,
        canDelete: false,
      }
    }

    // Read permission: Must be authenticated
    const canRead = isAuthenticated

    // Update permission: System admins and federation admins
    const canUpdate = isSystemAdmin || isFederationAdmin

    // Delete permission: System admins and federation admins
    const canDelete = isSystemAdmin || isFederationAdmin

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [
    pointsSchema,
    isSystemAdmin,
    isFederationAdmin,
    isAuthenticated,
  ])
}
