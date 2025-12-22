import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  FederationResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create federations
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin
 */
export function checkFederationCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins can create federations
  if (!isSystemAdmin(context)) {
    return forbiddenResponse('Only system admins can create federations')
  }

  return null
}

/**
 * Check if user has authorization to read/view a federation
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 */
export function checkFederationReadAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  return requireAuthentication(context)
}

/**
 * Check if user has authorization to update a federation
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin or federation admin/editor
 */
export function checkFederationUpdateAuthorization(
  context: OrganizationContext,
  federation: FederationResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can update any federation
  if (isSystemAdmin(context)) {
    return null
  }

  // Federation admins/editors can update their own federation
  const { isFederationAdmin, isFederationEditor, federationId } = context
  if (
    (isFederationAdmin || isFederationEditor) &&
    federationId === federation.id
  ) {
    return null
  }

  return forbiddenResponse(
    'Only system admins and federation admins/editors can update federations'
  )
}

/**
 * Check if user has authorization to delete a federation
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin
 */
export function checkFederationDeleteAuthorization(
  context: OrganizationContext,
  federation: FederationResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins can delete federations
  if (!isSystemAdmin(context)) {
    return forbiddenResponse('Only system admins can delete federations')
  }

  return null
}
