import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Calculates and updates the completed flag for an event
 * Event is completed when ALL matches in ALL groups are played
 * Event is not completed if ANY match has played === false
 */
export async function updateEventCompletedStatus(
  eventId: string
): Promise<void> {
  // Get all matches for this event (across all groups)
  const allMatches = await db
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.eventId, eventId))

  // If no matches exist, event is not completed
  if (allMatches.length === 0) {
    await db
      .update(schema.events)
      .set({ completed: false, updatedAt: new Date() })
      .where(eq(schema.events.id, eventId))
    return
  }

  // Check if any match is not played
  const hasUnplayedMatches = allMatches.some((m) => !m.played)

  // Event is completed only if ALL matches are played
  const completed = !hasUnplayedMatches

  await db
    .update(schema.events)
    .set({ completed, updatedAt: new Date() })
    .where(eq(schema.events.id, eventId))
}
