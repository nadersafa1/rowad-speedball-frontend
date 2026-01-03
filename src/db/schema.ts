import {
  pgTable,
  varchar,
  date,
  timestamp,
  uuid,
  text,
  integer,
  boolean,
  pgEnum,
  unique,
  jsonb,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type { PositionScores } from '@/types/position-scores'
import { parse, getYear, getMonth } from 'date-fns'

// Auth Tables
export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role'), // Supports: user, admin, federation-admin, federation-editor
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  federationId: uuid('federation_id').references(() => federations.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Organization Plugin Tables (managed by better-auth but defined here for TypeScript references)
export const organization = pgTable('organization', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  metadata: text('metadata'),
  federationId: uuid('federation_id').references(() => federations.id, {
    onDelete: 'set null',
  }),
})

export const member = pgTable('member', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').default('member').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const invitation = pgTable('invitation', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: uuid('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const session = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
  activeOrganizationId: uuid('active_organization_id').references(
    () => organization.id,
    { onDelete: 'set null' }
  ),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const account = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Players Table
export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    nameRtl: varchar('name_rtl', { length: 255 }),
    dateOfBirth: date('date_of_birth').notNull(),
    gender: text('gender', { enum: ['male', 'female'] }).notNull(),
    preferredHand: text('preferred_hand', {
      enum: ['left', 'right', 'both'],
    }).notNull(),
    teamLevel: text('team_level', {
      enum: ['team_a', 'team_b', 'team_c'],
    })
      .notNull()
      .default('team_c'),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'set null' })
      .unique(),
    organizationId: uuid('organization_id').references(() => organization.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_players_organization_id').on(table.organizationId),
    index('idx_players_gender').on(table.gender),
    index('idx_players_team_level').on(table.teamLevel),
    index('idx_players_org_gender_team').on(
      table.organizationId,
      table.gender,
      table.teamLevel
    ),
  ]
)

/**
 * Calculate a player's age using season-based logic
 *
 * **Season-Based Age Calculation**:
 * The sports season runs from July 1 to June 30 of the following year.
 * A player's age is determined by the year they turn that age during the current season.
 *
 * **Logic**:
 * - **July 1 - December 31** (months 7-12): New season starts
 *   → Age = currentYear - birthYear
 *   → Example: Born 2010, current date July 2024 → Age = 2024 - 2010 = 14
 *
 * - **January 1 - June 30** (months 1-6): Still in previous season
 *   → Age = currentYear - birthYear - 1
 *   → Example: Born 2010, current date March 2024 → Age = 2024 - 2010 - 1 = 13
 *
 * **Why This Matters**:
 * - Ensures fair competition by grouping players who turn the same age in the same season
 * - Prevents age advantage from birth month within a calendar year
 * - Aligns with how most youth sports leagues organize age groups
 *
 * **Examples**:
 * - Player born May 15, 2010:
 *   - On July 1, 2024: Age = 14 (new season, they will turn 14 this season)
 *   - On April 1, 2024: Age = 13 (previous season, they haven't turned 14 yet this season)
 *
 * - Player born October 20, 2010:
 *   - On July 1, 2024: Age = 14 (new season)
 *   - On November 1, 2024: Age = 14 (same season, already 14)
 *
 * @param dateOfBirth - Date of birth in 'yyyy-MM-dd' format
 * @returns Calculated age as integer
 */
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date()
  const currentYear = getYear(today)
  const currentMonth = getMonth(today) + 1 // getMonth is 0-indexed (0 = Jan)

  // Parse date safely as local (avoids UTC timezone issues)
  // Using 'yyyy-MM-dd' format ensures consistent parsing across timezones
  const birthDate = parse(dateOfBirth, 'yyyy-MM-dd', new Date())
  const birthYear = getYear(birthDate)

  // Season boundary check: July (month 7) starts the new season
  const isFirstHalf = currentMonth <= 6 // Jan-Jun (previous season)
  const isSecondHalf = !isFirstHalf // Jul-Dec (new season)

  // Calculate age based on season
  if (isSecondHalf) {
    // New season (Jul-Dec): Player's age is what they turn this year
    return currentYear - birthYear
  } else {
    // Previous season (Jan-Jun): Player's age is what they turned last year
    return currentYear - birthYear - 1
  }
}

