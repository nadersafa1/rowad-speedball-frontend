import { NextRequest } from 'next/server'
import { and, count, desc, asc, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  playerNoteParamsSchema,
  playerNotesQuerySchema,
  playerNotesCreateSchema,
} from '@/types/api/player-notes.schemas'
import { createPaginatedResponse } from '@/types/api/pagination'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  checkPlayerNotesReadAuthorization,
  checkPlayerNotesCreateAuthorization,
} from '@/lib/player-notes-authorization-helpers'

/**
 * GET /api/v1/players/[id]/notes
 * List player notes with pagination and filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const paramsResult = playerNoteParamsSchema.safeParse({
    playerId: resolvedParams.id,
  })

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const queryParams = Object.fromEntries(searchParams.entries())
  const queryResult = playerNotesQuerySchema.safeParse(queryParams)

  if (!queryResult.success) {
    return Response.json(z.treeifyError(queryResult.error), { status: 400 })
  }

  try {
    const { playerId } = paramsResult.data
    const { page, limit, noteType, sortOrder } = queryResult.data

    // Check if player exists
    const player = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, playerId))
      .limit(1)

    if (!player[0]) {
      return Response.json({ message: 'Player not found' }, { status: 404 })
    }

    // Get organization context and check authorization
    const context = await getOrganizationContext()
    const authError = checkPlayerNotesReadAuthorization(context, player[0])
    if (authError) return authError

    // Build conditions for notes query
    const conditions: any[] = [eq(schema.playerNotes.playerId, playerId)]

    // Add note type filter if specified and not 'all'
    if (noteType && noteType !== 'all') {
      conditions.push(eq(schema.playerNotes.noteType, noteType))
    }

    const combinedCondition = conditions.reduce((acc, condition) =>
      acc ? and(acc, condition) : condition
    )

    // Calculate offset
    const offset = (page - 1) * limit

    // Alias for updatedBy user join
    const updatedByUserAlias = alias(schema.user, 'updatedByUser')

    // Count query
    const countQuery = db
      .select({ count: count() })
      .from(schema.playerNotes)
      .where(combinedCondition)

    // Data query with user joins
    const dataQuery = db
      .select({
        note: schema.playerNotes,
        createdByUser: {
          id: schema.user.id,
          name: schema.user.name,
        },
        updatedByUser: {
          id: updatedByUserAlias.id,
          name: updatedByUserAlias.name,
        },
      })
      .from(schema.playerNotes)
      .leftJoin(schema.user, eq(schema.playerNotes.createdBy, schema.user.id))
      .leftJoin(
        updatedByUserAlias,
        eq(schema.playerNotes.updatedBy, updatedByUserAlias.id)
      )
      .where(combinedCondition)
      .orderBy(
        sortOrder === 'asc'
          ? asc(schema.playerNotes.createdAt)
          : desc(schema.playerNotes.createdAt)
      )
      .limit(limit)
      .offset(offset)

    const [countResult, notesWithUsers] = await Promise.all([
      countQuery,
      dataQuery,
    ])

    const totalItems = countResult[0].count

    // Format response data
    const formattedNotes = notesWithUsers.map((row) => ({
      id: row.note.id,
      playerId: row.note.playerId,
      organizationId: row.note.organizationId,
      content: row.note.content,
      noteType: row.note.noteType,
      createdBy: row.note.createdBy,
      createdByName: row.createdByUser?.name || 'Unknown User',
      updatedBy: row.note.updatedBy,
      updatedByName: row.updatedByUser?.name || null,
      createdAt: row.note.createdAt.toISOString(),
      updatedAt: row.note.updatedAt.toISOString(),
    }))

    const paginatedResponse = createPaginatedResponse(
      formattedNotes,
      page,
      limit,
      totalItems
    )

    return Response.json(paginatedResponse, { status: 200 })
  } catch (error) {
    console.error('Error fetching player notes:', error)
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/players/[id]/notes
 * Create a new player note
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const paramsResult = playerNoteParamsSchema.safeParse({
    playerId: resolvedParams.id,
  })

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const bodyResult = playerNotesCreateSchema.safeParse(body)

  if (!bodyResult.success) {
    return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
  }

  try {
    const { playerId } = paramsResult.data
    const { content, noteType } = bodyResult.data

    // Check if player exists
    const player = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, playerId))
      .limit(1)

    if (!player[0]) {
      return Response.json({ message: 'Player not found' }, { status: 404 })
    }

    // Check if player has an organization
    if (!player[0].organizationId) {
      return Response.json(
        {
          message: 'Cannot create notes for players without an organization',
        },
        { status: 400 }
      )
    }

    // Get organization context and check authorization
    const context = await getOrganizationContext()
    const authError = checkPlayerNotesCreateAuthorization(context, player[0])
    if (authError) return authError

    // Create the note
    const newNote = await db
      .insert(schema.playerNotes)
      .values({
        playerId,
        organizationId: player[0].organizationId,
        content,
        noteType,
        createdBy: context.userId!,
      })
      .returning()

    // Fetch the created note with user information
    const noteWithUser = await db
      .select({
        note: schema.playerNotes,
        createdByUser: {
          id: schema.user.id,
          name: schema.user.name,
        },
      })
      .from(schema.playerNotes)
      .leftJoin(schema.user, eq(schema.playerNotes.createdBy, schema.user.id))
      .where(eq(schema.playerNotes.id, newNote[0].id))
      .limit(1)

    if (!noteWithUser[0]) {
      return Response.json(
        { message: 'Error retrieving created note' },
        { status: 500 }
      )
    }

    // Format response
    const formattedNote = {
      id: noteWithUser[0].note.id,
      playerId: noteWithUser[0].note.playerId,
      organizationId: noteWithUser[0].note.organizationId,
      content: noteWithUser[0].note.content,
      noteType: noteWithUser[0].note.noteType,
      createdBy: noteWithUser[0].note.createdBy,
      createdByName: noteWithUser[0].createdByUser?.name || 'Unknown User',
      updatedBy: noteWithUser[0].note.updatedBy,
      updatedByName: null,
      createdAt: noteWithUser[0].note.createdAt.toISOString(),
      updatedAt: noteWithUser[0].note.updatedAt.toISOString(),
    }

    return Response.json(formattedNote, { status: 201 })
  } catch (error) {
    console.error('Error creating player note:', error)
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
