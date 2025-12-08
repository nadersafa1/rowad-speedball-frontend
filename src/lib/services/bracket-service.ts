// Bracket Service - Business logic for single elimination bracket management

import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  generateSingleEliminationBracket,
  processByeAdvancements,
  SeedMapping,
} from '@/lib/utils/single-elimination'
import {
  nextPowerOf2,
  sortRegistrationsBySeeds,
} from '@/lib/utils/single-elimination-helpers'
import { generateModifiedDoubleEliminationBracket } from '@/lib/utils/modified-double-elimination'
import {
  isSingleEliminationFormat,
  isDoubleEliminationFormat,
} from '@/lib/utils/event-format-helpers'

export interface GenerateBracketParams {
  eventId: string
  format: string
  seeds?: SeedMapping[]
  hasThirdPlaceMatch: boolean
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
 * Creates modified double elimination matches in database
 * Uses match.id as key for lookup instead of bracketPosition
 */
const createDoubleElimMatches = async (
  eventId: string,
  bracketMatches: ReturnType<
    typeof generateModifiedDoubleEliminationBracket
  >['matches']
): Promise<Map<string, string>> => {
  const idMap = new Map<string, string>()
  let bracketPosition = 1

  for (const match of bracketMatches) {
    const matchNumber =
      Number(match.id.split('-')[2] ?? match.id.split('-')[1]) ||
      bracketPosition
    const hasBye = Boolean(
      (match.player1 && !match.player2) || (match.player2 && !match.player1)
    )
    const winnerId = hasBye ? match.player1 ?? match.player2 : null

    const [insertedMatch] = await db
      .insert(schema.matches)
      .values({
        eventId,
        groupId: null,
        round: match.round,
        matchNumber,
        registration1Id: match.player1,
        registration2Id: match.player2,
        bracketPosition,
        bracketType: match.bracketType,
        winnerToSlot: match.winnerToSlot ?? null,
        loserToSlot: match.loserToSlot ?? null,
        played: hasBye,
        winnerId,
      })
      .returning()

    idMap.set(match.id, insertedMatch.id)
    bracketPosition++
  }

  return idMap
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
 * Links double elimination matches via winnerTo/loserTo using DB IDs
 */
const linkDoubleElimMatches = async (
  bracketMatches: ReturnType<
    typeof generateModifiedDoubleEliminationBracket
  >['matches'],
  idMap: Map<string, string>
): Promise<void> => {
  for (const bracketMatch of bracketMatches) {
    const matchId = idMap.get(bracketMatch.id)
    if (!matchId) continue

    const winnerToId =
      typeof bracketMatch.winnerTo === 'string' &&
      idMap.has(bracketMatch.winnerTo)
        ? idMap.get(bracketMatch.winnerTo)!
        : null
    const loserToId =
      typeof bracketMatch.loserTo === 'string' &&
      idMap.has(bracketMatch.loserTo)
        ? idMap.get(bracketMatch.loserTo)!
        : null

    await db
      .update(schema.matches)
      .set({
        winnerTo: winnerToId ?? null,
        loserTo: loserToId ?? null,
      })
      .where(eq(schema.matches.id, matchId))
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
 * Main function to generate and persist a single elimination bracket
 */
export const generateBracket = async (
  params: GenerateBracketParams,
  registrationIds: string[]
): Promise<GenerateBracketResult> => {
  const { eventId, seeds, hasThirdPlaceMatch, format } = params
  const isDoubleElim = isDoubleEliminationFormat(format)

  if (isDoubleElim) {
    const seededRegistrationIds = sortRegistrationsBySeeds(
      registrationIds,
      seeds
    )
    const { matches: bracketMatches, totalRounds } =
      generateModifiedDoubleEliminationBracket(seededRegistrationIds)
    const paddedBracketSize = nextPowerOf2(registrationIds.length)

    const idMap = await createDoubleElimMatches(eventId, bracketMatches)
    await linkDoubleElimMatches(bracketMatches, idMap)

    // Auto-advance BYE winners
    for (const match of bracketMatches) {
      if (!match.winnerTo || typeof match.winnerTo !== 'string') continue
      const fromId = idMap.get(match.id)
      const toId = idMap.get(match.winnerTo)
      if (!fromId || !toId) continue

      const fromDb = await db
        .select()
        .from(schema.matches)
        .where(eq(schema.matches.id, fromId))
        .limit(1)

      if (
        fromDb[0] &&
        fromDb[0].played &&
        fromDb[0].winnerId &&
        match.winnerToSlot
      ) {
        const updateField =
          match.winnerToSlot === 1 ? 'registration1Id' : 'registration2Id'
        await db
          .update(schema.matches)
          .set({ [updateField]: fromDb[0].winnerId })
          .where(eq(schema.matches.id, toId))
      }
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
      totalRounds: totalRounds.winners + totalRounds.losers,
      bracketSize: paddedBracketSize,
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