/**
 * Determine a player's age group based on their calculated age
 *
 * **Age Group Categories**:
 * - **mini**: Ages 2-7 (introductory level)
 * - **U-09**: Ages 8-9 (Under 9)
 * - **U-11**: Ages 10-11 (Under 11)
 * - **U-13**: Ages 12-13 (Under 13)
 * - **U-15**: Ages 14-15 (Under 15)
 * - **U-17**: Ages 16-17 (Under 17)
 * - **U-19**: Ages 18-19 (Under 19)
 * - **U-21**: Ages 20-21 (Under 21)
 * - **Seniors**: Ages 22+ (adult level)
 *
 * **Important Notes**:
 * - Age groups use the season-based age from calculateAge()
 * - "U-XX" means "Under XX" (player will be XX or younger during the season)
 * - Age group boundaries are inclusive (U-09 includes both 8 and 9 year olds)
 *
 * **Examples**:
 * - Age 7 → "mini"
 * - Age 9 → "U-09"
 * - Age 13 → "U-13"
 * - Age 22 → "Seniors"
 *
 * @param dateOfBirth - Date of birth in 'yyyy-MM-dd' format
 * @returns Age group string (e.g., "U-13", "Seniors")
 */
export const getAgeGroup = (dateOfBirth: string): string => {
  const age = calculateAge(dateOfBirth)

  // Age group boundaries (inclusive upper bounds)
  if (age <= 7) return 'mini' // Ages 2-7
  if (age <= 9) return 'U-09' // Ages 8-9
  if (age <= 11) return 'U-11' // Ages 10-11
  if (age <= 13) return 'U-13' // Ages 12-13
  if (age <= 15) return 'U-15' // Ages 14-15
  if (age <= 17) return 'U-17' // Ages 16-17
  if (age <= 19) return 'U-19' // Ages 18-19
  if (age <= 21) return 'U-21' // Ages 20-21
  return 'Seniors' // Ages 22+
}

// Note Type Enum
export const noteTypeEnum = pgEnum('note_type', [
  'performance',
  'medical',
  'behavioral',
  'general',
])

// Player Notes Table
export const playerNotes = pgTable(
  'player_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    noteType: noteTypeEnum('note_type').notNull().default('general'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    updatedBy: uuid('updated_by').references(() => user.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_player_notes_player_id').on(table.playerId),
    index('idx_player_notes_note_type').on(table.noteType),
    index('idx_player_notes_organization_id').on(table.organizationId),
  ]
)

export type PlayerNote = typeof playerNotes.$inferSelect

// Tests Table
export const tests = pgTable(
  'tests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    playingTime: integer('playing_time').notNull(),
    recoveryTime: integer('recovery_time').notNull(),
    dateConducted: date('date_conducted').notNull(),
    description: text('description'),
    visibility: text('visibility', { enum: ['public', 'private'] })
      .notNull()
      .default('public'),
    organizationId: uuid('organization_id').references(() => organization.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_tests_organization_id').on(table.organizationId),
    index('idx_tests_visibility').on(table.visibility),
    index('idx_tests_date_conducted').on(table.dateConducted),
  ]
)

// Test Results Table
export const testResults = pgTable(
  'test_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .references(() => players.id, { onDelete: 'cascade' })
      .notNull(),
    testId: uuid('test_id')
      .references(() => tests.id, { onDelete: 'cascade' })
      .notNull(),
    leftHandScore: integer('left_hand_score').notNull(),
    rightHandScore: integer('right_hand_score').notNull(),
    forehandScore: integer('forehand_score').notNull(),
    backhandScore: integer('backhand_score').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // Unique constraint: one result per player per test
    unique('unique_player_test').on(table.playerId, table.testId),
    // Constraints: scores must be non-negative
    check('chk_left_hand_score_non_negative', sql`${table.leftHandScore} >= 0`),
    check(
      'chk_right_hand_score_non_negative',
      sql`${table.rightHandScore} >= 0`
    ),
    check('chk_forehand_score_non_negative', sql`${table.forehandScore} >= 0`),
    check('chk_backhand_score_non_negative', sql`${table.backhandScore} >= 0`),
    // Indexes for performance
    index('idx_test_results_player_id').on(table.playerId),
    index('idx_test_results_test_id').on(table.testId),
    index('idx_test_results_player_test').on(table.playerId, table.testId),
  ]
)

export const calculateTotalScore = (
  result: Pick<
    typeof testResults.$inferSelect,
    'leftHandScore' | 'rightHandScore' | 'forehandScore' | 'backhandScore'
  >
): number => {
  return (
    result.leftHandScore +
    result.rightHandScore +
    result.forehandScore +
    result.backhandScore
  )
}

