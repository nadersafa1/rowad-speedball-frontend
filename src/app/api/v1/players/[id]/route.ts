import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { calculateAge, getAgeGroup, calculateTotalScore } from "@/db/schema";
import {
  playersParamsSchema,
  playersUpdateSchema,
} from "@/types/api/players.schemas";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const parseResult = playersParamsSchema.safeParse(resolvedParams);

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 });
  }

  try {
    const { id } = resolvedParams;

    const player = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, id))
      .limit(1);

    if (player.length === 0) {
      return Response.json({ message: "Player not found" }, { status: 404 });
    }

    const playerResults = await db
      .select({
        result: schema.testResults,
        test: schema.tests,
      })
      .from(schema.testResults)
      .leftJoin(schema.tests, eq(schema.testResults.testId, schema.tests.id))
      .where(eq(schema.testResults.playerId, id))
      .orderBy(desc(schema.testResults.createdAt));

    const resultsWithTotal = playerResults.map((row) => ({
      ...row.result,
      totalScore: calculateTotalScore(row.result),
      test: row.test,
    }));

    const playerWithAge = {
      ...player[0],
      age: calculateAge(player[0].dateOfBirth),
      ageGroup: getAgeGroup(player[0].dateOfBirth),
      testResults: resultsWithTotal,
    };

    return Response.json(playerWithAge);
  } catch (error) {
    console.error("Error fetching player:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
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
  const paramsResult = playersParamsSchema.safeParse(resolvedParams);

  if (!paramsResult.success) {
    return Response.json(z.treeifyError(paramsResult.error), { status: 400 });
  }

  try {
    const body = await request.json();
    const bodyResult = playersUpdateSchema.safeParse(body);

    if (!bodyResult.success) {
      return Response.json(z.treeifyError(bodyResult.error), { status: 400 });
    }

    const { id } = resolvedParams;
    const updateData = bodyResult.data;

    const existingPlayer = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, id))
      .limit(1);

    if (existingPlayer.length === 0) {
      return Response.json({ message: "Player not found" }, { status: 404 });
    }

    const result = await db
      .update(schema.players)
      .set(updateData)
      .where(eq(schema.players.id, id))
      .returning();

    const updatedPlayer = {
      ...result[0],
      age: calculateAge(result[0].dateOfBirth),
      ageGroup: getAgeGroup(result[0].dateOfBirth),
    };

    return Response.json(updatedPlayer);
  } catch (error) {
    console.error("Error updating player:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
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
  const parseResult = playersParamsSchema.safeParse(resolvedParams);

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 });
  }

  try {
    const { id } = resolvedParams;

    const existingPlayer = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, id))
      .limit(1);

    if (existingPlayer.length === 0) {
      return Response.json({ message: "Player not found" }, { status: 404 });
    }

    await db.delete(schema.players).where(eq(schema.players.id, id));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting player:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
