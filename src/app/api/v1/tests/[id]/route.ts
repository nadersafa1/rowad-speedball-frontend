import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import {
  testsParamsSchema,
  testsUpdateSchema,
} from "@/types/api/tests.schemas";
import { testsService } from "@/lib/services/tests.service";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const parseResult = testsParamsSchema.safeParse(resolvedParams);

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 });
  }

  try {
    const { id } = resolvedParams;

    const test = await db
      .select()
      .from(schema.tests)
      .where(eq(schema.tests.id, id))
      .limit(1);

    if (test.length === 0) {
      return Response.json({ message: "Test not found" }, { status: 404 });
    }

    const testResults = await db
      .select({
        result: schema.testResults,
        player: schema.players,
      })
      .from(schema.testResults)
      .leftJoin(
        schema.players,
        eq(schema.testResults.playerId, schema.players.id)
      )
      .where(eq(schema.testResults.testId, id))
      .orderBy(desc(schema.testResults.createdAt));

    const resultsWithTotal = testResults.map((row) => ({
      ...row.result,
      totalScore: testsService.calculateTotalScore(row.result),
      player: row.player,
    }));

    const testWithCalculatedFields = {
      ...test[0],
      totalTime: testsService.calculateTotalTime(test[0]),
      formattedTotalTime: testsService.formatTotalTime(test[0]),
      status: testsService.getTestStatus(test[0].dateConducted),
      testResults: resultsWithTotal,
    };

    return Response.json(testWithCalculatedFields);
  } catch (error) {
    console.error("Error fetching test:", error);
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
  const paramsResult = testsParamsSchema.safeParse(resolvedParams);

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 });
  }

  try {
    const body = await request.json();
    const bodyResult = testsUpdateSchema.safeParse(body);

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 });
    }

    const { id } = resolvedParams;
    const updateData = bodyResult.data;

    const existingTest = await db
      .select()
      .from(schema.tests)
      .where(eq(schema.tests.id, id))
      .limit(1);

    if (existingTest.length === 0) {
      return Response.json({ message: "Test not found" }, { status: 404 });
    }

    const result = await db
      .update(schema.tests)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.tests.id, id))
      .returning();

    const updatedTest = {
      ...result[0],
      totalTime: testsService.calculateTotalTime(result[0]),
      formattedTotalTime: testsService.formatTotalTime(result[0]),
      status: testsService.getTestStatus(result[0].dateConducted),
    };

    return Response.json(updatedTest);
  } catch (error) {
    console.error("Error updating test:", error);
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
  const parseResult = testsParamsSchema.safeParse(resolvedParams);

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 });
  }

  try {
    const { id } = resolvedParams;

    const existingTest = await db
      .select()
      .from(schema.tests)
      .where(eq(schema.tests.id, id))
      .limit(1);

    if (existingTest.length === 0) {
      return Response.json({ message: "Test not found" }, { status: 404 });
    }

    await db.delete(schema.tests).where(eq(schema.tests.id, id));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting test:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