// Events Table
// NOTE: eventType enum values must match EVENT_TYPES in src/types/event-types.ts
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    eventType: text('event_type', {
      enum: [
        'super-solo',
        'speed-solo',
        'juniors-solo',
        'singles',
        'solo-teams',
        'speed-solo-teams',
        'singles-teams',
        'doubles',
        'relay',
      ],
    }).notNull(),
    gender: text('gender', { enum: ['male', 'female', 'mixed'] }).notNull(),
    format: text('format', {
      enum: [
        'groups',
        'single-elimination',
        'groups-knockout',
        'double-elimination',
        'tests',
      ],
    })
      .notNull()
      .default('groups'),
    hasThirdPlaceMatch: boolean('has_third_place_match').default(false),
    visibility: text('visibility', { enum: ['public', 'private'] })
      .notNull()
      .default('public'),
    minPlayers: integer('min_players').notNull().default(1),
    maxPlayers: integer('max_players').notNull().default(2),
    registrationStartDate: date('registration_start_date'),
    registrationEndDate: date('registration_end_date'),
    eventDates: text('event_dates').array(), // Array of date strings
    bestOf: integer('best_of').notNull(), // Must be odd: 1, 3, 5, 7, etc.
    pointsPerWin: integer('points_per_win').notNull().default(3),
    pointsPerLoss: integer('points_per_loss').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    // For double-elimination: how many rounds before finals the losers bracket starts
    // null = full double elimination, 2 = starts at QF (for 16 players), 1 = starts at SF
    losersStartRoundsBeforeFinal: integer('losers_start_rounds_before_final'),
    // For test events: number of players per heat (default 8)
    playersPerHeat: integer('players_per_heat'),
    championshipEditionId: uuid('championship_edition_id').references(
      () => championshipEditions.id,
      {
        onDelete: 'cascade',
      }
    ),
    // Championship-specific metadata (only set when event is part of a championship)
    // format field already determines placement calculation:
    // - 'groups' → round_robin resolver
    // - 'single-elimination' → single_elim resolver
    // - 'double-elimination' → double_elim resolver
    // - 'groups-knockout' → mixed resolver (groups then knockout)
    pointsSchemaId: uuid('points_schema_id')
      .notNull()
      .references(() => pointsSchemas.id, {
        onDelete: 'restrict',
      }), // Points schema for championship events
    organizationId: uuid('organization_id').references(() => organization.id, {
      onDelete: 'cascade',
    }),
    trainingSessionId: uuid('training_session_id').references(
      () => trainingSessions.id,
      {
        onDelete: 'cascade',
      }
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // Constraint: max_players must be >= min_players
    check(
      'chk_max_gte_min_players',
      sql`${table.maxPlayers} >= ${table.minPlayers}`
    ),
    // Indexes for frequently queried columns
    index('idx_events_organization_id').on(table.organizationId),
    index('idx_events_event_type').on(table.eventType),
    index('idx_events_visibility').on(table.visibility),
    index('idx_events_completed').on(table.completed),
    index('idx_events_championship_edition_id').on(table.championshipEditionId),
    index('idx_events_points_schema_id').on(table.pointsSchemaId),
  ]
)

// Groups Table
export const groups = pgTable(
  'groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 10 }).notNull(), // Auto-generated: A, B, C...
    completed: boolean('completed').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('idx_groups_event_id').on(table.eventId)]
)

// Registrations Table
export const registrations = pgTable(
  'registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => groups.id, {
      onDelete: 'set null',
    }),
    seed: integer('seed'), // Seeding rank for SE events (1 = top seed)
    matchesWon: integer('matches_won').notNull().default(0),
    matchesLost: integer('matches_lost').notNull().default(0),
    setsWon: integer('sets_won').notNull().default(0),
    setsLost: integer('sets_lost').notNull().default(0),
    points: integer('points').notNull().default(0),
    qualified: boolean('qualified').notNull().default(false),
    teamName: varchar('team_name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_registrations_event_id').on(table.eventId),
    index('idx_registrations_group_id').on(table.groupId),
  ]
)

