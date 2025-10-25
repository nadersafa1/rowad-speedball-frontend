import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import {
  resultsParamsSchema,
  resultsUpdateSchema,
} from "@/types/api/results.schemas";
import { resultsService } from "@/lib/services/results.service";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const parseResult = resultsParamsSchema.safeParse(resolvedParams);

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 });
  }

  try {
    const { id } = resolvedParams;

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
      .limit(1);

    if (result.length === 0) {
      return Response.json({ message: "Result not found" }, { status: 404 });
    }

    const row = result[0];
    const totalScore = resultsService.calculateTotalScore(row.result);

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
    };

    return Response.json(resultWithCalculatedFields);
  } catch (error) {
    console.error("Error fetching result:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const resolvedParams = await params;
  const paramsResult = resultsParamsSchema.safeParse(resolvedParams);

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 });
  }

  try {
    const body = await request.json();
    const bodyResult = resultsUpdateSchema.safeParse(body);

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 });
    }

    const { id } = resolvedParams;
    const updateData = bodyResult.data;

    const existingResult = await db
      .select()
      .from(schema.testResults)
      .where(eq(schema.testResults.id, id))
      .limit(1);

    if (existingResult.length === 0) {
      return Response.json({ message: "Result not found" }, { status: 404 });
    }

    const result = await db
      .update(schema.testResults)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.testResults.id, id))
      .returning();

    const totalScore = resultsService.calculateTotalScore(result[0]);

    const updatedResult = {
      ...result[0],
      totalScore,
      averageScore: resultsService.calculateAverageScore(result[0]),
      highestScore: resultsService.getHighestScore(result[0]),
      lowestScore: resultsService.getLowestScore(result[0]),
      performanceCategory: resultsService.getPerformanceCategory(totalScore),
      scoreDistribution: resultsService.getScoreDistribution(result[0]),
      analysis: resultsService.analyzePerformance(result[0]),
    };

    return Response.json(updatedResult);
  } catch (error) {
    console.error("Error updating result:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const resolvedParams = await params;
  const parseResult = resultsParamsSchema.safeParse(resolvedParams);

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 });
  }

  try {
    const { id } = resolvedParams;

    const existingResult = await db
      .select()
      .from(schema.testResults)
      .where(eq(schema.testResults.id, id))
      .limit(1);

    if (existingResult.length === 0) {
      return Response.json({ message: "Result not found" }, { status: 404 });
    }

    await db.delete(schema.testResults).where(eq(schema.testResults.id, id));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting result:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

