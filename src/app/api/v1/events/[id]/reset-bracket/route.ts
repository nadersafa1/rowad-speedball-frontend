import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventUpdateAuthorization } from '@/lib/event-authorization-helpers'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getOrganizationContext()
  const { id: eventId } = await params

  try {
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    const authError = checkEventUpdateAuthorization(context, event[0])
    if (authError) return authError

    // Only allow reset for elimination events
    if (
      event[0].format !== 'single-elimination' &&
      event[0].format !== 'double-elimination'
    ) {
      return Response.json(
        {
          message:
            'Reset bracket is only available for elimination events (single or double).',
        },
        { status: 400 }
      )
    }

    // Get all matches for this event
    const matches = await db
      .select({ id: schema.matches.id })
      .from(schema.matches)
      .where(eq(schema.matches.eventId, eventId))

    if (matches.length === 0) {
      return Response.json({ message: 'No bracket to reset' }, { status: 400 })
    }

    // Delete all sets for these matches
    const matchIds = matches.map((m) => m.id)
    for (const matchId of matchIds) {
      await db.delete(schema.sets).where(eq(schema.sets.matchId, matchId))
    }

    // Delete all matches
    await db.delete(schema.matches).where(eq(schema.matches.eventId, eventId))

    // Reset registration seeds
    await db
      .update(schema.registrations)
      .set({ seed: null })
      .where(eq(schema.registrations.eventId, eventId))

    // Reset event completion status
    await db
      .update(schema.events)
      .set({ completed: false })
      .where(eq(schema.events.id, eventId))

    return Response.json({ message: 'Bracket reset successfully' })
  } catch (error) {
    console.error('Error resetting bracket:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