// Registration Players Junction Table (many-to-many)
export const registrationPlayers = pgTable(
  'registration_players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    registrationId: uuid('registration_id')
      .notNull()
      .references(() => registrations.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    // Position scores: { R?: number | null, L?: number | null, F?: number | null, B?: number | null }
    // Keys represent positions (R=Right, L=Left, F=Forehand, B=Backhand)
    // Values: null = position assigned but score pending, number = score entered
    // Nullable: null means no positions assigned yet
    positionScores: jsonb('position_scores').$type<PositionScores>(),
    // Order for play sequence and display (1, 2, 3...)
    order: integer('order').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('unique_registration_player').on(
      table.registrationId,
      table.playerId
    ),
    // GIN index for efficient JSONB queries on position_scores
    index('idx_registration_players_position_scores').using(
      'gin',
      table.positionScores
    ),
  ]
)

// Matches Table
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => groups.id, {
      onDelete: 'cascade',
    }),
    round: integer('round').notNull(),
    matchNumber: integer('match_number').notNull(),
    // Nullable for BYE matches in single elimination
    registration1Id: uuid('registration1_id').references(
      () => registrations.id,
      {
        onDelete: 'cascade',
      }
    ),
    registration2Id: uuid('registration2_id').references(
      () => registrations.id,
      {
        onDelete: 'cascade',
      }
    ),
    matchDate: date('match_date'),
    played: boolean('played').notNull().default(false),
    winnerId: uuid('winner_id').references(() => registrations.id, {
      onDelete: 'set null',
    }),
    // Bracket columns
    bracketPosition: integer('bracket_position'), // Unique position in bracket for rendering
    winnerTo: uuid('winner_to'), // Self-reference to next match (winner advances here)
    winnerToSlot: integer('winner_to_slot'), // Which slot (1 or 2) winner occupies in next match
    loserTo: uuid('loser_to'), // Self-reference for loser routing (double elimination)
    loserToSlot: integer('loser_to_slot'),
    bracketType: text('bracket_type', { enum: ['winners', 'losers'] }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // Constraints for data integrity
    // Round and matchNumber must be positive
    check('chk_round_positive', sql`${table.round} > 0`),
    check('chk_match_number_positive', sql`${table.matchNumber} > 0`),
    // Registrations should be different when both are present
    check(
      'chk_different_registrations',
      sql`${table.registration1Id} IS NULL OR ${table.registration2Id} IS NULL OR ${table.registration1Id} != ${table.registration2Id}`
    ),
    // Winner must be one of the registrations when match is played
    check(
      'chk_winner_valid',
      sql`${table.played} = false OR ${table.winnerId} IS NULL OR ${table.winnerId} = ${table.registration1Id} OR ${table.winnerId} = ${table.registration2Id}`
    ),
    // Indexes for performance
    index('idx_matches_event_id').on(table.eventId),
    index('idx_matches_group_id').on(table.groupId),
    index('idx_matches_played').on(table.played),
    index('idx_matches_winner_id').on(table.winnerId),
    index('idx_matches_registration1_id').on(table.registration1Id),
    index('idx_matches_registration2_id').on(table.registration2Id),
    index('idx_matches_event_round').on(table.eventId, table.round),
  ]
)

// Sets Table
export const sets = pgTable(
  'sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    registration1Score: integer('registration1_score').notNull(),
    registration2Score: integer('registration2_score').notNull(),
    played: boolean('played').notNull().default(false), // Sequential validation required
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // Unique constraint: one set number per match
    unique('unique_match_set_number').on(table.matchId, table.setNumber),
    // Constraints: scores must be non-negative, set number must be positive
    check('chk_set_number_positive', sql`${table.setNumber} > 0`),
    check('chk_reg1_score_non_negative', sql`${table.registration1Score} >= 0`),
    check('chk_reg2_score_non_negative', sql`${table.registration2Score} >= 0`),
    // Indexes for performance
    index('idx_sets_match_id').on(table.matchId),
    index('idx_sets_match_set_number').on(table.matchId, table.setNumber),
  ]
)

// Coaches Table
export const coaches = pgTable(
  'coaches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    nameRtl: varchar('name_rtl', { length: 255 }),
    gender: text('gender', { enum: ['male', 'female'] }).notNull(),
    userId: uuid('user_id')
      .references(() => user.id, { onDelete: 'set null' })
      .unique(),
    organizationId: uuid('organization_id').references(() => organization.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_coaches_organization_id').on(table.organizationId),
    index('idx_coaches_gender').on(table.gender),
  ]
)

