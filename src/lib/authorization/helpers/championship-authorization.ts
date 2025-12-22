import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  ChampionshipResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create championships
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin or federation admin
 * - Championships belong to federations, not organizations
 */
export function checkChampionshipCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Check role permissions - system admins or federation admins can create
  const { isSystemAdmin, isFederationAdmin } = context
  if (!isSystemAdmin && !isFederationAdmin) {
    return forbiddenResponse(
      'Only system admins and federation admins can create championships'
    )
  }

  return null
}

/**
 * Check if user has authorization to read/view a championship
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 */
export function checkChampionshipReadAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  return requireAuthentication(context)
}

/**
 * Check if user has authorization to update a championship
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin OR (federation admin/editor AND championship belongs to user's federation)
 * - Championships belong to federations, not organizations
 */
export function checkChampionshipUpdateAuthorization(
  context: OrganizationContext,
  championship: ChampionshipResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can update any championship
  if (isSystemAdmin(context)) {
    return null
  }

  // Federation admins/editors can update championships in their federation
  const { isFederationAdmin, isFederationEditor, federationId } = context
  if (
    (isFederationAdmin || isFederationEditor) &&
    federationId === championship.federationId
  ) {
    return null
  }

  return forbiddenResponse(
    'Only system admins and federation admins/editors can update championships in their federation'
  )
}

/**
 * Check if user has authorization to delete a championship
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin OR (federation admin AND championship belongs to user's federation)
 * - Championships belong to federations, not organizations
 */
export function checkChampionshipDeleteAuthorization(
  context: OrganizationContext,
  championship: ChampionshipResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can delete any championship
  if (isSystemAdmin(context)) {
    return null
  }

  // Federation admins can delete championships in their federation
  const { isFederationAdmin, federationId } = context
  if (isFederationAdmin && federationId === championship.federationId) {
    return null
  }

  return forbiddenResponse(
    'Only system admins and federation admins can delete championships in their federation'
  )
}
