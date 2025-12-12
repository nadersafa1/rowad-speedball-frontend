import { eq, and, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { addPlayersToRegistration } from './registration-helpers'
import { validateGenderRulesForPlayers } from './validations/registration-validation'

/**
 * Registers all attendees (present/late) from a training session to an event
 * Only works for solo/singles events where each player gets their own registration
 * @param eventId - The event ID
 * @param trainingSessionId - The training session ID
 * @param eventType - The event type (must be 'solo' or 'singles')
 * @param eventGender - The event gender ('male', 'female', or 'mixed')
 * @returns Array of created registrations
 */
export async function registerSessionAttendeesToEvent(
  eventId: string,
  trainingSessionId: string,
  eventType: string,
  eventGender: 'male' | 'female' | 'mixed'
) {
  // Validate event type - only solo/singles allowed
  if (eventType !== 'solo' && eventType !== 'singles') {
    throw new Error(
      'Automatic registration is only available for solo/singles events'
    )
  }

  // Fetch all attendance records with status 'present' or 'late'
  const attendanceRecords = await db
    .select({
      attendance: schema.trainingSessionAttendance,
      player: schema.players,
    })
    .from(schema.trainingSessionAttendance)
    .innerJoin(
      schema.players,
      eq(schema.trainingSessionAttendance.playerId, schema.players.id)
    )
    .where(
      and(
        eq(
          schema.trainingSessionAttendance.trainingSessionId,
          trainingSessionId
        ),
        inArray(schema.trainingSessionAttendance.status, ['present', 'late'])
      )
    )

  if (attendanceRecords.length === 0) {
    return []
  }

  // Get all player IDs
  const playerIds = attendanceRecords.map((record) => record.player.id)
  const players = attendanceRecords.map((record) => record.player)

  // Validate gender rules for all players
  const genders = players.map((p) => p.gender as 'male' | 'female')
  const genderValidation = validateGenderRulesForPlayers(
    eventGender,
    genders,
    eventType as 'solo' | 'singles'
  )

  if (!genderValidation.valid) {
    throw new Error(genderValidation.error || 'Gender validation failed')
  }

  // Create individual registrations for each attendee
  const createdRegistrations = []

  for (const playerId of playerIds) {
    // Create registration
    const [registration] = await db
      .insert(schema.registrations)
      .values({ eventId })
      .returning()

    // Add player to registration
    await addPlayersToRegistration(registration.id, [playerId])

    createdRegistrations.push(registration)
  }

  return createdRegistrations
}
