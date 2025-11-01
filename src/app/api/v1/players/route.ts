import { NextRequest } from "next/server";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import z from "zod";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { calculateAge, getAgeGroup } from "@/db/schema";
import {
  playersCreateSchema,
  playersQuerySchema,
} from "@/types/api/players.schemas";
import { createPaginatedResponse } from "@/types/api/pagination";
import { requireAdmin } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const parseResult = playersQuerySchema.safeParse(queryParams);

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 });
  }

  try {
    const { q, gender, ageGroup, preferredHand, page, limit } =
      parseResult.data;

    const offset = (page - 1) * limit;
    const conditions: any[] = [];

    if (q) {
      conditions.push(ilike(schema.players.name, `%${q}%`));
    }

    if (gender && gender !== "all") {
      conditions.push(eq(schema.players.gender, gender));
    }

    if (preferredHand) {
      conditions.push(eq(schema.players.preferredHand, preferredHand));
    }

    const combinedCondition =
      conditions.length > 0
        ? conditions.reduce((acc, condition) =>
            acc ? and(acc, condition) : condition
          )
        : undefined;

    let countQuery = db.select({ count: count() }).from(schema.players);
    if (combinedCondition) {
      countQuery = countQuery.where(combinedCondition) as any;
    }

    let dataQuery = db.select().from(schema.players);
    if (combinedCondition) {
      dataQuery = dataQuery.where(combinedCondition) as any;
    }

    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery
        .orderBy(desc(schema.players.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const totalItems = countResult[0].count;

    const playersWithAge = dataResult.map((player) => ({
      ...player,
      age: calculateAge(player.dateOfBirth),
      ageGroup: getAgeGroup(player.dateOfBirth),
    }));

    let filteredPlayers = playersWithAge;
    if (ageGroup && ageGroup !== "all") {
      filteredPlayers = playersWithAge.filter(
        (player) => player.ageGroup === ageGroup
      );
    }

    const paginatedResponse = createPaginatedResponse(
      filteredPlayers,
      page,
      limit,
      totalItems
    );

    return Response.json(paginatedResponse);
  } catch (error) {
    console.error("Error fetching players:", error);
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
    const parseResult = playersCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(z.treeifyError(parseResult.error), { status: 400 });
    }

    const { name, dateOfBirth, gender, preferredHand } = parseResult.data;

    const result = await db
      .insert(schema.players)
      .values({
        name,
        dateOfBirth,
        gender,
        preferredHand,
      })
      .returning();

    const newPlayer = {
      ...result[0],
      age: calculateAge(result[0].dateOfBirth),
      ageGroup: getAgeGroup(result[0].dateOfBirth),
    };

    return Response.json(newPlayer, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
