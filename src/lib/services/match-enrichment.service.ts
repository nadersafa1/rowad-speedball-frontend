import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { enrichRegistrationWithPlayers } from '@/lib/registration-helpers'

/**
 * Shared match enrichment service.
 * 
 * Used by both REST API endpoints and Socket backend to ensure
 * consistent match data structure across the application.
 * 
 * Enriches a match with:
 * - Sets (ordered by setNumber)
 * - Registrations with player data
 * - bestOf from event
 * - Group data (if applicable)
 * - Event data
 * - isByeMatch flag
 */

export interface EnrichedMatch {
  // Match fields
  id: string
  eventId: string
  groupId: string | null
  round: number | null
  matchNumber: number | null
  registration1Id: string | null
  registration2Id: string | null
  matchDate: string | null
  played: boolean
  winnerId: string | null
  bracketPosition: number | null
  winnerTo: string | null
  winnerToSlot: number | null
  createdAt: Date | string
  updatedAt: Date | string
  // Enriched fields
  sets: Array<{
    id: string
    matchId: string
    setNumber: number
    registration1Score: number
    registration2Score: number
    played: boolean
    createdAt: Date | string
    updatedAt: Date | string
  }>
  bestOf: number
  registration1: Awaited<ReturnType<typeof enrichRegistrationWithPlayers>> | null
  registration2: Awaited<ReturnType<typeof enrichRegistrationWithPlayers>> | null
  event: typeof schema.events.$inferSelect | null
  group: typeof schema.groups.$inferSelect | null
  isByeMatch: boolean
}

/**
 * Enriches a match with all related data.
 * 
 * @param match - The match record from database
 * @param event - The event record (must be provided)
 * @returns Enriched match with sets, registrations, bestOf, etc.
 */
export async function enrichMatch(
  match: typeof schema.matches.$inferSelect,
  event: typeof schema.events.$inferSelect
): Promise<EnrichedMatch> {
  // Get sets for the match (ordered by setNumber)
  const matchSets = await db
    .select()
    .from(schema.sets)
    .where(eq(schema.sets.matchId, match.id))
    .orderBy(schema.sets.setNumber)

  // Get group data if match has a groupId
  let group = null
  if (match.groupId) {
    const groupResult = await db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.id, match.groupId))
      .limit(1)
    group = groupResult[0] || null
  }

  // Fetch registrations with player data
  let registration1WithPlayers = null
  let registration2WithPlayers = null

  if (match.registration1Id) {
    const reg1 = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.id, match.registration1Id))
      .limit(1)
    registration1WithPlayers = reg1[0]
      ? await enrichRegistrationWithPlayers(reg1[0])
      : null
  }

  if (match.registration2Id) {
    const reg2 = await db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.id, match.registration2Id))
      .limit(1)
    registration2WithPlayers = reg2[0]
      ? await enrichRegistrationWithPlayers(reg2[0])
      : null
  }

  return {
    ...match,
    sets: matchSets,
    bestOf: event.bestOf,
    registration1: registration1WithPlayers,
    registration2: registration2WithPlayers,
    event,
    group,
    isByeMatch: match.registration1Id === null || match.registration2Id === null,
  }
}

