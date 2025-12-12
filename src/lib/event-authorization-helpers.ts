import { OrganizationContext } from './organization-helpers'
import * as schema from '@/db/schema'
import { db } from './db'
import { eq, and, inArray } from 'drizzle-orm'

/**
 * Check if user has authorization to create events
 * Returns Response if unauthorized, null if authorized
 */
export function checkEventCreateAuthorization(
  context: OrganizationContext
): ReturnType<typeof Response.json> | null {
  const {
    isSystemAdmin,
    isAdmin,
    isCoach,
    isOwner,
    organization,
    isAuthenticated,
  } = context

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Authorization: Only system admins, org admins, org owners, and org coaches can create events
  // Additionally, org members (admin/owner/coach) must have an active organization
  if (
    (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) ||
    (!isSystemAdmin && !organization?.id)
  ) {
    return Response.json(
      {
        message:
          'Only system admins, club admins, club owners, and club coaches can create events',
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Check if user has authorization to update events
 * Returns Response if unauthorized, null if authorized
 */
export function checkEventUpdateAuthorization(
  context: OrganizationContext,
  event: typeof schema.events.$inferSelect
): ReturnType<typeof Response.json> | null {
  const {
    isSystemAdmin,
    isAdmin,
    isCoach,
    isOwner,
    organization,
    isAuthenticated,
  } = context

  // Require authentication
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Authorization: Only system admins, org admins, org owners, and org coaches can update events
  // Additionally, org members (admin/owner/coach) must have an active organization
  if (
    (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) ||
    (!isSystemAdmin && !organization?.id)
  ) {
    return Response.json(
      {
        message:
          'Only system admins, club admins, club owners, and club coaches can update events',
      },
      { status: 403 }
    )
  }

  // Organization ownership check: org members can only update events from their own organization
  if (!isSystemAdmin) {
    if (!organization?.id || event.organizationId !== organization.id) {
      return Response.json(
        {
          message: 'You can only update events from your own organization',
        },
        { status: 403 }
      )
    }
  }

  return null
}

/**
 * Check if user has authorization to delete events
 * Returns Response if unauthorized, null if authorized
 */
export function checkEventDeleteAuthorization(
  context: OrganizationContext,
  event: typeof schema.events.$inferSelect
): ReturnType<typeof Response.json> | null {
  const { isSystemAdmin, isAdmin, isOwner, organization } = context

  // Authorization: Only system admins, org admins, and org owners can delete events
  // Additionally, org members (admin/owner) must have an active organization
  if (
    (!isSystemAdmin && !isAdmin && !isOwner) ||
    (!isSystemAdmin && !organization?.id)
  ) {
    return Response.json(
      {
        message:
          'Only system admins, club admins, and club owners can delete events',
      },
      { status: 403 }
    )
  }

  // Organization ownership check: org members can only delete events from their own organization
  if (!isSystemAdmin) {
    if (!organization?.id || event.organizationId !== organization.id) {
      return Response.json(
        {
          message: 'You can only delete events from your own organization',
        },
        { status: 403 }
      )
    }
  }

  return null
}

/**
 * Check if user has authorization to read/view events
 * Returns Response if unauthorized, null if authorized
 * Authorization logic matches GET events:
 * - System admin: can see all events
 * - Org members: can see their org events (public + private) + public events + events without org
 * - Non-authenticated: can see public events + events without org
 */
export function checkEventReadAuthorization(
  context: OrganizationContext,
  event: typeof schema.events.$inferSelect
): ReturnType<typeof Response.json> | null {
  const { isSystemAdmin, organization } = context

  // System admin: can see all events
  if (isSystemAdmin) {
    return null
  }

  const isPublic = event.visibility === 'public'
  const hasNoOrganization = event.organizationId === null
  const isFromUserOrg =
    organization?.id && event.organizationId === organization.id

  // Allow if: public OR no organization OR from user's org
  // Block if: private AND has organization AND not from user's org
  if (!isPublic && !hasNoOrganization && !isFromUserOrg) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  return null
}

/**
 * Check if a player can update a match
 * Players can update matches if:
 * 1. The match is part of an event linked to a training session
 * 2. The training session belongs to the player's organization
 * 3. The player is registered in one of the match's registrations
 * Returns true if player can update, false otherwise
 */
export async function canPlayerUpdateMatch(
  context: OrganizationContext,
  match: typeof schema.matches.$inferSelect,
  event: typeof schema.events.$inferSelect
): Promise<boolean> {
  const { userId, isPlayer, organization } = context

  // Must be a player with an organization
  if (!isPlayer || !userId || !organization?.id) {
    return false
  }

  // Event must be linked to a training session
  if (!event.trainingSessionId) {
    return false
  }

  // Get the training session and verify it belongs to player's organization
  const trainingSession = await db
    .select()
    .from(schema.trainingSessions)
    .where(eq(schema.trainingSessions.id, event.trainingSessionId))
    .limit(1)

  if (trainingSession.length === 0) {
    return false
  }

  // Training session must belong to player's organization
  if (trainingSession[0].organizationId !== organization.id) {
    return false
  }

  // Get player record for the user
  const player = await db
    .select()
    .from(schema.players)
    .where(eq(schema.players.userId, userId))
    .limit(1)

  if (player.length === 0) {
    return false
  }

  const playerId = player[0].id

  // Get registration IDs from the match
  const registrationIds: string[] = []
  if (match.registration1Id) {
    registrationIds.push(match.registration1Id)
  }
  if (match.registration2Id) {
    registrationIds.push(match.registration2Id)
  }

  if (registrationIds.length === 0) {
    return false
  }

  // Check if player is in any of the match's registrations
  const playerInRegistrations = await db
    .select()
    .from(schema.registrationPlayers)
    .where(
      and(
        eq(schema.registrationPlayers.playerId, playerId),
        inArray(schema.registrationPlayers.registrationId, registrationIds)
      )
    )
    .limit(1)

  return playerInRegistrations.length > 0
}
