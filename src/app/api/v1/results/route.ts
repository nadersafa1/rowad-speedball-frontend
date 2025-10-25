import { NextRequest } from "next/server";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import z from "zod";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import {
  resultsCreateSchema,
  resultsQuerySchema,
} from "@/types/api/results.schemas";
import { createPaginatedResponse } from "@/types/api/pagination";
import { resultsService } from "@/lib/services/results.service";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const parseResult = resultsQuerySchema.safeParse(queryParams);

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 });
  }

  try {
    const {
      playerId,
      testId,
      minScore,
      maxScore,
      dateFrom,
      dateTo,
      page,
      limit,
    } = parseResult.data;

    const offset = (page - 1) * limit;
    const conditions: any[] = [];

    if (playerId) {
      conditions.push(eq(schema.testResults.playerId, playerId));
    }

    if (testId) {
      conditions.push(eq(schema.testResults.testId, testId));
    }

    if (dateFrom) {
      conditions.push(gte(schema.testResults.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(schema.testResults.createdAt, new Date(dateTo)));
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined;

    let countQuery = db.select({ count: count() }).from(schema.testResults);
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any;
    }

    let dataQuery = db
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
      .leftJoin(schema.tests, eq(schema.testResults.testId, schema.tests.id));

    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any;
    }

    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery
        .orderBy(desc(schema.testResults.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const totalItems = countResult[0].count;

    let resultsWithCalculatedFields = dataResult.map((row) => {
      const totalScore = resultsService.calculateTotalScore(row.result);
      return {
        ...row.result,
        totalScore,
        averageScore: resultsService.calculateAverageScore(row.result),
        highestScore: resultsService.getHighestScore(row.result),
        lowestScore: resultsService.getLowestScore(row.result),
        performanceCategory:
          resultsService.getPerformanceCategory(totalScore),
        scoreDistribution: resultsService.getScoreDistribution(row.result),
        analysis: resultsService.analyzePerformance(row.result),
        player: row.player,
        test: row.test,
      };
    });

    if (minScore !== undefined || maxScore !== undefined) {
      resultsWithCalculatedFields = resultsWithCalculatedFields.filter(
        (result) =>
          resultsService.isResultInScoreRange(
            result.totalScore,
            minScore,
            maxScore
          )
      );
    }

    const paginatedResponse = createPaginatedResponse(
      resultsWithCalculatedFields,
      page,
      limit,
      totalItems
    );

    return Response.json(paginatedResponse);
  } catch (error) {
    console.error("Error fetching results:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const parseResult = resultsCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 });
    }

    const {
      playerId,
      testId,
      leftHandScore,
      rightHandScore,
      forehandScore,
      backhandScore,
    } = parseResult.data;

    const [playerExists, testExists] = await Promise.all([
      db
        .select()
        .from(schema.players)
        .where(eq(schema.players.id, playerId))
        .limit(1),
      db
        .select()
        .from(schema.tests)
        .where(eq(schema.tests.id, testId))
        .limit(1),
    ]);

    if (playerExists.length === 0) {
      return Response.json({ message: "Player not found" }, { status: 404 });
    }

    if (testExists.length === 0) {
      return Response.json({ message: "Test not found" }, { status: 404 });
    }

    const result = await db
      .insert(schema.testResults)
      .values({
        playerId,
        testId,
        leftHandScore,
        rightHandScore,
        forehandScore,
        backhandScore,
      })
      .returning();

    const totalScore = resultsService.calculateTotalScore(result[0]);

    const newResult = {
      ...result[0],
      totalScore,
      averageScore: resultsService.calculateAverageScore(result[0]),
      highestScore: resultsService.getHighestScore(result[0]),
      lowestScore: resultsService.getLowestScore(result[0]),
      performanceCategory: resultsService.getPerformanceCategory(totalScore),
      scoreDistribution: resultsService.getScoreDistribution(result[0]),
      analysis: resultsService.analyzePerformance(result[0]),
    };

    return Response.json(newResult, { status: 201 });
  } catch (error) {
    console.error("Error creating result:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

