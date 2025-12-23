import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  OrganizationResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
  hasAdminPermissions,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create organizations
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin (per better-auth config: allowUserToCreateOrganization)
 */
export function checkOrganizationCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins can create organizations
  if (!isSystemAdmin(context)) {
    return forbiddenResponse('Only system admins can create organizations')
  }

  return null
}

/**
 * Check if user has authorization to read/view an organization
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 */
export function checkOrganizationReadAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  return requireAuthentication(context)
}

/**
 * Check if user has authorization to update an organization
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin OR (org admin/owner AND org matches user's org)
 */
export function checkOrganizationUpdateAuthorization(
  context: OrganizationContext,
  organization: OrganizationResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can update any organization
  if (isSystemAdmin(context)) {
    return null
  }

  // Org admins/owners can update their own organization
  if (
    hasAdminPermissions(context) &&
    context.organization?.id === organization.id
  ) {
    return null
  }

  return forbiddenResponse(
    'Only system admins and organization admins/owners can update organizations'
  )
}

/**
 * Check if user has authorization to delete an organization
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Organization deletion is disabled (per better-auth config)
 * - Only system admins would be allowed if it were enabled
 */
export function checkOrganizationDeleteAuthorization(
  context: OrganizationContext,
  organization: OrganizationResource
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Organization deletion is disabled in better-auth config
  // If it were enabled, only system admins would be allowed
  return forbiddenResponse('Organization deletion is not allowed')
}

/**
 * Check if user has authorization to manage organization members
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Must be system admin OR (org admin/owner AND org matches user's org)
 */
export function checkOrganizationMemberManagementAuthorization(
  context: OrganizationContext,
  organizationId: string
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can manage any organization's members
  if (isSystemAdmin(context)) {
    return null
  }

  // Org admins/owners can manage their own organization's members
  if (hasAdminPermissions(context) && context.organization?.id === organizationId) {
    return null
  }

  return forbiddenResponse(
    'Only system admins and organization admins/owners can manage members'
  )
}
