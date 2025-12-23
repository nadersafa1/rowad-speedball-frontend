import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  SetResource,
  EventResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  requireOrganization,
  hasCoachPermissions,
  forbiddenResponse,
  isSystemAdmin,
  checkOrganizationAccess,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create sets
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 */
export function checkSetCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can create sets'
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
 * Check if user has authorization to update a set
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 * - Set's event must belong to user's organization (unless system admin)
 */
export function checkSetUpdateAuthorization(
  context: OrganizationContext,
  event: EventResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can update sets'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin(context)) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  // Check organization ownership via parent event
  const ownershipCheck = checkOrganizationAccess(
    context,
    event.organizationId,
    'You can only update sets from events in your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}

/**
 * Check if user has authorization to delete a set
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, or org owner (coaches CANNOT delete)
 * - Must have an active organization (unless system admin)
 * - Set's event must belong to user's organization (unless system admin)
 */
export function checkSetDeleteAuthorization(
  context: OrganizationContext,
  event: EventResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions (more restrictive - no coaches)
  const { isSystemAdmin, isAdmin, isOwner } = context
  if (!isSystemAdmin && !isAdmin && !isOwner) {
    return forbiddenResponse(
      'Only system admins, club admins, and club owners can delete sets'
    )
  }

  // Require active organization (unless system admin)
  if (!isSystemAdmin) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck
  }

  // Check organization ownership via parent event
  const ownershipCheck = checkOrganizationAccess(
    context,
    event.organizationId,
    'You can only delete sets from events in your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}
