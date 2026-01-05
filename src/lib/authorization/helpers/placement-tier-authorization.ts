import type { OrganizationContext } from '@/lib/organization-helpers'
import type { AuthorizationResult } from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to read/view placement tiers
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 */
export function checkPlacementTierReadAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  return requireAuthentication(context)
}

/**
 * Check if user has authorization to create placement tiers
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin ONLY
 * - Placement tiers are system-wide configuration
 */
export function checkPlacementTierCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins can create placement tiers
  if (!isSystemAdmin(context)) {
    return forbiddenResponse(
      'Only system administrators can create placement tiers'
    )
  }

  return null
}

/**
 * Check if user has authorization to update a placement tier
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin ONLY
 * - Placement tiers are system-wide configuration
 */
export function checkPlacementTierUpdateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins can update placement tiers
  if (!isSystemAdmin(context)) {
    return forbiddenResponse(
      'Only system administrators can update placement tiers'
    )
  }

  return null
}

/**
 * Check if user has authorization to delete a placement tier
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin ONLY
 * - Placement tiers are system-wide configuration
 */
export function checkPlacementTierDeleteAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins can delete placement tiers
  if (!isSystemAdmin(context)) {
    return forbiddenResponse(
      'Only system administrators can delete placement tiers'
    )
  }

  return null
}