// Training Sessions Table
export const trainingSessions = pgTable(
  'training_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    intensity: text('intensity', {
      enum: ['high', 'normal', 'low'],
    })
      .notNull()
      .default('normal'),
    type: text('type').array().notNull(),
    date: date('date').notNull(),
    description: text('description'),
    ageGroups: text('age_groups').array().notNull(),
    organizationId: uuid('organization_id').references(() => organization.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_training_sessions_organization_id').on(table.organizationId),
    index('idx_training_sessions_date').on(table.date),
    index('idx_training_sessions_org_date').on(
      table.organizationId,
      table.date
    ),
  ]
)

// Training Session Coaches Junction Table
export const trainingSessionCoaches = pgTable(
  'training_session_coaches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trainingSessionId: uuid('training_session_id')
      .notNull()
      .references(() => trainingSessions.id, { onDelete: 'cascade' }),
    coachId: uuid('coach_id')
      .notNull()
      .references(() => coaches.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('unique_session_coach').on(table.trainingSessionId, table.coachId),
  ]
)

// Attendance Status Enum
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'pending',
  'present',
  'late',
  'absent_excused',
  'absent_unexcused',
  'suspended',
])

// Training Session Attendance Table
export const trainingSessionAttendance = pgTable(
  'training_session_attendance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    trainingSessionId: uuid('training_session_id')
      .notNull()
      .references(() => trainingSessions.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('unique_player_session').on(table.playerId, table.trainingSessionId),
    index('idx_attendance_player_id').on(table.playerId),
    index('idx_attendance_session_id').on(table.trainingSessionId),
    index('idx_attendance_status').on(table.status),
    index('idx_attendance_player_status').on(table.playerId, table.status),
  ]
)

