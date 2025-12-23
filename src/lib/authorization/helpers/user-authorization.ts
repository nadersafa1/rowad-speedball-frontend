import type { OrganizationContext } from '@/lib/organization-helpers'
import type {
  AuthorizationResult,
  UserResource,
} from '@/lib/authorization/types'
import {
  requireAuthentication,
  forbiddenResponse,
  isSystemAdmin,
} from '@/lib/authorization/types'

/**
 * Check if user has authorization to create users
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - User creation is typically handled by better-auth registration
 * - Only system admins can create users via API
 */
export function checkUserCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins can create users via API
  if (!isSystemAdmin(context)) {
    return forbiddenResponse('Only system admins can create users')
  }

  return null
}

/**
 * Check if user has authorization to read/view a user
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can view any user
 * - Users can view their own profile
 * - Users can view other users (basic info)
 */
export function checkUserReadAuthorization(
  context: OrganizationContext,
  userId: string
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // All authenticated users can read user profiles
  // Sensitive fields should be filtered at the response level
  return null
}

/**
 * Check if user has authorization to update a user
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can update any user
 * - Users can update their own profile
 */
export function checkUserUpdateAuthorization(
  context: OrganizationContext,
  userId: string
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can update any user
  if (isSystemAdmin(context)) {
    return null
  }

  // Users can update their own profile
  if (context.userId === userId) {
    return null
  }

  return forbiddenResponse('You can only update your own profile')
}

/**
 * Check if user has authorization to delete a user
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - Only system admins can delete users
 */
export function checkUserDeleteAuthorization(
  context: OrganizationContext,
  userId: string
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // Only system admins can delete users
  if (!isSystemAdmin(context)) {
    return forbiddenResponse('Only system admins can delete users')
  }

  return null
}

/**
 * Check if user has authorization to list all users
 * Returns Response if unauthorized, null if authorized
 *
 * Authorization rules:
 * - Must be authenticated
 * - System admins can list all users
 * - Org admins and org coaches can list users (must have active organization)
 */
export function checkUserListAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Require authentication
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // System admins can list all users
  if (isSystemAdmin(context)) {
    return null
  }

  // Org admins and org coaches can list users if they have an active organization
  // Using activeOrgId to match original route logic exactly
  if (context.activeOrgId) {
    return null
  }

  return forbiddenResponse(
    'Only system admins, org admins, and org coaches can list users'
  )
}
