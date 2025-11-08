import { NextRequest } from "next/server";
import { and, asc, count, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import z from "zod";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import {
  resultsCreateSchema,
  resultsQuerySchema,
} from "@/types/api/results.schemas";
import { createPaginatedResponse } from "@/types/api/pagination";
import { resultsService } from "@/lib/services/results.service";
import { requireAdmin } from "@/lib/auth-middleware";
import { calculateAge, getAgeGroup } from "@/db/schema";

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
      q,
      gender,
      ageGroup,
      yearOfBirth,
      minScore,
      maxScore,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
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

    // Build base query with joins
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

    // Add player-related filters (need to be applied after join)
    if (q) {
      conditions.push(ilike(schema.players.name, `%${q}%`));
    }

    if (gender && gender !== "all") {
      conditions.push(eq(schema.players.gender, gender));
    }

    if (yearOfBirth) {
      conditions.push(
        sql`EXTRACT(YEAR FROM ${schema.players.dateOfBirth}) = ${yearOfBirth}`
      );
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined;

    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any;
    }

    // Count query - need to use same joins and conditions
    let countQuery = db
      .select({ count: count() })
      .from(schema.testResults)
      .leftJoin(
        schema.players,
        eq(schema.testResults.playerId, schema.players.id)
      );

    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any;
    }

    // Apply sorting
    if (sortBy) {
      let orderField: any;
      const order = sortOrder === "asc" ? asc : desc;

      switch (sortBy) {
        case "totalScore":
          // Calculate total score for sorting - we'll sort after calculating
          // For now, sort by sum of scores in SQL
          dataQuery = dataQuery.orderBy(
            order(
              sql`${schema.testResults.leftHandScore} + ${schema.testResults.rightHandScore} + ${schema.testResults.forehandScore} + ${schema.testResults.backhandScore}`
            )
          ) as any;
          break;
        case "leftHandScore":
          orderField = schema.testResults.leftHandScore;
          dataQuery = dataQuery.orderBy(order(orderField)) as any;
          break;
        case "rightHandScore":
          orderField = schema.testResults.rightHandScore;
          dataQuery = dataQuery.orderBy(order(orderField)) as any;
          break;
        case "forehandScore":
          orderField = schema.testResults.forehandScore;
          dataQuery = dataQuery.orderBy(order(orderField)) as any;
          break;
        case "backhandScore":
          orderField = schema.testResults.backhandScore;
          dataQuery = dataQuery.orderBy(order(orderField)) as any;
          break;
        case "playerName":
          orderField = schema.players.name;
          dataQuery = dataQuery.orderBy(order(orderField)) as any;
          break;
        case "ageGroup":
          // Sort by dateOfBirth (younger = higher age group)
          orderField = schema.players.dateOfBirth;
          dataQuery = dataQuery.orderBy(order(orderField)) as any;
          break;
        case "age":
          orderField = schema.players.dateOfBirth;
          // For age, desc means older first (earlier birth date)
          const ageOrder = sortOrder === "asc" ? desc : asc;
          dataQuery = dataQuery.orderBy(ageOrder(orderField)) as any;
          break;
        case "createdAt":
          orderField = schema.testResults.createdAt;
          dataQuery = dataQuery.orderBy(order(orderField)) as any;
          break;
        default:
          dataQuery = dataQuery.orderBy(desc(schema.testResults.createdAt)) as any;
      }
    } else {
      // Default: sort by total score descending
      dataQuery = dataQuery.orderBy(
        desc(
          sql`${schema.testResults.leftHandScore} + ${schema.testResults.rightHandScore} + ${schema.testResults.forehandScore} + ${schema.testResults.backhandScore}`
        )
      ) as any;
    }

    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
    ]);

    const totalItems = countResult[0].count;

    let resultsWithCalculatedFields = dataResult.map((row) => {
      const totalScore = resultsService.calculateTotalScore(row.result);
      const playerAge = row.player ? calculateAge(row.player.dateOfBirth) : undefined;
      const playerAgeGroup = row.player ? getAgeGroup(row.player.dateOfBirth) : undefined;
      
      return {
        ...row.result,
        totalScore,
        averageScore: resultsService.calculateAverageScore(row.result),
        highestScore: resultsService.getHighestScore(row.result),
        lowestScore: resultsService.getLowestScore(row.result),
        performanceCategory: resultsService.getPerformanceCategory(totalScore),
        scoreDistribution: resultsService.getScoreDistribution(row.result),
        analysis: resultsService.analyzePerformance(row.result),
        player: row.player
          ? {
              ...row.player,
              age: playerAge,
              ageGroup: playerAgeGroup,
            }
          : null,
        test: row.test,
      };
    });

    // Filter by ageGroup (after calculating age groups)
    if (ageGroup && ageGroup !== "all") {
      resultsWithCalculatedFields = resultsWithCalculatedFields.filter(
        (result) => result.player?.ageGroup === ageGroup
      );
    }

    // Filter by score range (after calculating total score)
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
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminResult = await requireAdmin(request);
  if (
    !adminResult.authenticated ||
    !("authorized" in adminResult) ||
    !adminResult.authorized
  ) {
    return adminResult.response;
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
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
