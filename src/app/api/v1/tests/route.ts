import { NextRequest } from "next/server";
import { and, count, desc, eq, ilike, gte, lte } from "drizzle-orm";
import z from "zod";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { testsCreateSchema, testsQuerySchema } from "@/types/api/tests.schemas";
import { createPaginatedResponse } from "@/types/api/pagination";
import { testsService } from "@/lib/services/tests.service";
import { requireAdmin } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const parseResult = testsQuerySchema.safeParse(queryParams);

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 });
  }

  try {
    const { q, playingTime, recoveryTime, dateFrom, dateTo, page, limit } =
      parseResult.data;

    const offset = (page - 1) * limit;
    const conditions: any[] = [];

    if (q) {
      conditions.push(ilike(schema.tests.name, `%${q}%`));
    }

    if (playingTime !== undefined) {
      conditions.push(eq(schema.tests.playingTime, playingTime));
    }

    if (recoveryTime !== undefined) {
      conditions.push(eq(schema.tests.recoveryTime, recoveryTime));
    }

    if (dateFrom) {
      conditions.push(gte(schema.tests.dateConducted, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(schema.tests.dateConducted, dateTo));
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined;

    let countQuery = db.select({ count: count() }).from(schema.tests);
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any;
    }

    let dataQuery = db.select().from(schema.tests);
    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any;
    }

    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery
        .orderBy(desc(schema.tests.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const totalItems = countResult[0].count;

    const testsWithCalculatedFields = dataResult.map((test) => ({
      ...test,
      totalTime: testsService.calculateTotalTime(test),
      formattedTotalTime: testsService.formatTotalTime(test),
      status: testsService.getTestStatus(test.dateConducted),
    }));

    const paginatedResponse = createPaginatedResponse(
      testsWithCalculatedFields,
      page,
      limit,
      totalItems
    );

    return Response.json(paginatedResponse);
  } catch (error) {
    console.error("Error fetching tests:", error);
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
    const parseResult = testsCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 });
    }

    const { name, playingTime, recoveryTime, dateConducted, description } =
      parseResult.data;

    const result = await db
      .insert(schema.tests)
      .values({
        name,
        playingTime,
        recoveryTime,
        dateConducted,
        description,
      })
      .returning();

    const newTest = {
      ...result[0],
      totalTime: testsService.calculateTotalTime(result[0]),
      formattedTotalTime: testsService.formatTotalTime(result[0]),
      status: testsService.getTestStatus(result[0].dateConducted),
    };

    return Response.json(newTest, { status: 201 });
  } catch (error) {
    console.error("Error creating test:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
