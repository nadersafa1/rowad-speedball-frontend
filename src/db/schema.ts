import {
  pgTable,
  varchar,
  date,
  timestamp,
  uuid,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// Auth Tables
export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Players Table
export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  preferredHand: text("preferred_hand", {
    enum: ["left", "right", "both"],
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

export const getAgeGroup = (dateOfBirth: string): string => {
  const age = calculateAge(dateOfBirth);

  if (age <= 7) return "mini";
  if (age <= 9) return "U-09";
  if (age <= 11) return "U-11";
  if (age <= 13) return "U-13";
  if (age <= 15) return "U-15";
  if (age <= 17) return "U-17";
  if (age <= 19) return "U-19";
  if (age <= 21) return "U-21";
  return "Seniors";
};

// Tests Table
export const tests = pgTable("tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  playingTime: integer("playing_time").notNull(),
  recoveryTime: integer("recovery_time").notNull(),
  dateConducted: date("date_conducted").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Test Results Table
export const testResults = pgTable("test_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id")
    .references(() => players.id, { onDelete: "cascade" })
    .notNull(),
  testId: uuid("test_id")
    .references(() => tests.id, { onDelete: "cascade" })
    .notNull(),
  leftHandScore: integer("left_hand_score").notNull(),
  rightHandScore: integer("right_hand_score").notNull(),
  forehandScore: integer("forehand_score").notNull(),
  backhandScore: integer("backhand_score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calculateTotalScore = (
  result: Pick<
    typeof testResults.$inferSelect,
    "leftHandScore" | "rightHandScore" | "forehandScore" | "backhandScore"
  >
): number => {
  return (
    result.leftHandScore +
    result.rightHandScore +
    result.forehandScore +
    result.backhandScore
  );
};

// Type exports
export type Player = typeof players.$inferSelect;
export type Test = typeof tests.$inferSelect;
export type TestResult = typeof testResults.$inferSelect;
