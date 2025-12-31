import { headers } from 'next/headers'
import { auth } from './auth'
import { db } from './db'
import * as schema from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { Organization } from 'better-auth/plugins'
import { OrganizationRole, type OrganizationContext } from '@/types/organization'

export { OrganizationRole }
export type { OrganizationContext }

const getRoleFlags = (
  role: OrganizationRole | null
): Pick<
  OrganizationContext,
  'isOwner' | 'isAdmin' | 'isCoach' | 'isPlayer' | 'isMember'
> => {
  return {
    isOwner: role === OrganizationRole.OWNER,
    isAdmin: role === OrganizationRole.ADMIN,
    isCoach: role === OrganizationRole.COACH,
    isPlayer: role === OrganizationRole.PLAYER,
    isMember: role === OrganizationRole.MEMBER,
  }
}

const getFederationRoleFlags = (
  userRole: string | null | undefined,
  federationId: string | null | undefined
): Pick<
  OrganizationContext,
  'isFederationAdmin' | 'isFederationEditor' | 'federationId'
> => {
  return {
    isFederationAdmin: userRole === 'federation-admin',
    isFederationEditor: userRole === 'federation-editor',
    federationId: federationId ?? null,
  }
}

export async function getOrganizationContext(): Promise<OrganizationContext> {
  const session = await auth.api.getSession({ headers: await headers() })

  const activeOrgId = session?.session.activeOrganizationId ?? null

  if (!session?.user) {
    return {
      organization: null,
      isAuthenticated: false,
      userId: null,
      role: null,
      activeOrgId: null,
      isSystemAdmin: false,
      ...getRoleFlags(null),
      ...getFederationRoleFlags(null, null),
    }
  }

  // Get user's federation role and federationId from database
  const userData = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
    columns: {
      role: true,
      federationId: true,
    },
  })
  const userRole = userData?.role ?? null
  const userFederationId = userData?.federationId ?? null

  // Check permission
  const hasAdminPermission = await auth.api.userHasPermission({
    headers: await headers(),
    body: { permission: { user: ['list'] } },
  })

  if (session.user.role === 'admin' && hasAdminPermission.success) {
    return {
      organization: null,
      role: OrganizationRole.SUPER_ADMIN,
      activeOrgId,
      isSystemAdmin: true,
      isAuthenticated: true,
      userId: session.user.id,
      ...getRoleFlags(null),
      ...getFederationRoleFlags(userRole, userFederationId),
    }
  }

  if (activeOrgId) {
    const membership = await db.query.member.findFirst({
      where: and(
        eq(schema.member.userId, session.user.id),
        eq(schema.member.organizationId, activeOrgId)
      ),
    })
    const organization = await db.query.organization.findFirst({
      where: eq(schema.organization.id, activeOrgId),
    })

    if (!membership || !organization) {
      return {
        organization: null,
        isAuthenticated: true,
        userId: session.user.id,
        isSystemAdmin: false,
        role: null,
        activeOrgId: null,
        ...getRoleFlags(null),
        ...getFederationRoleFlags(userRole, userFederationId),
      }
    }

    return {
      organization,
      role: membership.role as OrganizationRole,
      activeOrgId,
      isSystemAdmin: false,
      isAuthenticated: true,
      userId: session.user.id,
      ...getRoleFlags(membership.role as OrganizationRole),
      ...getFederationRoleFlags(userRole, userFederationId),
    }
  }

  const userMemberships = await db.query.member.findMany({
    where: eq(schema.member.userId, session.user.id),
  })
  if (userMemberships.length === 1) {
    const membership = userMemberships[0]
    const organization = await db.query.organization.findFirst({
      where: eq(schema.organization.id, membership.organizationId),
    })

    if (!organization || !membership) {
      return {
        organization: null,
        isAuthenticated: true,
        userId: session.user.id,
        isSystemAdmin: false,
        role: null,
        activeOrgId: null,
        ...getRoleFlags(null),
        ...getFederationRoleFlags(userRole, userFederationId),
      }
    }

    return {
      organization,
      role: membership.role as OrganizationRole,
      activeOrgId: membership.organizationId,
      isSystemAdmin: false,
      isAuthenticated: true,
      userId: session.user.id,
      ...getRoleFlags(membership.role as OrganizationRole),
      ...getFederationRoleFlags(userRole, userFederationId),
    }
  }

  return {
    organization: null,
    isAuthenticated: true,
    userId: session.user.id,
    isSystemAdmin: false,
    role: null,
    activeOrgId: null,
    ...getRoleFlags(null),
    ...getFederationRoleFlags(userRole, userFederationId),
  }
}

/**
 * Get all app admin users (users with role = 'admin')
 * Returns array of user IDs
 */
export async function getAllAppAdmins() {
  const adminUsers = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.role, 'admin'))

  return adminUsers.map((user) => user.id)
}

/**
 * Add a user to all existing organizations as an admin
 * Used when a user becomes an app admin
 */
export async function addUserToAllOrganizations(userId: string) {
  try {
    // Get all organizations
    const organizations = await db.query.organization.findMany()

    if (organizations.length === 0) {
      return
    }

    // Get existing memberships for this user
    const existingMemberships = await db
      .select({ organizationId: schema.member.organizationId })
      .from(schema.member)
      .where(eq(schema.member.userId, userId))

    const existingOrgIds = new Set(
      existingMemberships.map((m) => m.organizationId)
    )

    // Find organizations where user is not yet a member
    const orgsToAdd = organizations.filter((org) => !existingOrgIds.has(org.id))

    if (orgsToAdd.length > 0) {
      const memberValues = orgsToAdd.map((org) => ({
        organizationId: org.id,
        userId,
        role: 'super_admin' as const,
        createdAt: new Date(),
      }))

      await db.insert(schema.member).values(memberValues)
    }
  } catch (error) {
    console.error('Error adding user to all organizations:', error)
    throw error
  }
}

/**
 * Resolve the final organization ID for a resource being created
 *
 * Authorization rules:
 * - System admins can specify any organizationId or leave it null (for global resources)
 * - System admins: validate that the provided organizationId exists if being set
 * - Org members (admin/owner/coach) are forced to use their active organization
 *
 * @param context - The organization context from getOrganizationContext()
 * @param providedOrgId - The organizationId provided in the request body (optional)
 * @returns Object with organizationId or error response
 */
export async function resolveOrganizationId(
  context: OrganizationContext,
  providedOrgId: string | null | undefined
): Promise<{ organizationId: string | null; error?: Response }> {
  const { isSystemAdmin, organization } = context

  // System admins can specify any organizationId or leave it null
  if (isSystemAdmin) {
    // If system admin provides an organizationId, validate it exists
    if (providedOrgId !== undefined && providedOrgId !== null) {
      const orgCheck = await db
        .select()
        .from(schema.organization)
        .where(eq(schema.organization.id, providedOrgId))
        .limit(1)

      if (orgCheck.length === 0) {
        return {
          organizationId: null,
          error: Response.json(
            { message: 'Organization not found' },
            { status: 404 }
          ),
        }
      }
    }
    return { organizationId: providedOrgId ?? null }
  }

  // Non-system admins must use their active organization
  return { organizationId: organization?.id ?? null }
}
