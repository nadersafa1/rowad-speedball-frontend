import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  TrainingSessionResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  requireOrganization,
  hasCoachPermissions,
  checkOrganizationAccess,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create training sessions
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 */
export function checkTrainingSessionCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can create training sessions'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin(context)) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  return null
}

/**
 * Check if user has authorization to read/view a training session
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated (training sessions are always private)
 * - System admins can see all training sessions
 * - Org members can see training sessions from their organization
 * - Users without org can see training sessions without organization
 */
export function checkTrainingSessionReadAuthorization(
  context: OrganizationContext,
  trainingSession: TrainingSessionResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can see all
  if (isSystemAdmin(context)) {
    return null
  }

  // Users with org can see their org's sessions
  if (context.organization?.id) {
    if (trainingSession.organizationId === context.organization.id) {
      return null
    }
  }

  // Users without org can see sessions without organization
  if (!context.organization?.id && !trainingSession.organizationId) {
    return null
  }

  return forbiddenResponse(
    'You can only view training sessions from your organization'
  )
}

/**
 * Check if user has authorization to update a training session
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 * - Training session must belong to user's organization (unless system admin)
 */
export function checkTrainingSessionUpdateAuthorization(
  context: OrganizationContext,
  trainingSession: TrainingSessionResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can update training sessions'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin(context)) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  // Check organization ownership
  const ownershipCheck = checkOrganizationAccess(
    context,
    trainingSession.organizationId,
    'You can only update training sessions from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}

/**
 * Check if user has authorization to delete a training session
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, or org owner (coaches CANNOT delete)
 * - Must have an active organization (unless system admin)
 * - Training session must belong to user's organization (unless system admin)
 */
export function checkTrainingSessionDeleteAuthorization(
  context: OrganizationContext,
  trainingSession: TrainingSessionResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions (more restrictive - no coaches)
  const { isSystemAdmin, isAdmin, isOwner } = context
  if (!isSystemAdmin && !isAdmin && !isOwner) {
    return forbiddenResponse(
      'Only system admins, club admins, and club owners can delete training sessions'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  // Check organization ownership
  const ownershipCheck = checkOrganizationAccess(
    context,
    trainingSession.organizationId,
    'You can only delete training sessions from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}
