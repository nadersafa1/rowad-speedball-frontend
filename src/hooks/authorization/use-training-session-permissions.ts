'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { TrainingSession } from '@/db/schema'

/**
 * Hook to check training session-based permissions
 * Returns permission flags based on training session ownership and user role
 */
export const useTrainingSessionPermissions = (
  trainingSession: TrainingSession | null | undefined
) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization, isAuthenticated } =
    context

  return useMemo(() => {
    // Create permission: System admins, org admins, org owners, org coaches
    // Must have an active organization (unless system admin)
    const canCreate =
      isSystemAdmin || ((isAdmin || isOwner || isCoach) && !!organization?.id)

    if (!trainingSession) {
      return {
        canRead: isAuthenticated && (isSystemAdmin || isAdmin || isOwner || isCoach), // Training sessions are private - require authentication and proper role
        canCreate, // Use the same logic for general creation permission
        canUpdate: false,
        canDelete: false,
      }
    }

    // Check if training session belongs to user's organization
    const isSessionFromUserOrg =
      !!organization?.id && trainingSession.organizationId === organization.id

    // Check if session has no organization
    const hasNoOrganization = trainingSession.organizationId === null

    // Read permission: Must be authenticated
    // System admins see all
    // Org members see their org's sessions
    // Users without org see sessions without org
    const canRead =
      isAuthenticated &&
      (isSystemAdmin ||
        isSessionFromUserOrg ||
        (!organization?.id && hasNoOrganization))

    // Update permission: System admins, org admins, org owners, org coaches
    // Must be from user's org (unless system admin)
    const canUpdate =
      (isSystemAdmin || isAdmin || isOwner || isCoach) &&
      (isSystemAdmin || (isSessionFromUserOrg && !!organization?.id))

    // Delete permission: System admins, org admins, org owners
    // Coaches CANNOT delete training sessions (only admins/owners)
    // Must be from user's org (unless system admin)
    const canDelete =
      (isSystemAdmin || isAdmin || isOwner) &&
      (isSystemAdmin || (isSessionFromUserOrg && !!organization?.id))

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [trainingSession, isSystemAdmin, isAdmin, isOwner, isCoach, organization, isAuthenticated])
}
