import { eq, and, isNull, inArray } from 'drizzle-orm'
import { db } from './db'
import * as schema from '@/db/schema'
import { OrganizationContext } from './organization-helpers'
import { getAgeGroup } from '@/db/schema'
import type { TeamLevel } from '@/types/team-level'

/**
 * Validates that a user can access attendance for a training session
 * @param trainingSessionId - The training session ID
 * @param context - Organization context from getOrganizationContext()
 * @returns Object with access granted flag and training session data if found
 */
export async function validateAttendanceAccess(
  trainingSessionId: string,
  context: OrganizationContext
): Promise<{
  hasAccess: boolean
  trainingSession: schema.TrainingSession | null
  error?: { message: string; status: number }
}> {
  const { isSystemAdmin, organization, isAuthenticated } = context

  if (!isAuthenticated) {
    return {
      hasAccess: false,
      trainingSession: null,
      error: { message: 'Unauthorized', status: 401 },
    }
  }

  // Check if training session exists
  const trainingSession = await db.query.trainingSessions.findFirst({
    where: eq(schema.trainingSessions.id, trainingSessionId),
  })

  if (!trainingSession) {
    return {
      hasAccess: false,
      trainingSession: null,
      error: { message: 'Training session not found', status: 404 },
    }
  }

  // System admin: full access
  if (isSystemAdmin) {
    return { hasAccess: true, trainingSession }
  }

  // Org members: can only access training sessions from their organization
  if (organization?.id) {
    if (trainingSession.organizationId !== organization.id) {
      return {
        hasAccess: false,
        trainingSession,
        error: { message: 'Forbidden', status: 403 },
      }
    }
    return { hasAccess: true, trainingSession }
  }

  // Authenticated user without organization: can only access training sessions without organization
  if (trainingSession.organizationId !== null) {
    return {
      hasAccess: false,
      trainingSession,
      error: { message: 'Forbidden', status: 403 },
    }
  }

  return { hasAccess: true, trainingSession }
}

/**
 * Validates that a player and training session belong to the same organization
 * @param playerId - The player ID
 * @param trainingSessionId - The training session ID
 * @returns Object with validation result and error if validation fails
 */
export async function validatePlayerSessionOrgMatch(
  playerId: string,
  trainingSessionId: string
): Promise<{
  isValid: boolean
  player: schema.Player | null
  trainingSession: schema.TrainingSession | null
  error?: { message: string; status: number }
}> {
  // Check if player exists
  const player = await db.query.players.findFirst({
    where: eq(schema.players.id, playerId),
  })

  if (!player) {
    return {
      isValid: false,
      player: null,
      trainingSession: null,
      error: { message: 'Player not found', status: 404 },
    }
  }

  // Check if training session exists
  const trainingSession = await db.query.trainingSessions.findFirst({
    where: eq(schema.trainingSessions.id, trainingSessionId),
  })

  if (!trainingSession) {
    return {
      isValid: false,
      player,
      trainingSession: null,
      error: { message: 'Training session not found', status: 404 },
    }
  }

  // Validate organization match
  // Both must have the same organizationId (including both being null)
  if (player.organizationId !== trainingSession.organizationId) {
    return {
      isValid: false,
      player,
      trainingSession,
      error: {
        message:
          'Player and training session must belong to the same organization',
        status: 400,
      },
    }
  }

  return { isValid: true, player, trainingSession }
}

/**
 * Checks if a user can modify (create/update/delete) attendance records
 * @param context - Organization context from getOrganizationContext()
 * @returns True if user can modify attendance, false otherwise
 */
export function canModifyAttendance(context: OrganizationContext): boolean {
  const { isSystemAdmin, isAdmin, isOwner, isCoach, isAuthenticated } = context

  if (!isAuthenticated) {
    return false
  }

  // System admin: full access
  if (isSystemAdmin) {
    return true
  }

  // Org admin/owner/coach: can modify attendance for their organization
  // Note: They must have an active organization (checked in route handlers)
  return isAdmin || isOwner || isCoach
}

/**
 * Queries players matching the specified criteria for auto-creating attendance
 * @param organizationId - The organization ID to filter by (can be null)
 * @param ageGroups - Array of age groups to match (e.g., ['U-15', 'U-17'])
 * @param teamLevels - Array of team levels to filter by (empty or undefined means all)
 * @returns Array of player IDs matching the criteria
 */
export async function queryPlayersForAttendance(
  organizationId: string | null,
  ageGroups: string[],
  teamLevels?: TeamLevel[]
): Promise<string[]> {
  // Build query conditions
  const conditions: any[] = []

  // Filter by organization
  if (organizationId === null) {
    conditions.push(isNull(schema.players.organizationId))
  } else {
    conditions.push(eq(schema.players.organizationId, organizationId))
  }

  // Filter by team levels (if specified and not empty)
  if (teamLevels && teamLevels.length > 0) {
    conditions.push(inArray(schema.players.teamLevel, teamLevels))
  }
  // If empty or undefined, include all team levels

  // Query all players matching organization and team level filter
  const players = await db
    .select()
    .from(schema.players)
    .where(conditions.length > 0 ? and(...conditions) : undefined)

  // Filter by age groups in memory (since we need to check against multiple age groups)
  const matchingPlayers = players.filter((player) => {
    const playerAgeGroup = getAgeGroup(player.dateOfBirth)
    return ageGroups.includes(playerAgeGroup)
  })

  return matchingPlayers.map((player) => player.id)
}
