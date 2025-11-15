import { NextRequest } from "next/server";
import { and, asc, count, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
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
    const {
      q,
      gender,
      ageGroup,
      preferredHand,
      team,
      sortBy,
      sortOrder,
      page,
      limit,
    } = parseResult.data;

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

    if (team && team !== "all") {
      const isFirstTeam = team === "first_team";
      conditions.push(eq(schema.players.isFirstTeam, isFirstTeam));
    }

    // AgeGroup filtering at database level
    // Age groups use year-based calculations with first/second half-year distinction:
    // - First 6 months (Jan-Jun): age = currentYear - birthYear - 1
    // - Second 6 months (Jul-Dec): age = currentYear - birthYear
    if (ageGroup && ageGroup !== "all") {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
      const isFirstHalf = currentMonth <= 6; // January (1) to June (6)

      // Adjust effective year based on half-year
      // If first half, everyone is effectively one year "younger" for age group purposes
      const effectiveYear = isFirstHalf ? currentYear - 1 : currentYear;

      let minBirthYear: number | null = null;
      let maxBirthYear: number | null = null;

      switch (ageGroup) {
        case "mini":
          // age <= 7, so birthYear >= (effectiveYear - 7)
          minBirthYear = effectiveYear - 7;
          break;
        case "U-09":
          // age > 7 and <= 9, so birthYear >= (effectiveYear - 9) AND birthYear < (effectiveYear - 7)
          minBirthYear = effectiveYear - 9;
          maxBirthYear = effectiveYear - 7;
          break;
        case "U-11":
          // age > 9 and <= 11, so birthYear >= (effectiveYear - 11) AND birthYear < (effectiveYear - 9)
          minBirthYear = effectiveYear - 11;
          maxBirthYear = effectiveYear - 9;
          break;
        case "U-13":
          // age > 11 and <= 13, so birthYear >= (effectiveYear - 13) AND birthYear < (effectiveYear - 11)
          minBirthYear = effectiveYear - 13;
          maxBirthYear = effectiveYear - 11;
          break;
        case "U-15":
          // age > 13 and <= 15, so birthYear >= (effectiveYear - 15) AND birthYear < (effectiveYear - 13)
          minBirthYear = effectiveYear - 15;
          maxBirthYear = effectiveYear - 13;
          break;
        case "U-17":
          // age > 15 and <= 17, so birthYear >= (effectiveYear - 17) AND birthYear < (effectiveYear - 15)
          minBirthYear = effectiveYear - 17;
          maxBirthYear = effectiveYear - 15;
          break;
        case "U-19":
          // age > 17 and <= 19, so birthYear >= (effectiveYear - 19) AND birthYear < (effectiveYear - 17)
          minBirthYear = effectiveYear - 19;
          maxBirthYear = effectiveYear - 17;
          break;
        case "U-21":
          // age > 19 and <= 21, so birthYear >= (effectiveYear - 21) AND birthYear < (effectiveYear - 19)
          minBirthYear = effectiveYear - 21;
          maxBirthYear = effectiveYear - 19;
          break;
        case "Seniors":
          // age > 21, so birthYear < (effectiveYear - 21)
          maxBirthYear = effectiveYear - 21;
          break;
      }

      // Use SQL to extract year from dateOfBirth and compare
      if (minBirthYear !== null) {
        conditions.push(
          sql`EXTRACT(YEAR FROM ${schema.players.dateOfBirth}) >= ${minBirthYear}`
        );
      }
      if (maxBirthYear !== null) {
        // For Seniors: exclusive (birthYear < maxBirthYear)
        // For U-XX groups: exclusive (birthYear < maxBirthYear)
        conditions.push(
          sql`EXTRACT(YEAR FROM ${schema.players.dateOfBirth}) < ${maxBirthYear}`
        );
      }
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

    // Dynamic sorting
    if (sortBy) {
      const sortField = schema.players[sortBy];
      const order = sortOrder === "asc" ? asc(sortField) : desc(sortField);
      dataQuery = dataQuery.orderBy(order) as any;
    } else {
      dataQuery = dataQuery.orderBy(desc(schema.players.createdAt)) as any;
    }

    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery.limit(limit).offset(offset),
    ]);

    const totalItems = countResult[0].count;

    const playersWithAge = dataResult.map((player) => ({
      ...player,
      age: calculateAge(player.dateOfBirth),
      ageGroup: getAgeGroup(player.dateOfBirth),
    }));

    const paginatedResponse = createPaginatedResponse(
      playersWithAge,
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

    const { name, dateOfBirth, gender, preferredHand, isFirstTeam } = parseResult.data;

    const result = await db
      .insert(schema.players)
      .values({
        name,
        dateOfBirth,
        gender,
        preferredHand,
        isFirstTeam,
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
