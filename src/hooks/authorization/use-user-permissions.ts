'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'

/**
 * Hook to check user-based permissions
 * Returns permission flags based on whether the user is viewing their own profile
 * or another user's profile, and their role
 *
 * @param targetUserId - The ID of the user being viewed/edited (optional)
 */
export const useUserPermissions = (targetUserId?: string | null) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, userId, isAuthenticated, activeOrgId } = context

  return useMemo(() => {
    if (!isAuthenticated) {
      return {
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canList: false,
      }
    }

    const isOwnProfile = targetUserId === userId

    // Read permission: All authenticated users can read user profiles
    const canRead = isAuthenticated

    // Create permission: Only system admins can create users via API
    const canCreate = isSystemAdmin

    // Update permission: System admins can update any user, users can update their own profile
    const canUpdate = isSystemAdmin || isOwnProfile

    // Delete permission: Only system admins can delete users
    const canDelete = isSystemAdmin

    // List permission: System admins OR org members with active org
    const canList = isSystemAdmin || !!activeOrgId

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
      canList,
    }
  }, [targetUserId, isSystemAdmin, userId, isAuthenticated, activeOrgId])
}
