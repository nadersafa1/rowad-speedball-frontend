'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { Test } from '@/db/schema'

/**
 * Hook to check test-based permissions
 * Returns permission flags based on test ownership, visibility, and user role
 */
export const useTestPermissions = (test: Test | null | undefined) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization } = context

  return useMemo(() => {
    if (!test) {
      return {
        canRead: true, // Public tests are readable by anyone
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      }
    }

    // Check if test belongs to user's organization
    const isTestFromUserOrg =
      !!organization?.id && test.organizationId === organization.id

    // Check test properties
    const isPublic = test.visibility === 'public'
    const hasNoOrganization = test.organizationId === null

    // Read permission:
    // - System admins can see all tests
    // - Org members can see their org tests (public + private) + public tests + tests without org
    // - Non-authenticated can see public tests + tests without org
    const canRead =
      isSystemAdmin || isPublic || hasNoOrganization || isTestFromUserOrg

    // Create permission: System admins, org admins, org owners, org coaches
    // Must have an active organization (unless system admin)
    const canCreate =
      isSystemAdmin || ((isAdmin || isOwner || isCoach) && !!organization?.id)

    // Update permission: System admins, org admins, org owners, org coaches
    // Must be from user's org (unless system admin)
    const canUpdate =
      (isSystemAdmin || isAdmin || isOwner || isCoach) &&
      (isSystemAdmin || (isTestFromUserOrg && !!organization?.id))

    // Delete permission: System admins, org admins, org owners
    // Coaches CANNOT delete tests (only admins/owners)
    // Must be from user's org (unless system admin)
    const canDelete =
      (isSystemAdmin || isAdmin || isOwner) &&
      (isSystemAdmin || (isTestFromUserOrg && !!organization?.id))

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [test, isSystemAdmin, isAdmin, isOwner, isCoach, organization])
}
