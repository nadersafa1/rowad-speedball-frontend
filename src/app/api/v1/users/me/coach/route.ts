import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { auth } from '@/lib/auth'

// Restricted schema for users updating their own coach data
const myCoachUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name is too long')
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  )
  .strict()

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user has a linked coach record
    const coach = await db.query.coaches.findFirst({
      where: eq(schema.coaches.userId, userId),
    })

    if (!coach) {
      return Response.json(
        { message: 'No linked coach record found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const bodyResult = myCoachUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const updateData = bodyResult.data

    // Update coach data
    const updatedCoach = await db
      .update(schema.coaches)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.coaches.id, coach.id))
      .returning()

    return Response.json(updatedCoach[0])
  } catch (error) {
    console.error('Error updating coach profile:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

