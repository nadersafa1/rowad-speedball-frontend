import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { setsCreateSchema, setsQuerySchema } from '@/types/api/sets.schemas'
import { requireAdmin } from '@/lib/auth-middleware'
import { validateSetAddition } from '@/lib/validations/match-validation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const parseResult = setsQuerySchema.safeParse(queryParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { matchId } = parseResult.data

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
  const adminResult = await requireAdmin(request)
  if (
    !adminResult.authenticated ||
    !('authorized' in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response
  }

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
