import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  PlayerResource,
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
 * Check if user has authorization to create players
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 */
export function checkPlayerCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can create players'
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
 * Check if user has authorization to read/view a player
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - No authentication required for basic player info
 * - Sensitive data (notes, etc.) require additional checks
 */
export function checkPlayerReadAuthorization(
  context: OrganizationContext,
  player: PlayerResource
): AuthorizationResult {
  // Players are generally readable by anyone
  // Specific sensitive fields should have additional checks
  return null
}

/**
 * Check if user has authorization to update a player
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, org owner, or org coach
 * - Must have an active organization (unless system admin)
 * - Player must belong to user's organization (unless system admin)
 */
export function checkPlayerUpdateAuthorization(
  context: OrganizationContext,
  player: PlayerResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions
  if (!hasCoachPermissions(context)) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can update players'
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
    player.organizationId,
    'You can only update players from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}

/**
 * Check if user has authorization to delete a player
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin, org admin, or org owner (coaches CANNOT delete)
 * - Must have an active organization (unless system admin)
 * - Player must belong to user's organization (unless system admin)
 */
export function checkPlayerDeleteAuthorization(
  context: OrganizationContext,
  player: PlayerResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions (more restrictive - no coaches)
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context
  if (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) {
    return forbiddenResponse(
      'Only system admins, club admins, club owners, and club coaches can delete players'
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
    player.organizationId,
    'You can only delete players from your own organization'
  )
  if (ownershipCheck) return ownershipCheck

  return null
}
