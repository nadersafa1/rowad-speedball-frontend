import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import {
  resultsParamsSchema,
  resultsUpdateSchema,
} from '@/types/api/results.schemas'
import { resultsService } from '@/lib/services/results.service'
import { getOrganizationContext } from '@/lib/organization-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const parseResult = resultsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    const result = await db
      .select({
        result: schema.testResults,
        player: schema.players,
        test: schema.tests,
      })
      .from(schema.testResults)
      .leftJoin(
        schema.players,
        eq(schema.testResults.playerId, schema.players.id)
      )
      .leftJoin(schema.tests, eq(schema.testResults.testId, schema.tests.id))
      .where(eq(schema.testResults.id, id))
      .limit(1)

    if (result.length === 0) {
      return Response.json({ message: 'Result not found' }, { status: 404 })
    }

    const row = result[0]
    const test = row.test

    // Get organization context for authorization (only if result exists)
    const { isSystemAdmin, organization } = await getOrganizationContext()

    // Authorization check: matches GET all results logic
    // System admin: can see all results
    // Org members: can see results from their org tests (public + private) + public tests + tests without org
    // Non-authenticated: can see results from public tests + tests without org
    if (!isSystemAdmin && test) {
      const isPublic = test.visibility === 'public'
      const hasNoOrganization = test.organizationId === null
      const isFromUserOrg =
        organization?.id && test.organizationId === organization.id

      // Allow if: public OR no organization OR from user's org
      // Block if: private AND has organization AND not from user's org
      if (!isPublic && !hasNoOrganization && !isFromUserOrg) {
        return Response.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    const totalScore = resultsService.calculateTotalScore(row.result)

    const resultWithCalculatedFields = {
      ...row.result,
      totalScore,
      averageScore: resultsService.calculateAverageScore(row.result),
      highestScore: resultsService.getHighestScore(row.result),
      lowestScore: resultsService.getLowestScore(row.result),
      performanceCategory: resultsService.getPerformanceCategory(totalScore),
      scoreDistribution: resultsService.getScoreDistribution(row.result),
      analysis: resultsService.analyzePerformance(row.result),
      player: row.player,
      test: row.test,
    }

    return Response.json(resultWithCalculatedFields)
  } catch (error) {
    console.error('Error fetching result:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const paramsResult = resultsParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  try {
    const body = await request.json()
    const bodyResult = resultsUpdateSchema.safeParse(body)

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 })
    }

    const { id } = resolvedParams
    const updateData = bodyResult.data

    // Get result with test information for authorization check
    const existingResultWithTest = await db
      .select({
        result: schema.testResults,
        test: schema.tests,
      })
      .from(schema.testResults)
      .leftJoin(schema.tests, eq(schema.testResults.testId, schema.tests.id))
      .where(eq(schema.testResults.id, id))
      .limit(1)

    if (existingResultWithTest.length === 0) {
      return Response.json({ message: 'Result not found' }, { status: 404 })
    }

    const test = existingResultWithTest[0].test

    const context = await getOrganizationContext()

    if (!context.isAuthenticated) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Authorization: Only system admins, org admins, org owners, and org coaches can update results
    // Additionally, org members (admin/owner/coach) must have an active organization
    if (
      (!context.isSystemAdmin &&
        !context.isAdmin &&
        !context.isOwner &&
        !context.isCoach) ||
      (!context.isSystemAdmin && !context.organization?.id)
    ) {
      return Response.json(
        {
          message:
            'Only system admins, club admins, club owners, and club coaches can update test results',
        },
        { status: 403 }
      )
    }

    // Organization ownership check: org members can only update results for tests from their own organization
    if (!context.isSystemAdmin && test) {
      if (!context.organization?.id || test.organizationId !== context.organization.id) {
        return Response.json(
          {
            message:
              'You can only update test results for tests from your own organization',
          },
          { status: 403 }
        )
      }
    }

    const result = await db
      .update(schema.testResults)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.testResults.id, id))
      .returning()

    const totalScore = resultsService.calculateTotalScore(result[0])

    const updatedResult = {
      ...result[0],
      totalScore,
      averageScore: resultsService.calculateAverageScore(result[0]),
      highestScore: resultsService.getHighestScore(result[0]),
      lowestScore: resultsService.getLowestScore(result[0]),
      performanceCategory: resultsService.getPerformanceCategory(totalScore),
      scoreDistribution: resultsService.getScoreDistribution(result[0]),
      analysis: resultsService.analyzePerformance(result[0]),
    }

    return Response.json(updatedResult)
  } catch (error) {
    console.error('Error updating result:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const parseResult = resultsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }

  try {
    const { id } = resolvedParams

    // Get result with test information for authorization check
    const existingResultWithTest = await db
      .select({
        result: schema.testResults,
        test: schema.tests,
      })
      .from(schema.testResults)
      .leftJoin(schema.tests, eq(schema.testResults.testId, schema.tests.id))
      .where(eq(schema.testResults.id, id))
      .limit(1)

    if (existingResultWithTest.length === 0) {
      return Response.json({ message: 'Result not found' }, { status: 404 })
    }

    const test = existingResultWithTest[0].test

    const context = await getOrganizationContext()

    if (!context.isAuthenticated) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Authorization: Only system admins, org admins, org owners, and org coaches can delete results
    // Additionally, org members (admin/owner/coach) must have an active organization
    if (
      (!context.isSystemAdmin &&
        !context.isAdmin &&
        !context.isOwner &&
        !context.isCoach) ||
      (!context.isSystemAdmin && !context.organization?.id)
    ) {
      return Response.json(
        {
          message:
            'Only system admins, club admins, club owners, and club coaches can delete test results',
        },
        { status: 403 }
      )
    }

    // Organization ownership check: org members can only delete results for tests from their own organization
    if (!context.isSystemAdmin && test) {
      if (!context.organization?.id || test.organizationId !== context.organization.id) {
        return Response.json(
          {
            message:
              'You can only delete test results for tests from your own organization',
          },
          { status: 403 }
        )
      }
    }

    await db.delete(schema.testResults).where(eq(schema.testResults.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting result:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
