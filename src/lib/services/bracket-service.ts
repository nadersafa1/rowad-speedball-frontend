// Bracket Service - Business logic for single elimination bracket management

import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  generateSingleEliminationBracket,
  processByeAdvancements,
  SeedMapping,
} from '@/lib/utils/single-elimination'
import { sortRegistrationsBySeeds } from '@/lib/utils/single-elimination-helpers'
import { generateDoubleEliminationBracket } from '@/lib/utils/double-elimination'
import type { ParticipantSeed } from '@/lib/utils/double-elimination-types'
import {
  isSingleEliminationFormat,
  isDoubleEliminationFormat,
} from '@/lib/utils/event-format-helpers'

export interface GenerateBracketParams {
  eventId: string
  format: string
  seeds?: SeedMapping[]
  hasThirdPlaceMatch: boolean
  losersStartRoundsBeforeFinal?: number | null
}

export interface GenerateBracketResult {
  matches: (typeof schema.matches.$inferSelect)[]
  totalRounds: number
  bracketSize: number
  matchCount: number
}

/**
 * Validates that the event format supports bracket generation
 */
export const validateEventForBracketGeneration = (
  format: string
): { valid: boolean; error?: string } => {
  if (
    !isSingleEliminationFormat(format) &&
    !isDoubleEliminationFormat(format)
  ) {
    return {
      valid: false,
      error: 'Bracket generation is only available for elimination events',
    }
  }
  return { valid: true }
}

/**
 * Checks if bracket already exists for an event
 */
export const checkBracketExists = async (eventId: string): Promise<boolean> => {
  const existingMatches = await db
    .select({ id: schema.matches.id })
    .from(schema.matches)
    .where(eq(schema.matches.eventId, eventId))
    .limit(1)

  return existingMatches.length > 0
}

/**
 * Validates seeds against registrations
 */
export const validateSeeds = (
  seeds: SeedMapping[] | undefined,
  registrationIds: string[]
): { valid: boolean; invalidId?: string } => {
  if (!seeds || seeds.length === 0) {
    return { valid: true }
  }

  const registrationIdsSet = new Set(registrationIds)
  for (const seed of seeds) {
    if (!registrationIdsSet.has(seed.registrationId)) {
      return { valid: false, invalidId: seed.registrationId }
    }
  }

  return { valid: true }
}

/**
 * Creates bracket matches in database (first pass - without winnerTo links)
 */
const createBracketMatches = async (
  eventId: string,
  bracketMatches: ReturnType<typeof generateSingleEliminationBracket>['matches']
): Promise<Map<number, string>> => {
  const positionToIdMap = new Map<number, string>()

  for (const bracketMatch of bracketMatches) {
    const [insertedMatch] = await db
      .insert(schema.matches)
      .values({
        eventId,
        groupId: null,
        round: bracketMatch.round,
        matchNumber: bracketMatch.matchNumber,
        registration1Id: bracketMatch.registration1Id,
        registration2Id: bracketMatch.registration2Id,
        bracketPosition: bracketMatch.bracketPosition,
        winnerTo: null,
        winnerToSlot: bracketMatch.winnerToSlot,
        played: bracketMatch.isBye,
        winnerId: bracketMatch.isBye
          ? bracketMatch.registration1Id ?? bracketMatch.registration2Id
          : null,
      })
      .returning()

    positionToIdMap.set(bracketMatch.bracketPosition, insertedMatch.id)
  }

  return positionToIdMap
}

/**
 * Links matches via winnerTo references (second pass)
 */
const linkBracketMatches = async (
  bracketMatches: ReturnType<
    typeof generateSingleEliminationBracket
  >['matches'],
  positionToIdMap: Map<number, string>
): Promise<void> => {
  for (const bracketMatch of bracketMatches) {
    if (bracketMatch.winnerTo) {
      const matchId = positionToIdMap.get(bracketMatch.bracketPosition)
      const winnerToId = positionToIdMap.get(bracketMatch.winnerTo)

      if (matchId && winnerToId) {
        await db
          .update(schema.matches)
          .set({ winnerTo: winnerToId })
          .where(eq(schema.matches.id, matchId))
      }
    }
  }
}

/**
 * Processes BYE advancements to next round matches
 */
const processAndApplyByeAdvancements = async (
  bracketMatches: ReturnType<
    typeof generateSingleEliminationBracket
  >['matches'],
  positionToIdMap: Map<number, string>
): Promise<void> => {
  const byeAdvancements = processByeAdvancements(bracketMatches)

  for (const [compositeKey, advancement] of Array.from(
    byeAdvancements.entries()
  )) {
    // Extract position from composite key (format: "position-slot")
    const toPosition = parseInt(compositeKey.split('-')[0], 10)
    const toMatchId = positionToIdMap.get(toPosition)
    if (toMatchId) {
      const updateField =
        advancement.slot === 1 ? 'registration1Id' : 'registration2Id'
      await db
        .update(schema.matches)
        .set({ [updateField]: advancement.registrationId })
        .where(eq(schema.matches.id, toMatchId))
    }
  }
}

