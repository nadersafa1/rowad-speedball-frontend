import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkEventUpdateAuthorization } from '@/lib/authorization'
import {
  deleteAllHeats,
  validateEventForHeatGeneration,
} from '@/lib/services/heat-service'

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

    // Validate event format supports heat generation
    const formatValidation = validateEventForHeatGeneration(event[0])
    if (!formatValidation.valid)
      return Response.json({ message: formatValidation.error }, { status: 400 })

    // Check if heats exist
    const heats = await db
      .select({ id: schema.groups.id })
      .from(schema.groups)
      .where(eq(schema.groups.eventId, eventId))

    if (heats.length === 0) {
      return Response.json({ message: 'No heats to reset' }, { status: 400 })
    }

    // Delete all heats
    const deletedCount = await deleteAllHeats(eventId)

    return Response.json(
      {
        message: 'Heats reset successfully',
        deletedHeats: deletedCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error resetting heats:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
