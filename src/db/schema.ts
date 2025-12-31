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
export const testResults = pgTable('test_results', {
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
})

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
    championshipId: uuid('championship_id').references(() => championships.id, {
      onDelete: 'cascade',
    }),
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
    index('idx_events_championship_id').on(table.championshipId),
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
    index('idx_matches_event_id').on(table.eventId),
    index('idx_matches_group_id').on(table.groupId),
    index('idx_matches_played').on(table.played),
  ]
)

// Sets Table
export const sets = pgTable('sets', {
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
})

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
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('idx_championships_federation_id').on(table.federationId)]
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