/**
 * Updates registrations with seed values
 */
export const updateRegistrationSeeds = async (
  seeds: SeedMapping[]
): Promise<void> => {
  for (const seed of seeds) {
    await db
      .update(schema.registrations)
      .set({ seed: seed.seed, updatedAt: new Date() })
      .where(eq(schema.registrations.id, seed.registrationId))
  }
}

/**
 * Advance winner/loser into their routed matches for a completed match
 */
export const advanceMatchResult = async (params: {
  matchId: string
  winnerId: string
  loserId?: string | null
}): Promise<void> => {
  const { matchId, winnerId, loserId } = params
  const [match] = await db
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.id, matchId))
    .limit(1)

  if (!match) {
    throw new Error('Match not found')
  }

  if (match.winnerTo && match.winnerToSlot) {
    const field =
      match.winnerToSlot === 1 ? 'registration1Id' : 'registration2Id'
    const payload =
      field === 'registration1Id'
        ? { registration1Id: winnerId }
        : { registration2Id: winnerId }
    await db
      .update(schema.matches)
      .set(payload)
      .where(eq(schema.matches.id, match.winnerTo))
  }

  if (match.loserTo && match.loserToSlot && loserId) {
    const field =
      match.loserToSlot === 1 ? 'registration1Id' : 'registration2Id'
    const payload =
      field === 'registration1Id'
        ? { registration1Id: loserId }
        : { registration2Id: loserId }
    await db
      .update(schema.matches)
      .set(payload)
      .where(eq(schema.matches.id, match.loserTo))
  }
}

/**
 * Main function to generate and persist a single elimination bracket
 */
export const generateBracket = async (
  params: GenerateBracketParams,
  registrationIds: string[]
): Promise<GenerateBracketResult> => {
  const { eventId, seeds, hasThirdPlaceMatch, format, losersStartRoundsBeforeFinal } = params
  const isDoubleElim = isDoubleEliminationFormat(format)

  if (isDoubleElim) {
    const seededRegistrationIds = sortRegistrationsBySeeds(
      registrationIds,
      seeds
    )
    const seedMap = new Map(
      seeds?.map((seed) => [seed.registrationId, seed.seed]) ?? []
    )
    const participants: ParticipantSeed[] = seededRegistrationIds.map(
      (registrationId, idx) => ({
        registrationId,
        seed: seedMap.get(registrationId) ?? idx + 1,
      })
    )
    const { matches: bracketMatches, totals } =
      generateDoubleEliminationBracket({
        participants,
        losersStartRoundsBeforeFinal,
      })

    const idMap = new Map<string, string>()
    for (const match of bracketMatches) {
      const [insertedMatch] = await db
        .insert(schema.matches)
        .values({
          eventId,
          groupId: null,
          round: match.round,
          matchNumber: match.matchNumber,
          registration1Id: match.registration1Id,
          registration2Id: match.registration2Id,
          bracketPosition: match.bracketPosition,
          bracketType: match.bracketType,
          winnerToSlot: match.winnerTo?.slot ?? null,
          loserToSlot: match.loserTo?.slot ?? null,
          played: match.played,
          winnerId: match.played ? match.winnerId : null,
        })
        .returning()

      idMap.set(match.id, insertedMatch.id)
    }

    for (const match of bracketMatches) {
      const matchId = idMap.get(match.id)
      if (!matchId) continue

      const winnerToId = match.winnerTo ? idMap.get(match.winnerTo.id) : null
      const loserToId = match.loserTo ? idMap.get(match.loserTo.id) : null

      await db
        .update(schema.matches)
        .set({
          winnerTo: winnerToId ?? null,
          loserTo: loserToId ?? null,
        })
        .where(eq(schema.matches.id, matchId))
    }

    if (seeds && seeds.length > 0) {
      await updateRegistrationSeeds(seeds)
    }

    const finalMatches = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.eventId, eventId))

    return {
      matches: finalMatches,
      totalRounds: totals.winners + totals.losers,
      bracketSize: totals.bracketSize,
      matchCount: finalMatches.length,
    }
  }

  // Single elimination path
  const {
    matches: bracketMatches,
    totalRounds,
    bracketSize,
  } = generateSingleEliminationBracket(
    registrationIds,
    seeds,
    hasThirdPlaceMatch
  )

  const positionToIdMap = await createBracketMatches(eventId, bracketMatches)
  await linkBracketMatches(bracketMatches, positionToIdMap)
  await processAndApplyByeAdvancements(bracketMatches, positionToIdMap)

  if (seeds && seeds.length > 0) {
    await updateRegistrationSeeds(seeds)
  }

  const finalMatches = await db
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.eventId, eventId))

  return {
    matches: finalMatches,
    totalRounds,
    bracketSize,
    matchCount: finalMatches.length,
  }
}
