'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'

/**
 * Hook to check user roles
 * Returns role flags based on user's current role assignments
 *
 * Use this hook when you need to:
 * - Check if user is system admin
 * - Check if user is federation admin/editor
 * - Check if user is organization owner/admin/coach
 * - Check if user is a player
 * - Check authentication status
 *
 * For entity-specific permissions, use the appropriate entity permission hooks instead
 */
export const useRoles = () => {
  const { context, isLoading } = useOrganizationContext()

  return useMemo(
    () => ({
      // System level
      isSystemAdmin: context.isSystemAdmin,
      isAuthenticated: context.isAuthenticated,
      userId: context.userId,

      // Federation level
      isFederationAdmin: context.isFederationAdmin,
      isFederationEditor: context.isFederationEditor,

      // Organization level
      isOwner: context.isOwner,
      isAdmin: context.isAdmin,
      isCoach: context.isCoach,
      isPlayer: context.isPlayer,

      // Helper flags
      isOrgMember: context.isOwner || context.isAdmin || context.isCoach,
      isFederationMember: context.isFederationAdmin || context.isFederationEditor,

      isLoading,
    }),
    [
      context.isSystemAdmin,
      context.isAuthenticated,
      context.userId,
      context.isFederationAdmin,
      context.isFederationEditor,
      context.isOwner,
      context.isAdmin,
      context.isCoach,
      context.isPlayer,
      isLoading,
    ]
  )
}
