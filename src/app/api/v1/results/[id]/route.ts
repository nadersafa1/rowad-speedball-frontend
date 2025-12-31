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
import {
  checkResultReadAuthorization,
  checkResultUpdateAuthorization,
  checkResultDeleteAuthorization,
} from '@/lib/authorization'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const parseResult = resultsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }
  const context = await getOrganizationContext()

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

    // Authorization check
    const authError = checkResultReadAuthorization(context, test)
    if (authError) return authError

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
    return handleApiError(error, {
      endpoint: '/api/v1/results/[id]',
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
  const paramsResult = resultsParamsSchema.safeParse(resolvedParams)

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 })
  }

  const context = await getOrganizationContext()

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

    const resultData = existingResultWithTest[0].result
    const test = existingResultWithTest[0].test

    if (!test) {
      return Response.json({ message: 'Test not found' }, { status: 404 })
    }

    // Authorization check
    const authError = checkResultUpdateAuthorization(context, resultData, test)
    if (authError) return authError

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
    return handleApiError(error, {
      endpoint: '/api/v1/results/[id]',
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
  const parseResult = resultsParamsSchema.safeParse(resolvedParams)

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 })
  }
  const context = await getOrganizationContext()

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

    const resultData = existingResultWithTest[0].result
    const test = existingResultWithTest[0].test

    if (!test) {
      return Response.json({ message: 'Test not found' }, { status: 404 })
    }

    // Authorization check
    const authError = checkResultDeleteAuthorization(context, resultData, test)
    if (authError) return authError

    await db.delete(schema.testResults).where(eq(schema.testResults.id, id))

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/results/[id]',
      method: 'DELETE',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
