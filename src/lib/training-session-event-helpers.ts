import { eq, and, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { addPlayersToRegistration } from './registration-helpers'

/**
 * Registers eligible attendees (present/late) from a training session to an event
 * Only works for solo/singles events where each player gets their own registration
 * Only registers players that match the event gender (male/female/mixed)
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

  // Filter players by event gender to get only eligible players
  const eligibleRecords = attendanceRecords.filter((record) => {
    const playerGender = record.player.gender as 'male' | 'female'

    if (eventGender === 'male') {
      return playerGender === 'male'
    } else if (eventGender === 'female') {
      return playerGender === 'female'
    } else {
      // 'mixed' - all players are eligible
      return true
    }
  })

  if (eligibleRecords.length === 0) {
    return []
  }

  // Get eligible player IDs
  const eligiblePlayerIds = eligibleRecords.map((record) => record.player.id)

  // Create individual registrations for each eligible attendee
  const createdRegistrations = []

  for (const playerId of eligiblePlayerIds) {
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
