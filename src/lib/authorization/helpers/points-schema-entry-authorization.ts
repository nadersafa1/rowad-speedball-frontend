import type { OrganizationContext } from '@/lib/organization-helpers'
import type { AuthorizationResult } from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to read/view points schema entries
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 */
export function checkPointsSchemaEntryReadAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  return requireAuthentication(context)
}

/**
 * Check if user has authorization to create points schema entries
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin OR federation admin
 * - Points schema entries are system-wide/federation-wide configuration
 */
export function checkPointsSchemaEntryCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins and federation admins can create points schema entries
  if (!isSystemAdmin(context) && !context.isFederationAdmin) {
    return forbiddenResponse(
      'Only system administrators and federation administrators can create points schema entries'
    )
  }

  return null
}

/**
 * Check if user has authorization to update a points schema entry
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin OR federation admin
 * - Points schema entries are system-wide/federation-wide configuration
 */
export function checkPointsSchemaEntryUpdateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins and federation admins can update points schema entries
  if (!isSystemAdmin(context) && !context.isFederationAdmin) {
    return forbiddenResponse(
      'Only system administrators and federation administrators can update points schema entries'
    )
  }

  return null
}

/**
 * Check if user has authorization to delete a points schema entry
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin OR federation admin
 * - Points schema entries are system-wide/federation-wide configuration
 */
export function checkPointsSchemaEntryDeleteAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins and federation admins can delete points schema entries
  if (!isSystemAdmin(context) && !context.isFederationAdmin) {
    return forbiddenResponse(
      'Only system administrators and federation administrators can delete points schema entries'
    )
  }

  return null
}
