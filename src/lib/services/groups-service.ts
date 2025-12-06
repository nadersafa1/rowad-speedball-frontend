// Groups Service - Business logic for group management

import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { roundRobin } from '@/lib/utils/round-robin'
import { isGroupsFormat } from '@/lib/utils/event-format-helpers'

export interface CreateGroupParams {
  eventId: string
  registrationIds: string[]
}

export interface CreateGroupResult {
  group: typeof schema.groups.$inferSelect
  matchCount: number
}

/**
 * Validates that registrations belong to the event
 */
export const validateRegistrations = async (
  eventId: string,
  registrationIds: string[]
): Promise<{ valid: boolean; invalidIds?: string[] }> => {
  const registrations = await db
    .select()
    .from(schema.registrations)
    .where(eq(schema.registrations.eventId, eventId))

  const registrationIdsSet = new Set(registrations.map((r) => r.id))
  const invalidIds = registrationIds.filter((id) => !registrationIdsSet.has(id))

  if (invalidIds.length > 0) {
    return { valid: false, invalidIds }
  }

  return { valid: true }
}

/**
 * Generates the next group name (A, B, C, ...)
 */
export const generateGroupName = async (eventId: string): Promise<string> => {
  const existingGroups = await db
    .select()
    .from(schema.groups)
    .where(eq(schema.groups.eventId, eventId))

  return String.fromCharCode(65 + existingGroups.length) // A=65, B=66, etc.
}

/**
 * Creates a group and assigns registrations to it
 */
export const createGroupWithRegistrations = async (
  eventId: string,
  groupName: string,
  registrationIds: string[]
): Promise<typeof schema.groups.$inferSelect> => {
  const [newGroup] = await db
    .insert(schema.groups)
    .values({
      eventId,
      name: groupName,
    })
    .returning()

  // Update all registrations to assign them to the group
  for (const registrationId of registrationIds) {
    await db
      .update(schema.registrations)
      .set({
        groupId: newGroup.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.registrations.id, registrationId))
  }

  return newGroup
}

/**
 * Generates round-robin matches for a group
 */
export const generateGroupMatches = async (
  eventId: string,
  groupId: string,
  registrationIds: string[]
): Promise<number> => {
  const rounds = roundRobin(registrationIds.length, registrationIds)
  let matchCount = 0

  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
    const round = rounds[roundIndex]
    for (let matchIndex = 0; matchIndex < round.length; matchIndex++) {
      const [registration1Id, registration2Id] = round[matchIndex] as [
        string,
        string
      ]

      await db.insert(schema.matches).values({
        eventId,
        groupId,
        round: roundIndex + 1,
        matchNumber: matchIndex + 1,
        registration1Id,
        registration2Id,
      })
      matchCount++
    }
  }

  return matchCount
}

/**
 * Updates event completion status based on all groups
 */
export const updateEventCompletionFromGroups = async (
  eventId: string
): Promise<void> => {
  const eventGroups = await db
    .select()
    .from(schema.groups)
    .where(eq(schema.groups.eventId, eventId))

  const allGroupsCompleted = eventGroups.every((g) => g.completed)

  await db
    .update(schema.events)
    .set({
      completed: allGroupsCompleted && eventGroups.length > 0,
      updatedAt: new Date(),
    })
    .where(eq(schema.events.id, eventId))
}

/**
 * Main function to create a group with matches
 * Orchestrates the entire group creation process
 */
export const createGroup = async (
  params: CreateGroupParams
): Promise<CreateGroupResult> => {
  const { eventId, registrationIds } = params

  // Generate group name
  const groupName = await generateGroupName(eventId)

  // Create group and assign registrations
  const newGroup = await createGroupWithRegistrations(
    eventId,
    groupName,
    registrationIds
  )

  // Generate round-robin matches
  const matchCount = await generateGroupMatches(
    eventId,
    newGroup.id,
    registrationIds
  )

  // Update event completion status
  await updateEventCompletionFromGroups(eventId)

  return { group: newGroup, matchCount }
}

/**
 * Validates event format for group creation
 */
export const validateEventForGroupCreation = (
  format: string
): { valid: boolean; error?: string } => {
  if (!isGroupsFormat(format)) {
    return {
      valid: false,
      error:
        'Groups can only be created for events with groups format. Use generate-bracket endpoint for single-elimination events.',
    }
  }
  return { valid: true }
}

