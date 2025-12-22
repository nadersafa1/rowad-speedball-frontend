'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { TestResult, Test } from '@/db/schema'

/**
 * Hook to check test result-based permissions
 * Returns permission flags based on test ownership, visibility, and user role
 * Note: Result permissions are based on the test they belong to
 */
export const useResultPermissions = (
  result: TestResult | null | undefined,
  test: Test | null | undefined
) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization } = context

  return useMemo(() => {
    // When checking general permissions (no specific result/test)
    if (!result && !test) {
      return {
        canRead: true, // Public results are readable by anyone
        // Can create if user has coach+ permissions and an active organization (or is system admin)
        canCreate:
          isSystemAdmin ||
          ((isAdmin || isOwner || isCoach) && !!organization?.id),
        canUpdate: false,
        canDelete: false,
      }
    }

    if (!result || !test) {
      return {
        canRead: true,
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
    // - System admins can see all results
    // - Org members can see results from their org tests (public + private) + public tests + tests without org
    // - Non-authenticated can see results from public tests + tests without org
    const canRead =
      isSystemAdmin || isPublic || hasNoOrganization || isTestFromUserOrg

    // Create permission: System admins, org admins, org owners, org coaches
    // Must have an active organization (unless system admin)
    // Test must belong to user's organization (unless system admin)
    const canCreate =
      (isSystemAdmin || isAdmin || isOwner || isCoach) &&
      (isSystemAdmin || (isTestFromUserOrg && !!organization?.id))

    // Update permission: System admins, org admins, org owners, org coaches
    // Must be from user's org (unless system admin)
    // Test must belong to user's organization (unless system admin)
    const canUpdate =
      (isSystemAdmin || isAdmin || isOwner || isCoach) &&
      (isSystemAdmin || (isTestFromUserOrg && !!organization?.id))

    // Delete permission: System admins, org admins, org owners
    // Coaches CANNOT delete results (only admins/owners)
    // Must be from user's org (unless system admin)
    // Test must belong to user's organization (unless system admin)
    const canDelete =
      (isSystemAdmin || isAdmin || isOwner) &&
      (isSystemAdmin || (isTestFromUserOrg && !!organization?.id))

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [result, test, isSystemAdmin, isAdmin, isOwner, isCoach, organization])
}