// Federations Table
export const federations = pgTable('federations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Federation Clubs Junction Table (many-to-many)
export const federationClubs = pgTable('federation_clubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  federationId: uuid('federation_id')
    .notNull()
    .references(() => federations.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Championships Table
export const championships = pgTable(
  'championships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    federationId: uuid('federation_id')
      .notNull()
      .references(() => federations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    competitionScope: text('competition_scope', { enum: ['clubs', 'open'] })
      .notNull()
      .default('clubs'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('idx_championships_federation_id').on(table.federationId)]
)

// Championship Editions Table
export const championshipEditions = pgTable(
  'championship_editions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    championshipId: uuid('championship_id')
      .notNull()
      .references(() => championships.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    status: text('status', { enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    registrationStartDate: date('registration_start_date'),
    registrationEndDate: date('registration_end_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_editions_championship_year').on(
      table.championshipId,
      table.year
    ),
    index('idx_editions_status').on(table.status),
  ]
)

/**
 * Placement Tiers Table
 *
 * **Purpose**: Standardized placement categories that work across all event types.
 * Placement tiers group participants by their achievement level, regardless of
 * the event format (elimination, time-based, round-robin, etc.).
 *
 * **Tier Categories by Event Type**:
 *
 * **Elimination Events** (single-elimination, double-elimination):
 * - **WINNER** (rank: 1) - Champion of the event
 * - **FINALIST** (rank: 2) - Runner-up, lost in the final
 * - **THIRD_PLACE** (rank: 3) - Winner of 3rd place match (only if hasThirdPlaceMatch = true)
 * - **FOURTH_PLACE** (rank: 4) - Loser of 3rd place match (only if hasThirdPlaceMatch = true)
 * - **SF** (rank: 3-4) - Semi-final losers (when no 3rd place match exists)
 * - **QF** (rank: 5-8) - Quarter-final losers (4 players share this tier)
 * - **R16** (rank: 9-16) - Round of 16 losers (8 players share this tier)
 * - **R32** (rank: 17-32) - Round of 32 losers (16 players share this tier)
 *
 * **Time-Based Events** (format='tests' - super-solo, speed-solo, etc.):
 * - **POS_1** (rank: 1) - 1st place finisher
 * - **POS_2** (rank: 2) - 2nd place finisher
 * - **POS_3** (rank: 3) - 3rd place finisher
 * - **POS_N** (rank: N) - Nth place finisher (position-specific tiers)
 * Each position gets its own tier, allowing different points per position.
 *
 * **Important Notes**:
 * - Tiers are event-agnostic: same tier names work for all event formats
 * - Multiple players can share the same tier (e.g., 4 QF losers all get QF tier)
 * - The `rank` field indicates the general ranking order (1 = best, higher = lower rank)
 * - Tiers are used to look up points from Points Schema Entries
 * - Actual final position is stored in `eventResults.finalPosition` (can have duplicates)
 *
 * **Examples**:
 * - Elimination event: Winner gets WINNER tier, Runner-up gets FINALIST tier
 * - Time-based event: 1st place gets POS_1 tier, 2nd place gets POS_2 tier
 * - QF losers: All 4 players get QF tier, but may have different finalPosition values
 *
 * @see eventResults - Where tiers are assigned to participants
 * @see pointsSchemaEntry - Maps tiers to points values
 */
export const placementTiers = pgTable('placement_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(), // WINNER, FINALIST, SF, QF, R16, etc.
  displayName: varchar('display_name', { length: 100 }), // "Winner", "Finalist", "Semi-Final", etc.
  description: text('description'),
  rank: integer('rank').notNull(), // 1: Champion, 2: Runner-up, 3: Third Place, 4: Fourth Place, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Points Schemas Table
 *
 * **Purpose**: Named point systems that define how points are awarded for different
 * placement tiers. A points schema is a collection of point rules that can be
 * reused across multiple events (e.g., "National Championship 2024 Points System").
 *
 * **How It Works**:
 * - A points schema is a container/grouping mechanism
 * - It contains multiple Points Schema Entries that map placement tiers to point values
 * - Events reference a points schema via `events.pointsSchemaId`
 * - Different schemas can award different points for the same tier
 *
 * **Use Cases**:
 * - **Championship Events**: Use a championship-specific schema with higher point values
 * - **Regular Events**: Use a standard schema with lower point values
 * - **Time-Based Events**: Use a schema with position-specific tiers (POS_1, POS_2, etc.)
 * - **Elimination Events**: Use a schema with match-based tiers (WINNER, FINALIST, QF, etc.)
 *
 * **Examples**:
 * - "National Championship 2024" - High-value points for championship events
 * - "Regional League 2024" - Standard points for regular competitions
 * - "Time-Based Standard" - Points for time-based events (POS_1 = 100, POS_2 = 80, etc.)
 *
 * **Important Notes**:
 * - Schemas are metadata only (name, description)
 * - Actual point values are defined in Points Schema Entries
 * - One schema can be used by multiple events
 * - Changing a schema affects all events using it (points are looked up dynamically)
 *
 * @see pointsSchemaEntry - Contains the actual tier-to-points mappings
 * @see events.pointsSchemaId - Links events to their point system
 */
export const pointsSchemas = pgTable('points_schemas', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Points Schema Entries Table
 *
 * **Purpose**: Maps placement tiers to point values within a specific points schema.
 * This is the junction table that connects Points Schemas to Placement Tiers and
 * defines how many points each tier awards.
 *
 * **How It Works**:
 * - Each entry links one placement tier to one points schema
 * - Defines the points awarded for that tier in that schema
 * - Multiple schemas can have different point values for the same tier
 * - When an event completes, points are looked up from the event's schema entries
 *
 * **Point Calculation Flow**:
 * 1. Event completes → Each participant gets assigned a `placementTierId`
 * 2. Look up event's `pointsSchemaId` from `events.pointsSchemaId`
 * 3. Find matching `pointsSchemaEntry` for (schemaId, tierId)
 * 4. Use the `points` value from that entry
 * 5. Store in `eventResults.pointsAwarded`
 *
 * **Examples**:
 *
 * **Elimination Event Schema**:
 * - WINNER → 100 points
 * - FINALIST → 75 points
 * - THIRD_PLACE → 50 points
 * - FOURTH_PLACE → 40 points
 * - SF → 30 points
 * - QF → 20 points
 *
 * **Time-Based Event Schema**:
 * - POS_1 → 100 points
 * - POS_2 → 80 points
 * - POS_3 → 60 points
 * - POS_4 → 50 points
 * - POS_5 → 40 points
 * - ... (position-specific points)
 *
 * **Important Notes**:
 * - Schema entries are "dumb and stable" - they don't care about event format
 * - Same tier can have different points in different schemas
 * - Points are looked up dynamically when events complete
 * - One tier can only appear once per schema (unique constraint)
 * - If a tier is missing from a schema, it defaults to 0 points
 *
 * **Why Separate from Placement Tiers**:
 * - Allows different point systems for the same tier
 * - Championship events can award more points than regular events
 * - Points can be updated without changing tier definitions
 * - Supports multiple concurrent point systems
 *
 * @see placementTiers - The tiers being mapped
 * @see pointsSchemas - The schema containing this entry
 * @see eventResults - Where calculated points are stored
 */
export const pointsSchemaEntry = pgTable(
  'points_schema_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pointsSchemaId: uuid('points_schema_id')
      .notNull()
      .references(() => pointsSchemas.id, { onDelete: 'cascade' }),
    placementTierId: uuid('placement_tier_id')
      .notNull()
      .references(() => placementTiers.id, { onDelete: 'cascade' }),
    points: integer('points').notNull().default(0), // Points awarded for this tier
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('unique_schema_tier').on(
      table.pointsSchemaId,
      table.placementTierId
    ),
    index('idx_points_schema_entries_schema_id').on(table.pointsSchemaId),
  ]
)

/**
 * Event Results Table
 *
 * **Purpose**: Stores the final ranking and points for each participant in an event.
 * This table represents the outcome of an event, not the match-by-match history.
 * Every participant gets exactly one result record when the event completes.
 *
 * **Ranking System Overview**:
 *
 * The ranking system uses two complementary fields:
 * - **`finalPosition`**: Exact numerical rank (1, 2, 3, 4, 5...)
 * - **`placementTierId`**: Grouping tier for points calculation (WINNER, FINALIST, QF, etc.)
 *
 * **Key Design Principles**:
 * 1. **`finalPosition` is NOT unique** - Multiple players can share the same position
 *    (e.g., 4 QF losers all at position 5)
 * 2. **`placementTierId` groups players** - All players in same tier get same points
 * 3. **Tiers vary by event type** - Elimination uses match-based tiers, time-based uses position tiers
 *
 * **Handling Different Event Types**:
 *
 * **Elimination Events** (single-elimination, double-elimination):
 * - Winner: `finalPosition = 1`, `placementTierId = WINNER`
 * - Runner-up: `finalPosition = 2`, `placementTierId = FINALIST`
 * - 3rd place match winner: `finalPosition = 3`, `placementTierId = THIRD_PLACE`
 * - 3rd place match loser: `finalPosition = 4`, `placementTierId = FOURTH_PLACE`
 * - QF losers (no 3rd place match): `finalPosition = 5`, `placementTierId = QF` (all 4 players)
 * - SF losers (no 3rd place match): `finalPosition = 3 or 4`, `placementTierId = SF`
 *
 * **Time-Based Events** (format='tests' - super-solo, speed-solo, etc.):
 * - 1st place: `finalPosition = 1`, `placementTierId = POS_1`
 * - 2nd place: `finalPosition = 2`, `placementTierId = POS_2`
 * - 3rd place: `finalPosition = 3`, `placementTierId = POS_3`
 * - Each position gets its own tier (position-specific points)
 * - Every participant has a unique finalPosition (no duplicates in time-based events)
 *
 * **Multiple Players at Same Position**:
 *
 * When multiple players share the same `finalPosition` (common in elimination events):
 * - All players get the same `placementTierId` (e.g., all QF losers get QF tier)
 * - All players get the same `pointsAwarded` (from the tier's points schema entry)
 * - Display order can be determined by other criteria (name, registration order, etc.)
 *
 * **Example: 4 QF Losers**:
 * ```
 * Player A: finalPosition = 5, placementTierId = QF, pointsAwarded = 20
 * Player B: finalPosition = 5, placementTierId = QF, pointsAwarded = 20
 * Player C: finalPosition = 5, placementTierId = QF, pointsAwarded = 20
 * Player D: finalPosition = 5, placementTierId = QF, pointsAwarded = 20
 * ```
 * All four players share position 5, tier QF, and receive the same points.
 *
 * **Points Calculation**:
 *
 * When an event completes:
 * 1. Each participant is assigned a `placementTierId` based on their result
 * 2. System looks up the event's `pointsSchemaId` from `events.pointsSchemaId`
 * 3. Finds the `pointsSchemaEntry` matching (schemaId, tierId)
 * 4. Sets `pointsAwarded` to the entry's `points` value
 * 5. Points are stored here (denormalized for performance and historical accuracy)
 *
 * **Important Notes**:
 * - One result per registration per event (unique constraint)
 * - `finalPosition` can be NULL (rare, but possible for incomplete events)
 * - `placementTierId` is required (everyone must have a tier)
 * - `pointsAwarded` is stored here (denormalized) for performance and historical accuracy
 * - Points are calculated once when event completes, then stored
 * - Changing points schema doesn't retroactively update stored points
 *
 * **Querying Rankings**:
 *
 * To get event rankings:
 * ```sql
 * SELECT * FROM event_results
 * WHERE event_id = ?
 * ORDER BY final_position ASC NULLS LAST
 * ```
 * Note: When multiple players share the same finalPosition, you can add additional
 * sorting criteria (e.g., player name, registration order) for consistent display.
 *
 * To get player's total points across all events:
 * ```sql
 * SELECT SUM(points_awarded) FROM event_results
 * WHERE registration_id IN (SELECT id FROM registrations WHERE player_id = ?)
 * ```
 *
 * @see placementTiers - The tiers assigned to participants
 * @see pointsSchemas - The point system used by the event
 * @see pointsSchemaEntry - Maps tiers to point values
 * @see events - The event this result belongs to
 * @see registrations - The participant registration
 */
export const eventResults = pgTable(
  'event_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    registrationId: uuid('registration_id')
      .notNull()
      .references(() => registrations.id, { onDelete: 'cascade' }),
    /**
     * Final numerical position in the event (1, 2, 3, 4, 5...)
     *
     * **Important**: This field is NOT unique - multiple players can share the same position.
     * For example, 4 quarter-final losers all have finalPosition = 5.
     *
     * **Usage**:
     * - Time-based events: Every participant has a unique position (1, 2, 3, 4...)
     * - Elimination events: Multiple players can share positions (e.g., 4 QF losers at position 5)
     * - Used for display, sorting, and tiebreak transparency
     * - Can be NULL for incomplete events or special cases
     */
    finalPosition: integer('final_position'),
    /**
     * The placement tier assigned to this participant (WINNER, FINALIST, QF, POS_1, etc.)
     *
     * **Required**: Every participant must have a tier
     * **Purpose**: Used to look up points from the points schema
     * **Grouping**: Multiple players can share the same tier (e.g., all QF losers get QF tier)
     *
     * @see placementTiers - The tier definition
     */
    placementTierId: uuid('placement_tier_id')
      .notNull()
      .references(() => placementTiers.id, { onDelete: 'restrict' }),
    /**
     * Points awarded to this participant for this event
     *
     * **Calculation**: Looked up from pointsSchemaEntry when event completes
     * **Storage**: Denormalized here for performance and historical accuracy
     * **Note**: Changing points schema doesn't retroactively update this value
     */
    pointsAwarded: integer('points_awarded').notNull().default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('unique_event_registration').on(table.eventId, table.registrationId),
    index('idx_event_results_event_id').on(table.eventId),
    index('idx_event_results_registration_id').on(table.registrationId),
    index('idx_event_results_placement_tier_id').on(table.placementTierId),
    index('idx_event_results_final_position').on(table.finalPosition),
  ]
)

// Federation Players Junction Table (player registration in federation)
export const federationPlayers = pgTable(
  'federation_players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    federationId: uuid('federation_id')
      .notNull()
      .references(() => federations.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    federationRegistrationNumber: varchar('federation_registration_number', {
      length: 50,
    }).notNull(),
    registrationYear: integer('registration_year').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('unique_federation_player').on(table.federationId, table.playerId),
  ]
)

// Helper function to format date as "Nov 22, 2025"
export const formatDateForSessionName = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Type exports
export type Player = typeof players.$inferSelect
export type Test = typeof tests.$inferSelect
export type TestResult = typeof testResults.$inferSelect
export type Event = typeof events.$inferSelect
export type Group = typeof groups.$inferSelect
export type Registration = typeof registrations.$inferSelect
export type RegistrationPlayer = typeof registrationPlayers.$inferSelect
export type Match = typeof matches.$inferSelect
export type Set = typeof sets.$inferSelect
export type Coach = typeof coaches.$inferSelect
export type TrainingSession = typeof trainingSessions.$inferSelect
export type TrainingSessionCoach = typeof trainingSessionCoaches.$inferSelect
export type TrainingSessionAttendance =
  typeof trainingSessionAttendance.$inferSelect
export type Federation = typeof federations.$inferSelect
export type Championship = typeof championships.$inferSelect
export type FederationClub = typeof federationClubs.$inferSelect
export type FederationPlayer = typeof federationPlayers.$inferSelect
export type Organization = typeof organization.$inferSelect
export type Member = typeof member.$inferSelect
export type Invitation = typeof invitation.$inferSelect
export type User = typeof user.$inferSelect
export type PlacementTier = typeof placementTiers.$inferSelect
export type PointsSchema = typeof pointsSchemas.$inferSelect
export type PointsSchemaEntry = typeof pointsSchemaEntry.$inferSelect
export type EventResult = typeof eventResults.$inferSelect
