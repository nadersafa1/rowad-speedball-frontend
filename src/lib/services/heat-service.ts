/**
 * Heat Service - Business logic for heat generation in test events
 * Heats are groups used for organizing solo test events (like swimming races)
 */

import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { isTestEventType } from '@/lib/utils/test-event-utils'
import { DEFAULT_PLAYERS_PER_HEAT } from '@/types/event-types'

export interface GenerateHeatsParams {
  eventId: string
  playersPerHeat?: number
  shuffleRegistrations?: boolean
}

export interface GenerateHeatsResult {
  heats: Array<{
    id: string
    name: string
    registrationCount: number
  }>
  totalHeats: number
  totalRegistrations: number
}

/**
 * Validates event format for heat generation
 */
export const validateEventForHeatGeneration = (
  event: typeof schema.events.$inferSelect
): { valid: boolean; error?: string } => {
  if (!isTestEventType(event.eventType)) {
    return {
      valid: false,
      error: 'Heats can only be generated for test events',
    }
  }

  if (event.format !== 'tests') {
    return {
      valid: false,
      error: 'Event format must be "tests" to generate heats',
    }
  }

  return { valid: true }
}

/**
 * Checks if heats already exist for the event
 */
export const checkHeatsExist = async (eventId: string): Promise<boolean> => {
  const existingHeats = await db
    .select()
    .from(schema.groups)
    .where(eq(schema.groups.eventId, eventId))
    .limit(1)

  return existingHeats.length > 0
}

/**
 * Generates heat name (A, B, C, ..., Z, AA, AB, ...)
 */
export const getHeatName = (index: number): string => {
  if (index < 26) {
    return String.fromCharCode(65 + index) // A, B, C, ...
  }
  // For more than 26 heats, use AA, AB, AC, ...
  const first = String.fromCharCode(65 + Math.floor(index / 26) - 1)
  const second = String.fromCharCode(65 + (index % 26))
  return first + second
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generates heats for a test event
 * Distributes registrations across heats of specified size
 */
export const generateHeats = async (
  params: GenerateHeatsParams
): Promise<GenerateHeatsResult> => {
  const {
    eventId,
    playersPerHeat = DEFAULT_PLAYERS_PER_HEAT,
    shuffleRegistrations = true,
  } = params

  // Get all registrations for the event
  const registrations = await db
    .select()
    .from(schema.registrations)
    .where(eq(schema.registrations.eventId, eventId))

  if (registrations.length === 0) {
    return {
      heats: [],
      totalHeats: 0,
      totalRegistrations: 0,
    }
  }

  // Optionally shuffle registrations for random heat assignment
  const orderedRegistrations = shuffleRegistrations
    ? shuffleArray(registrations)
    : registrations

  // Calculate number of heats needed
  const totalHeats = Math.ceil(orderedRegistrations.length / playersPerHeat)

  const heatsResult: GenerateHeatsResult['heats'] = []

  // Create heats and assign registrations
  for (let heatIndex = 0; heatIndex < totalHeats; heatIndex++) {
    const heatName = getHeatName(heatIndex)
    const startIndex = heatIndex * playersPerHeat
    const endIndex = Math.min(startIndex + playersPerHeat, registrations.length)
    const heatRegistrations = orderedRegistrations.slice(startIndex, endIndex)

    // Create the heat (group)
    const [newHeat] = await db
      .insert(schema.groups)
      .values({
        eventId,
        name: heatName,
      })
      .returning()

    // Assign registrations to this heat
    for (const registration of heatRegistrations) {
      await db
        .update(schema.registrations)
        .set({
          groupId: newHeat.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.registrations.id, registration.id))
    }

    heatsResult.push({
      id: newHeat.id,
      name: heatName,
      registrationCount: heatRegistrations.length,
    })
  }

  return {
    heats: heatsResult,
    totalHeats,
    totalRegistrations: orderedRegistrations.length,
  }
}

/**
 * Deletes all heats (groups) for an event
 * Used when regenerating heats
 */
export const deleteAllHeats = async (eventId: string): Promise<number> => {
  // First, unassign all registrations from heats
  await db
    .update(schema.registrations)
    .set({ groupId: null, updatedAt: new Date() })
    .where(eq(schema.registrations.eventId, eventId))

  // Then delete all groups/heats
  const deleted = await db
    .delete(schema.groups)
    .where(eq(schema.groups.eventId, eventId))
    .returning()

  return deleted.length
}
