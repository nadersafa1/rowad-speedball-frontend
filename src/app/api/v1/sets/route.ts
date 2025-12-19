import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { setsCreateSchema, setsQuerySchema } from '@/types/api/sets.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { validateSetAddition } from '@/lib/validations/match-validation'
import {
  checkEventUpdateAuthorization,
  checkEventReadAuthorization,
  canPlayerUpdateMatch,
} from '@/lib/event-authorization-helpers'

export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = setsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { matchId } = parseResult.data

    // If matchId is provided, check authorization for the parent event
    if (matchId) {
      const match = await db
        .select()
        .from(schema.matches)
        .where(eq(schema.matches.id, matchId))
        .limit(1)

      if (match.length === 0) {
        return Response.json({ message: 'Match not found' }, { status: 404 })
      }

      const event = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, match[0].eventId))
        .limit(1)

      if (event.length === 0) {
        return Response.json({ message: 'Event not found' }, { status: 404 })
      }

      const authError = checkEventReadAuthorization(context, event[0])
      if (authError) {
        return authError
      }
    }

    let query = db.select().from(schema.sets)

    if (matchId) {
      query = query.where(eq(schema.sets.matchId, matchId)) as any
    }

    const sets = await query

    return Response.json({ sets })
  } catch (error) {
    console.error('Error fetching sets:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const context = await getOrganizationContext()

  try {
    const body = await request.json()
    const parseResult = setsCreateSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 })
    }

    const { matchId, setNumber, registration1Score, registration2Score } =
      parseResult.data

    // Get match and event
    const match = await db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.id, matchId))
      .limit(1)

    if (match.length === 0) {
      return Response.json({ message: 'Match not found' }, { status: 404 })
    }

    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, match[0].eventId))
      .limit(1)

    if (event.length === 0) {
      return Response.json({ message: 'Event not found' }, { status: 404 })
    }

    // Check authorization: coaches/admins/owners can always create sets
    const authError = checkEventUpdateAuthorization(context, event[0])

    // If standard authorization fails, check if player can update their own match
    if (authError) {
      const playerCanUpdate = await canPlayerUpdateMatch(
        context,
        match[0],
        event[0]
      )

      if (!playerCanUpdate) {
        return authError
      }
      // Player can update - continue with set creation
    }

    // Check if match date is set
    if (!match[0].matchDate) {
      return Response.json(
        { message: 'Match date must be set before entering set results' },
        { status: 400 }
      )
    }

    // Get existing sets
    const existingSets = await db
      .select()
      .from(schema.sets)
      .where(eq(schema.sets.matchId, matchId))

    const setData = existingSets.map((s) => ({
      id: s.id,
      setNumber: s.setNumber,
      registration1Score: s.registration1Score,
      registration2Score: s.registration2Score,
      played: s.played,
    }))

    // Validate set addition
    const validation = await validateSetAddition(
      matchId,
      event[0].bestOf,
      setData,
      { played: match[0].played }
    )

    if (!validation.valid) {
      return Response.json({ message: validation.error }, { status: 400 })
    }

    // Create set
    const result = await db
      .insert(schema.sets)
      .values({
        matchId,
        setNumber,
        registration1Score,
        registration2Score,
        played: false,
      })
      .returning()

    return Response.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating set:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
