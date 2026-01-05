import type { OrganizationContext } from '@/lib/organization-helpers'
import type { AuthorizationResult } from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to read/view points schemas
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 */
export function checkPointsSchemaReadAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  return requireAuthentication(context)
}

/**
 * Check if user has authorization to create points schemas
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin OR federation admin
 * - Points schemas are system-wide/federation-wide configuration
 */
export function checkPointsSchemaCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins and federation admins can create points schemas
  if (!isSystemAdmin(context) && !context.isFederationAdmin) {
    return forbiddenResponse(
      'Only system administrators and federation administrators can create points schemas'
    )
  }

  return null
}

/**
 * Check if user has authorization to update a points schema
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin OR federation admin
 * - Points schemas are system-wide/federation-wide configuration
 */
export function checkPointsSchemaUpdateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins and federation admins can update points schemas
  if (!isSystemAdmin(context) && !context.isFederationAdmin) {
    return forbiddenResponse(
      'Only system administrators and federation administrators can update points schemas'
    )
  }

  return null
}

/**
 * Check if user has authorization to delete a points schema
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin OR federation admin
 * - Points schemas are system-wide/federation-wide configuration
 */
export function checkPointsSchemaDeleteAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins and federation admins can delete points schemas
  if (!isSystemAdmin(context) && !context.isFederationAdmin) {
    return forbiddenResponse(
      'Only system administrators and federation administrators can delete points schemas'
    )
  }

  return null
}
