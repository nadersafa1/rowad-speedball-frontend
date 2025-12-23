import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { checkUserReadAuthorization } from '@/lib/authorization'
import { TEAM_LEVELS } from '@/types/team-level'

// Restricted schema for users updating their own player data
const myPlayerUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name is too long')
      .optional(),
    preferredHand: z
      .enum(['left', 'right', 'both'], {
        message: 'Preferred hand must be left, right, or both',
      })
      .optional(),
    teamLevel: z.enum(TEAM_LEVELS).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

export async function PATCH(request: NextRequest) {
  // Authorization check
  const context = await getOrganizationContext()
  const userId = context.userId!
  const authError = checkUserReadAuthorization(context, userId)
  if (authError) return authError

  try {

    // Check if user has a linked player record
    const player = await db.query.players.findFirst({
      where: eq(schema.players.userId, userId),
    })

    if (!player) {
      return Response.json(
        { message: 'No linked player record found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const bodyResult = myPlayerUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const updateData = bodyResult.data

    // Update player data
    const updatedPlayer = await db
      .update(schema.players)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.players.id, player.id))
      .returning()

    return Response.json(updatedPlayer[0])
  } catch (error) {
    console.error('Error updating player profile:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
