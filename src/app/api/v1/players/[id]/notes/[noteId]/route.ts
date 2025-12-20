import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  playerNoteParamsSchema,
  playerNotesUpdateSchema,
} from '@/types/api/player-notes.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import {
  checkPlayerNoteUpdateAuthorization,
  checkPlayerNoteDeleteAuthorization,
} from '@/lib/player-notes-authorization-helpers'

/**
 * PATCH /api/v1/players/[id]/notes/[noteId]
 * Update a player note
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const resolvedParams = await params
  const paramsResult = playerNoteParamsSchema.safeParse({
    playerId: resolvedParams.id,
    noteId: resolvedParams.noteId,
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

  const bodyResult = playerNotesUpdateSchema.safeParse(body)

  if (!bodyResult.success) {
    return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
  }

  try {
    const { noteId } = paramsResult.data

    // Check if note exists
    const note = await db
      .select()
      .from(schema.playerNotes)
      .where(eq(schema.playerNotes.id, noteId!))
      .limit(1)

    if (!note[0]) {
      return Response.json({ message: 'Note not found' }, { status: 404 })
    }

    // Get organization context and check authorization
    const context = await getOrganizationContext()
    const authError = checkPlayerNoteUpdateAuthorization(context, note[0])
    if (authError) return authError

    // Update the note
    const { content, noteType } = bodyResult.data
    const updateData: any = {
      updatedBy: context.userId!,
      updatedAt: new Date(),
    }

    if (content !== undefined) updateData.content = content
    if (noteType !== undefined) updateData.noteType = noteType

    await db
      .update(schema.playerNotes)
      .set(updateData)
      .where(eq(schema.playerNotes.id, noteId!))

    // Fetch the updated note with user information
    const updatedByUserAlias = alias(schema.user, 'updatedByUser')

    const noteWithUser = await db
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
      .where(eq(schema.playerNotes.id, noteId!))
      .limit(1)

    if (!noteWithUser[0]) {
      return Response.json(
        { message: 'Error retrieving updated note' },
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
      updatedByName: noteWithUser[0].updatedByUser?.name || null,
      createdAt: noteWithUser[0].note.createdAt.toISOString(),
      updatedAt: noteWithUser[0].note.updatedAt.toISOString(),
    }

    return Response.json(formattedNote, { status: 200 })
  } catch (error) {
    console.error('Error updating player note:', error)
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/players/[id]/notes/[noteId]
 * Delete a player note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const resolvedParams = await params
  const paramsResult = playerNoteParamsSchema.safeParse({
    playerId: resolvedParams.id,
    noteId: resolvedParams.noteId,
  })

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const { noteId } = paramsResult.data

    // Check if note exists
    const note = await db
      .select()
      .from(schema.playerNotes)
      .where(eq(schema.playerNotes.id, noteId!))
      .limit(1)

    if (!note[0]) {
      return Response.json({ message: 'Note not found' }, { status: 404 })
    }

    // Get organization context and check authorization
    const context = await getOrganizationContext()
    const authError = checkPlayerNoteDeleteAuthorization(context, note[0])
    if (authError) return authError

    // Delete the note
    await db.delete(schema.playerNotes).where(eq(schema.playerNotes.id, noteId!))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting player note:', error)
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
