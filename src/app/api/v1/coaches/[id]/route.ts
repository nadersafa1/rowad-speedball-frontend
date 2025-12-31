import { NextRequest } from 'next/server'
import { and, eq, not } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  coachesParamsSchema,
  coachesUpdateSchema,
} from '@/types/api/coaches.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { validateUserNotLinked } from '@/lib/user-linking-helpers'
import { sendOrganizationRemovalEmail } from '@/actions/emails/send-organization-removal-email'
import { sendOrganizationWelcomeEmail } from '@/actions/emails/send-organization-welcome-email'
import {
  checkCoachReadAuthorization,
  checkCoachUpdateAuthorization,
  checkCoachDeleteAuthorization,
} from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const context = await getOrganizationContext()
  const authError = checkCoachReadAuthorization(context)
  if (authError) return authError

  const resolvedParams = await params
  const parseResult = coachesParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const coach = await db
      .select()
      .from(schema.coaches)
      .where(eq(schema.coaches.id, id))
      .limit(1)

    if (coach.length === 0) {
      return Response.json({ message: 'Coach not found' }, { status: 404 })
    }

    // Get related training sessions
    const trainingSessions = await db
      .select({
        trainingSession: schema.trainingSessions,
      })
      .from(schema.trainingSessionCoaches)
      .innerJoin(
        schema.trainingSessions,
        eq(
          schema.trainingSessionCoaches.trainingSessionId,
          schema.trainingSessions.id
        )
      )
      .where(eq(schema.trainingSessionCoaches.coachId, id))

    const coachWithSessions = {
      ...coach[0],
      trainingSessions: trainingSessions.map((ts) => ts.trainingSession),
    }

    return Response.json(coachWithSessions)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/coaches/[id]',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const paramsResult = coachesParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const body = await request.json()
    const bodyResult = coachesUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const { id } = resolvedParams
    const updateData = bodyResult.data

    const existingCoach = await db
      .select()
      .from(schema.coaches)
      .where(eq(schema.coaches.id, id))
      .limit(1)

    if (existingCoach.length === 0) {
      return Response.json({ message: 'Coach not found' }, { status: 404 })
    }

    const coachData = existingCoach[0]

    // Authorization check
    const context = await getOrganizationContext()
    const authError = checkCoachUpdateAuthorization(context, coachData)
    if (authError) return authError

    const { isSystemAdmin } = context

    // System admins can change organizationId, org members cannot
    let finalUpdateData = updateData
    if (!isSystemAdmin && 'organizationId' in updateData) {
      const { organizationId, ...rest } = updateData
      finalUpdateData = rest
    }

    // Validate user is not already linked (if userId is being updated)
    if (updateData.userId !== undefined) {
      const validationError = await validateUserNotLinked(
        updateData.userId,
        undefined,
        id
      )
      if (validationError) {
        return Response.json(
          { message: validationError.error },
          { status: 400 }
        )
      }
    }

    let updatedCoach

    // If userId is being unlinked, use transaction to ensure atomicity
    if (
      updateData.userId === null &&
      coachData.userId &&
      coachData.organizationId
    ) {
      // Store values in variables to help TypeScript understand they're non-null
      const previousUserId = coachData.userId
      const organizationId = coachData.organizationId

      // Fetch user and organization data before transaction for email
      const [user, organization, existingMemberBefore] = await Promise.all([
        db.query.user.findFirst({
          where: eq(schema.user.id, previousUserId),
        }),
        db.query.organization.findFirst({
          where: eq(schema.organization.id, organizationId),
        }),
        db.query.member.findFirst({
          where: and(
            eq(schema.member.userId, previousUserId),
            eq(schema.member.organizationId, organizationId)
          ),
        }),
      ])

      updatedCoach = await db.transaction(async (tx) => {
        // 1. Update coach userId to null
        const result = await tx
          .update(schema.coaches)
          .set({ userId: null })
          .where(eq(schema.coaches.id, id))
          .returning()

        // 2. Find and remove membership if role matches
        const existingMember = await tx.query.member.findFirst({
          where: and(
            eq(schema.member.userId, previousUserId),
            eq(schema.member.organizationId, organizationId)
          ),
        })

        if (existingMember && existingMember.role === 'coach') {
          await tx
            .delete(schema.member)
            .where(eq(schema.member.id, existingMember.id))
        }

        return result[0]
      })

      // Send removal email after successful transaction
      // Log error but don't fail the operation if email fails
      if (
        existingMemberBefore &&
        existingMemberBefore.role === 'coach' &&
        user &&
        organization
      ) {
        try {
          await sendOrganizationRemovalEmail({
            user,
            organization,
            role: existingMemberBefore.role,
          })
        } catch (error) {
          console.error('Error sending removal email:', error)
        }
      }
    } else {
      // Normal update - use transaction if userId is being linked
      if (
        updateData.userId !== undefined &&
        updateData.userId !== null &&
        coachData.organizationId
      ) {
        const userId = updateData.userId
        const organizationId = coachData.organizationId

        // Fetch user and organization data before transaction for email
        const [user, organization] = await Promise.all([
          db.query.user.findFirst({
            where: eq(schema.user.id, userId),
          }),
          db.query.organization.findFirst({
            where: eq(schema.organization.id, organizationId),
          }),
        ])

        updatedCoach = await db.transaction(async (tx) => {
          // 1. Update coach userId
          const result = await tx
            .update(schema.coaches)
            .set(finalUpdateData)
            .where(eq(schema.coaches.id, id))
            .returning()

          const updatedCoachData = result[0]

          // 2. Check existing membership and add/update in transaction
          const existingMember = await tx.query.member.findFirst({
            where: eq(schema.member.userId, userId),
          })

          if (!existingMember) {
            // User is not a member of any organization, create membership
            await tx.insert(schema.member).values({
              organizationId,
              userId,
              role: 'coach',
              createdAt: new Date(),
            })
          } else if (existingMember.organizationId !== organizationId) {
            // User is a member of a different organization
            await tx
              .update(schema.member)
              .set({
                organizationId,
                role: 'coach',
              })
              .where(eq(schema.member.id, existingMember.id))
          } else if (existingMember.role !== 'coach') {
            // User is already a member of this organization but with different role
            await tx
              .update(schema.member)
              .set({ role: 'coach' })
              .where(eq(schema.member.id, existingMember.id))
          }
          // If user is already a member with coach role, no action needed

          return updatedCoachData
        })

        // After successful transaction, trigger welcome email hook
        // Log error but don't fail the operation if email fails
        if (user && organization) {
          try {
            await sendOrganizationWelcomeEmail({
              user,
              organization,
              role: 'coach',
            })
          } catch (error) {
            console.error('Error sending welcome email:', error)
          }
        }
      } else {
        // No userId being linked, normal update without transaction
        const result = await db
          .update(schema.coaches)
          .set(finalUpdateData)
          .where(eq(schema.coaches.id, id))
          .returning()

        updatedCoach = result[0]
      }
    }

    return Response.json(updatedCoach)
  } catch (error) {
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/coaches/[id]',
      method: 'PATCH',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const parseResult = coachesParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const existingCoach = await db
      .select()
      .from(schema.coaches)
      .where(eq(schema.coaches.id, id))
      .limit(1)

    if (existingCoach.length === 0) {
      return Response.json({ message: 'Coach not found' }, { status: 404 })
    }

    const coachData = existingCoach[0]

    // Authorization check
    const context = await getOrganizationContext()
    const authError = checkCoachDeleteAuthorization(context, coachData)
    if (authError) return authError

    // If coach has a linked user with organization membership, remove membership atomically
    if (coachData.userId && coachData.organizationId) {
      // Store values in variables to help TypeScript understand they're non-null
      const userId = coachData.userId
      const organizationId = coachData.organizationId

      // Fetch user, organization, and member data before transaction for email
      const [user, organization, existingMemberBefore] = await Promise.all([
        db.query.user.findFirst({
          where: eq(schema.user.id, userId),
        }),
        db.query.organization.findFirst({
          where: eq(schema.organization.id, organizationId),
        }),
        db.query.member.findFirst({
          where: and(
            eq(schema.member.userId, userId),
            eq(schema.member.organizationId, organizationId)
          ),
        }),
      ])

      await db.transaction(async (tx) => {
        // 1. Delete the coach
        await tx.delete(schema.coaches).where(eq(schema.coaches.id, id))

        // 2. Find and remove membership if role matches
        const existingMember = await tx.query.member.findFirst({
          where: and(
            eq(schema.member.userId, userId),
            eq(schema.member.organizationId, organizationId)
          ),
        })

        if (existingMember && existingMember.role === 'coach') {
          await tx
            .delete(schema.member)
            .where(eq(schema.member.id, existingMember.id))
        }
      })

      // Send removal email after successful transaction
      // Log error but don't fail the operation if email fails
      if (
        existingMemberBefore &&
        existingMemberBefore.role === 'coach' &&
        user &&
        organization
      ) {
        try {
          await sendOrganizationRemovalEmail({
            user,
            organization,
            role: existingMemberBefore.role,
          })
        } catch (error) {
          console.error('Error sending removal email:', error)
        }
      }
    } else {
      // No linked user, just delete the coach
      await db.delete(schema.coaches).where(eq(schema.coaches.id, id))
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    const context = await getOrganizationContext()
    return handleApiError(error, {
      endpoint: '/api/v1/coaches/[id]',
      method: 'DELETE',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
