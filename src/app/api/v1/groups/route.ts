import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  groupsCreateSchema,
  groupsQuerySchema,
} from '@/types/api/groups.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  checkEventCreateAuthorization,
  checkEventReadAuthorization,
} from '@/lib/authorization'
import {
  createGroup,
  validateRegistrations,
  validateEventForGroupCreation,
} from '@/lib/services/groups-service'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = groupsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { eventId } = parseResult.data

    // If eventId is provided, check authorization for that event
    if (eventId) {
      const event = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId))
        .limit(1)

      if (event.length === 0) {
        return Response.json({ message: 'Event not found' }, { status: 404 })
      }

      const authError = checkEventReadAuthorization(context, event[0])
      if (authError) {
        return authError
      }
    }

    let query = db.select().from(schema.groups)

    if (eventId) {
      query = query.where(eq(schema.groups.eventId, eventId)) as any
    }

    const groups = await query

    return Response.json({ groups })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/groups',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function POST(request: NextRequest) {
  const context = await getOrganizationContext()

  try {
    const body = await request.json()
    const parseResult = groupsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { eventId, registrationIds } = parseResult.data

    // Verify event exists
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    // Validate event format supports groups
    const formatValidation = validateEventForGroupCreation(event[0].format)
    if (!formatValidation.valid) {
      return Response.json({ message: formatValidation.error }, { status: 400 })
    }

    // Check authorization based on parent event
    const authError = checkEventCreateAuthorization(context)
    if (authError) {
      return authError
    }

    // Validate registrations belong to the event
    const registrationValidation = await validateRegistrations(
      eventId,
      registrationIds
    )
    if (!registrationValidation.valid) {
      return Response.json(
        {
          message: `Invalid registration IDs: ${registrationValidation.invalidIds?.join(
            ', '
          )}`,
        },
        { status: 400 }
      )
    }

    // Create group with matches using the service
    const result = await createGroup({ eventId, registrationIds })

    return Response.json(
      {
        message: 'Group created and matches generated successfully',
        group: result.group,
        matchCount: result.matchCount,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/groups',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
