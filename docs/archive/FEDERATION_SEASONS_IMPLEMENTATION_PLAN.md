# Federation Seasons Architecture - Implementation Plan

**Status**: Ready for Implementation
**Date**: January 2026
**Estimated Effort**: 30-40 hours

---

## Executive Summary

Major architectural refactoring to implement a two-tier federation membership system with season-based player registration and federation-specific age groups.

### Key Changes
1. **Two-Tier Membership**: Permanent federation membership + season-specific registrations
2. **Season-Based Age Groups**: Each federation season defines its own age groups with flexible age restrictions
3. **Manual Federation IDs**: Federation IDs are manually entered (not auto-generated)
4. **Flexible Age Validation**: Optional min/max age per age group with warnings (not strict validation)
5. **Drop Old Tables**: Complete removal of `federationPlayers` and `federationPlayerRequests` tables
6. **Season Registration Limits**: Each season defines max age groups per player

---

## Core Requirements

### 1. Two-Tier Membership System

#### Permanent Federation Membership
- Player gets a **manually entered** federation ID number (not auto-generated)
- Created during first season registration
- If player already has membership, display existing federation ID
- If player is new, prompt admin to enter federation ID during registration
- One permanent membership per player per federation

#### Season Registration
- Player registers for specific seasons with age group selection
- Can register for multiple age groups per season (configurable limit)
- Requires approval from federation admin
- Payment tracking (for future implementation)
- Tracks which organization registered the player

### 2. Season-Based Age Groups

- Each federation season defines its own available age groups
- Age groups have **optional** min/max age (nullable)
- Different federations can have different age groups for the same year
- Examples:
  - **Seniors**: Anyone can play (no age restrictions)
  - **U-21**: Could be 17-21, or just ≤21, or 19-21 (federation decides)
  - **U-16**: Could have no restrictions, or min age 14
- System shows **warnings** if player outside age range, but allows registration
- **No strict validation** - federation admin has final say

### 3. Season Configuration

- Season name format: "2023-2024" (year range)
- Season has definite start/end dates
- 1-2 registration periods with start/end dates
- Each season defines **max age groups per player** (e.g., 1, 2, or unlimited)
- Season status: draft, active, closed, archived

### 4. Championships Integration

- Championship editions link to seasons
- Multiple championships can occur within a season
- Existing championship editions can have null seasonId

### 5. Migration Strategy

- **DROP** `federationPlayers` table completely
- **DROP** `federationPlayerRequests` table completely
- No data migration needed (no valuable data)
- Create entirely new structure

---

## Database Schema Changes

### New Tables

#### 1. `seasons` Table
```sql
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE CASCADE,

  -- Season identification
  name VARCHAR(100) NOT NULL, -- "2023-2024 Season"
  start_year INTEGER NOT NULL, -- 2023
  end_year INTEGER NOT NULL, -- 2024
  season_start_date DATE NOT NULL, -- 2023-07-01
  season_end_date DATE NOT NULL, -- 2024-06-30

  -- Registration periods
  first_registration_start_date DATE,
  first_registration_end_date DATE,
  second_registration_start_date DATE,
  second_registration_end_date DATE,

  -- Season configuration
  max_age_groups_per_player INTEGER DEFAULT 1, -- Min 1, can be unlimited (9999)

  -- Status
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'closed', 'archived')),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_year_range CHECK (end_year = start_year + 1),
  CONSTRAINT chk_season_dates CHECK (season_end_date > season_start_date),
  CONSTRAINT chk_max_age_groups CHECK (max_age_groups_per_player >= 1),
  CONSTRAINT unique_federation_season UNIQUE (federation_id, start_year, end_year)
);

CREATE INDEX idx_seasons_federation_id ON seasons(federation_id);
CREATE INDEX idx_seasons_status ON seasons(status);
CREATE INDEX idx_seasons_dates ON seasons(season_start_date, season_end_date);
```

**Key Features**:
- `max_age_groups_per_player`: Configurable per season (default 1, use 9999 for unlimited)
- Flexible registration periods (optional second period)
- Year range validation ensures end_year = start_year + 1

---

#### 2. `season_age_groups` Table
```sql
CREATE TABLE season_age_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,

  -- Age group definition
  code VARCHAR(20) NOT NULL, -- 'U-16', 'U-18', 'Seniors', etc.
  name VARCHAR(100) NOT NULL, -- 'Under 16', 'Under 18', 'Seniors'

  -- OPTIONAL age restrictions (nullable)
  min_age INTEGER, -- NULL = no minimum age
  max_age INTEGER, -- NULL = no maximum age

  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_season_age_group UNIQUE (season_id, code),
  CONSTRAINT chk_age_range CHECK (
    min_age IS NULL OR max_age IS NULL OR max_age >= min_age
  )
);

CREATE INDEX idx_season_age_groups_season_id ON season_age_groups(season_id);
```

**Key Features**:
- `min_age` and `max_age` are **NULLABLE** (optional restrictions)
- Seniors: both NULL (anyone can play)
- U-21 flexible: max_age=21, min_age=NULL (anyone ≤21)
- U-21 restricted: max_age=21, min_age=17 (only 17-21)
- System will show warnings but not block registration

**Examples**:
```sql
-- Seniors (no age restrictions)
INSERT INTO season_age_groups (season_id, code, name, min_age, max_age)
VALUES (uuid, 'Seniors', 'Seniors', NULL, NULL);

-- U-21 (anyone 21 or under)
INSERT INTO season_age_groups (season_id, code, name, min_age, max_age)
VALUES (uuid, 'U-21', 'Under 21', NULL, 21);

-- U-18 with minimum (ages 15-18 only)
INSERT INTO season_age_groups (season_id, code, name, min_age, max_age)
VALUES (uuid, 'U-18', 'Under 18', 15, 18);
```

---

#### 3. `season_player_registrations` Table
```sql
CREATE TABLE season_player_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_age_group_id UUID NOT NULL REFERENCES season_age_groups(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,

  -- Registration details
  player_age_at_registration INTEGER NOT NULL, -- Age when registered
  registration_date TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Age warning flags (informational only, not blocking)
  age_warning_shown BOOLEAN DEFAULT false, -- Was age warning displayed?
  age_warning_type TEXT, -- 'too_young', 'too_old', 'outside_range', null

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES user(id) ON DELETE SET NULL,
  rejection_reason TEXT,

  -- Payment (future implementation)
  payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_amount DECIMAL(10, 2),
  payment_date TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_player_season_age_group
    UNIQUE (season_id, player_id, season_age_group_id)
);

CREATE INDEX idx_season_registrations_season_id ON season_player_registrations(season_id);
CREATE INDEX idx_season_registrations_player_id ON season_player_registrations(player_id);
CREATE INDEX idx_season_registrations_age_group ON season_player_registrations(season_age_group_id);
CREATE INDEX idx_season_registrations_status ON season_player_registrations(status);
CREATE INDEX idx_season_registrations_organization ON season_player_registrations(organization_id);
```

**Key Features**:
- Tracks age at registration for historical accuracy
- Age warnings are informational (not blocking)
- Player can register for multiple age groups in same season
- Approval workflow with rejection reasons
- Payment tracking stubs for future

---

#### 4. `federation_members` Table
```sql
CREATE TABLE federation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id UUID NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- MANUALLY ENTERED federation ID (not auto-generated)
  federation_id_number VARCHAR(50) NOT NULL,

  -- Created during first season registration
  first_registration_season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
  first_registration_date TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Membership status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'revoked')),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_federation_member UNIQUE (federation_id, player_id),
  CONSTRAINT unique_federation_id_number UNIQUE (federation_id, federation_id_number)
);

CREATE INDEX idx_federation_members_federation_id ON federation_members(federation_id);
CREATE INDEX idx_federation_members_player_id ON federation_members(player_id);
CREATE INDEX idx_federation_members_id_number ON federation_members(federation_id_number);
```

**Key Features**:
- `federation_id_number` is **manually entered** by admin (not auto-generated)
- Created when first season registration is approved
- Permanent membership (doesn't expire)
- Tracks which season the player first joined

---

### Modified Tables

#### 5. `championship_editions` Table (Add Column)
```sql
ALTER TABLE championship_editions
  ADD COLUMN season_id UUID REFERENCES seasons(id) ON DELETE RESTRICT;

-- Existing championship editions will have NULL season_id
-- New championship editions should require season_id

CREATE INDEX idx_championship_editions_season_id ON championship_editions(season_id);
```

**Migration Note**: Existing championship editions will have NULL season_id for backward compatibility.

---

### Dropped Tables

#### 6. Drop Old Federation Tables
```sql
DROP TABLE IF EXISTS federation_player_requests CASCADE;
DROP TABLE IF EXISTS federation_players CASCADE;
```

**Rationale**: No valuable data exists in these tables. Clean slate approach.

---

## Database Relations

```
federations (1) ─┬─> (N) seasons
                 ├─> (N) championships
                 └─> (N) federation_members

seasons (1) ─┬─> (N) season_age_groups
             ├─> (N) season_player_registrations
             ├─> (N) championship_editions
             └─> (N) federation_members (first_registration_season_id)

season_age_groups (1) ─> (N) season_player_registrations

players (1) ─┬─> (N) season_player_registrations
             └─> (N) federation_members

organization (1) ─> (N) season_player_registrations
```

---

## Implementation Phases

### Phase 1: Database Schema (Priority 1)

**Files to Create/Modify**:
- `src/db/schema.ts` - Add new table definitions
- `drizzle/` - Generate and run migration

**Steps**:
1. Update `src/db/schema.ts` with new table definitions
2. Add relations for all new tables
3. Remove/comment out old `federationPlayers` and `federationPlayerRequests` definitions
4. Run `npm run db:generate` to create migration file
5. Review migration file
6. Run `npm run db:migrate` to apply migration
7. Verify with `npm run db:studio`

**Migration File Structure**:
```sql
-- 1. Drop old tables
DROP TABLE IF EXISTS federation_player_requests CASCADE;
DROP TABLE IF EXISTS federation_players CASCADE;

-- 2. Create new tables in order
CREATE TABLE seasons (...);
CREATE TABLE season_age_groups (...);
CREATE TABLE federation_members (...);
CREATE TABLE season_player_registrations (...);

-- 3. Modify existing tables
ALTER TABLE championship_editions ADD COLUMN season_id UUID REFERENCES seasons(id);

-- 4. Create indexes
CREATE INDEX ...;
```

---

### Phase 2: TypeScript Types & Schemas (Priority 1)

#### 2.1 Create Season Schemas
**File**: `src/types/api/seasons.schemas.ts` (NEW)

```typescript
import { z } from 'zod'

// Season CRUD
export const createSeasonSchema = z.object({
  federationId: z.uuid(),
  name: z.string().min(1).max(100),
  startYear: z.number().int().min(2000).max(2100),
  endYear: z.number().int().min(2000).max(2100),
  seasonStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seasonEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  firstRegistrationStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  firstRegistrationEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  secondRegistrationStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  secondRegistrationEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maxAgeGroupsPerPlayer: z.number().int().min(1).default(1),
}).refine(data => data.endYear === data.startYear + 1, {
  message: 'End year must be exactly one year after start year',
})

export const updateSeasonSchema = createSeasonSchema.partial().omit({ federationId: true })

// Age Group CRUD
export const createSeasonAgeGroupSchema = z.object({
  seasonId: z.uuid(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  minAge: z.number().int().min(0).max(100).nullable(), // NULLABLE
  maxAge: z.number().int().min(0).max(100).nullable(), // NULLABLE
  displayOrder: z.number().int().default(0),
})

// Season Registration
export const createSeasonRegistrationSchema = z.object({
  seasonId: z.uuid(),
  playerId: z.uuid(),
  seasonAgeGroupId: z.uuid(),
  federationIdNumber: z.string().optional(), // For new members
})

export const bulkCreateSeasonRegistrationSchema = z.object({
  seasonId: z.uuid(),
  seasonAgeGroupId: z.uuid(), // Single age group for bulk
  playerRegistrations: z.array(z.object({
    playerId: z.uuid(),
    federationIdNumber: z.string().optional(), // Per player
  })).min(1).max(50),
})

export const updateSeasonRegistrationStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled']),
  rejectionReason: z.string().optional(),
  federationIdNumber: z.string().optional(), // Required for approval if new member
})
```

#### 2.2 Update Schema File
**File**: `src/db/schema.ts` (MODIFY)

Add all new table definitions and relations as shown in Database Schema section above.

---

### Phase 3: Backend API Routes (Priority 2)

#### 3.1 Seasons Management API

**File**: `src/app/api/v1/seasons/route.ts` (NEW)
- `GET /api/v1/seasons` - List seasons (filter by federationId, status)
- `POST /api/v1/seasons` - Create season (federation admin only)

**File**: `src/app/api/v1/seasons/[id]/route.ts` (NEW)
- `GET /api/v1/seasons/[id]` - Get season details with age groups
- `PATCH /api/v1/seasons/[id]` - Update season
- `DELETE /api/v1/seasons/[id]` - Delete season (if no registrations)

**Authorization**: Federation admin or system admin only

---

#### 3.2 Season Age Groups API

**File**: `src/app/api/v1/seasons/[id]/age-groups/route.ts` (NEW)
- `GET /api/v1/seasons/[id]/age-groups` - List age groups for season
- `POST /api/v1/seasons/[id]/age-groups` - Add age group to season

**File**: `src/app/api/v1/season-age-groups/[id]/route.ts` (NEW)
- `PATCH /api/v1/season-age-groups/[id]` - Update age group
- `DELETE /api/v1/season-age-groups/[id]` - Remove age group (if no registrations)

**Authorization**: Federation admin only

---

#### 3.3 Season Player Registrations API

**File**: `src/app/api/v1/season-registrations/route.ts` (NEW)
- `GET /api/v1/season-registrations` - List registrations
  - Filters: seasonId, playerId, organizationId, status, ageGroupId
  - Returns: Registration with player, age group, organization, federation member info
- `POST /api/v1/season-registrations` - Create single registration
  - Check if player already has federation membership
  - If yes: display existing federation ID
  - If no: require federation ID input
  - Validate player age against age group (show warning if outside range)
  - Check max registrations per season not exceeded
  - Create registration with status='pending'

**File**: `src/app/api/v1/season-registrations/bulk/route.ts` (NEW)
- `POST /api/v1/season-registrations/bulk` - Bulk create registrations
  - Single season + single age group + multiple players
  - For each player: check membership, validate age, create registration
  - All-or-nothing transaction
  - Return warnings for age mismatches

**File**: `src/app/api/v1/season-registrations/[id]/route.ts` (NEW)
- `GET /api/v1/season-registrations/[id]` - Get registration details
- `PATCH /api/v1/season-registrations/[id]` - Update registration status
  - On approval: create federation_members record if doesn't exist (requires federationIdNumber)
  - On rejection: just update status with reason
- `DELETE /api/v1/season-registrations/[id]` - Cancel registration (pending only)

**Authorization**:
- Create: Organization owner/admin
- Approve/Reject: Federation admin
- View: Organization owner/admin (their registrations) or federation admin (all)

---

#### 3.4 Eligible Players API

**File**: `src/app/api/v1/players/eligible-for-season/route.ts` (NEW)
- `GET /api/v1/players/eligible-for-season?seasonId=xxx&ageGroupId=yyy`
- Returns players with:
  - `isEligible: boolean` (based on max registrations limit)
  - `ageWarning: string | null` (if outside age group range)
  - `federationMember: object | null` (existing membership info)
  - `existingRegistrations: number` (count for this season)

**Logic**:
1. Get all players from user's organization
2. Get season's max registrations limit
3. For each player:
   - Check existing registrations count for this season
   - Calculate age
   - Check if age outside age group min/max (warning only)
   - Check if already registered for this specific age group
   - Check federation membership status
4. Return enriched player list

---

#### 3.5 Federation Members API

**File**: `src/app/api/v1/federation-members/route.ts` (NEW)
- `GET /api/v1/federation-members` - List federation members
  - Filter by federationId, playerId
- `GET /api/v1/federation-members/check?federationId=xxx&playerId=yyy` - Check if player is member

**Authorization**: Federation admin, or organization admin for their players

---

### Phase 4: Business Logic Helpers (Priority 2)

#### 4.1 Season Helpers
**File**: `src/lib/season-helpers.ts` (NEW)

```typescript
/**
 * Calculate player's age at a specific date
 */
export function calculateAgeAtDate(
  dateOfBirth: string,
  atDate: string
): number {
  // Implementation
}

/**
 * Check if player's age is outside age group range (warning, not blocking)
 */
export function checkAgeGroupWarning(
  playerAge: number,
  ageGroup: { minAge: number | null; maxAge: number | null }
): { hasWarning: boolean; warningType: string | null; message: string | null } {
  if (ageGroup.minAge === null && ageGroup.maxAge === null) {
    return { hasWarning: false, warningType: null, message: null }
  }

  if (ageGroup.minAge !== null && playerAge < ageGroup.minAge) {
    return {
      hasWarning: true,
      warningType: 'too_young',
      message: `Player is ${playerAge} years old, younger than minimum age ${ageGroup.minAge}`,
    }
  }

  if (ageGroup.maxAge !== null && playerAge > ageGroup.maxAge) {
    return {
      hasWarning: true,
      warningType: 'too_old',
      message: `Player is ${playerAge} years old, older than maximum age ${ageGroup.maxAge}`,
    }
  }

  return { hasWarning: false, warningType: null, message: null }
}

/**
 * Check if season registration is currently open
 */
export function isSeasonRegistrationOpen(season: {
  firstRegistrationStartDate?: string | null
  firstRegistrationEndDate?: string | null
  secondRegistrationStartDate?: string | null
  secondRegistrationEndDate?: string | null
}): boolean {
  const now = new Date()

  // Check first period
  if (season.firstRegistrationStartDate && season.firstRegistrationEndDate) {
    const start = new Date(season.firstRegistrationStartDate)
    const end = new Date(season.firstRegistrationEndDate)
    if (now >= start && now <= end) return true
  }

  // Check second period
  if (season.secondRegistrationStartDate && season.secondRegistrationEndDate) {
    const start = new Date(season.secondRegistrationStartDate)
    const end = new Date(season.secondRegistrationEndDate)
    if (now >= start && now <= end) return true
  }

  return false
}

/**
 * Generate season name from years (e.g., "2023-2024")
 */
export function generateSeasonName(startYear: number, endYear: number): string {
  return `${startYear}-${endYear}`
}

/**
 * Check if player can register for another age group in this season
 */
export async function canPlayerRegisterForAgeGroup(
  playerId: string,
  seasonId: string,
  maxAgeGroupsPerPlayer: number,
  tx: Transaction
): Promise<{ canRegister: boolean; reason?: string }> {
  const existingCount = await tx
    .select({ count: count() })
    .from(seasonPlayerRegistrations)
    .where(
      and(
        eq(seasonPlayerRegistrations.playerId, playerId),
        eq(seasonPlayerRegistrations.seasonId, seasonId),
        inArray(seasonPlayerRegistrations.status, ['pending', 'approved'])
      )
    )

  if (existingCount[0].count >= maxAgeGroupsPerPlayer) {
    return {
      canRegister: false,
      reason: `Player already registered for maximum ${maxAgeGroupsPerPlayer} age group(s) in this season`,
    }
  }

  return { canRegister: true }
}
```

---

#### 4.2 Authorization Helpers
**File**: `src/lib/authorization/helpers/season-authorization.ts` (NEW)

```typescript
import type { OrganizationContext } from '@/lib/organization-helpers'
import type { AuthorizationResult } from '@/lib/authorization/types'

export function checkSeasonCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Must be federation admin or system admin
}

export function checkSeasonRegistrationCreateAuthorization(
  context: OrganizationContext
): AuthorizationResult {
  // Must be organization owner/admin with organizationId
}

export function checkSeasonRegistrationApproveAuthorization(
  context: OrganizationContext,
  registration: { federationId: string }
): AuthorizationResult {
  // Must be federation admin for the correct federation or system admin
}
```

---

### Phase 5: Frontend Components (Priority 3)

#### 5.1 Season Management Pages

**New Pages**:
- `/admin/seasons` - List seasons (federation admin)
- `/admin/seasons/new` - Create season
- `/admin/seasons/[id]` - Edit season
- `/admin/seasons/[id]/age-groups` - Manage age groups

**Components**:
- `SeasonForm` - Create/edit season with all fields
- `SeasonAgeGroupForm` - Create/edit age group (with nullable min/max)
- `SeasonsList` - Display seasons table
- `AgeGroupsList` - Display age groups for a season
- `SeasonStatusBadge` - Show season status

---

#### 5.2 Season Registration Pages

**New Pages**:
- `/players/season-registration` - Season registration page (replaces bulk federation app)
- `/admin/season-registrations` - Manage registrations (federation admin)

**Components**:
- `SeasonSelector` - Select federation → season → age group
- `SeasonRegistrationTable` - Display registrations with status
- `SeasonRegistrationForm` - Register players with federation ID input
- `FederationIdInput` - Input field with existing member detection
- `AgeWarningBadge` - Display age warnings

---

#### 5.3 Replace Bulk Application Feature

**Remove These Files**:
- `src/app/players/federation/bulk-apply/page.tsx`
- `src/app/players/federation/bulk-apply/components/bulk-apply-player-table.tsx`
- `src/app/api/v1/federation-player-requests/bulk/route.ts`
- `src/app/api/v1/players/eligible-for-federation/route.ts`

**Create New File**:
- `src/app/players/season-registration/page.tsx` - New season registration page

**New Flow**:
1. Select federation
2. Select active season (dropdown shows only active seasons)
3. Select age group (from season's defined age groups)
4. View eligible players table:
   - Shows federation member status
   - Shows age warnings (if any)
   - Shows current registration count for season
   - Checkboxes enabled/disabled based on eligibility
5. For new members: Input federation ID field per player
6. Submit → Creates season registrations with status='pending'

**Update Sidebar**:
```typescript
// Change quick action from:
'Bulk Federation Application' → 'Season Registration'
// URL from:
'/players/federation/bulk-apply' → '/players/season-registration'
```

---

#### 5.4 Update API Client

**File**: `src/lib/api-client.ts` (MODIFY)

Remove old methods:
```typescript
// REMOVE
bulkCreateFederationPlayerRequests()
getEligibleFederationPlayers()
```

Add new methods:
```typescript
// Seasons
async getSeasons(params: { federationId?: string; status?: string }): Promise<PaginatedResponse<Season>>
async createSeason(data: CreateSeasonInput): Promise<Season>
async updateSeason(id: string, data: UpdateSeasonInput): Promise<Season>
async deleteSeason(id: string): Promise<void>

// Season Age Groups
async getSeasonAgeGroups(seasonId: string): Promise<AgeGroup[]>
async createSeasonAgeGroup(data: CreateSeasonAgeGroupInput): Promise<AgeGroup>
async updateSeasonAgeGroup(id: string, data: UpdateSeasonAgeGroupInput): Promise<AgeGroup>
async deleteSeasonAgeGroup(id: string): Promise<void>

// Season Registrations
async getSeasonRegistrations(params: SeasonRegistrationsQuery): Promise<PaginatedResponse<Registration>>
async createSeasonRegistration(data: CreateSeasonRegistrationInput): Promise<Registration>
async bulkCreateSeasonRegistrations(data: BulkCreateSeasonRegistrationInput): Promise<BulkResult>
async updateSeasonRegistrationStatus(id: string, data: UpdateStatusInput): Promise<Registration>
async cancelSeasonRegistration(id: string): Promise<void>

// Eligible Players
async getEligiblePlayersForSeason(seasonId: string, ageGroupId: string): Promise<EligiblePlayer[]>

// Federation Members
async checkFederationMembership(federationId: string, playerId: string): Promise<FederationMember | null>
```

---

#### 5.5 Update Zustand Stores

**Remove Old Store**:
- `src/store/federation-player-requests-store.ts` (DELETE)

**Create New Stores**:
- `src/store/seasons-store.ts` (NEW)
- `src/store/season-age-groups-store.ts` (NEW)
- `src/store/season-registrations-store.ts` (NEW)
- `src/store/federation-members-store.ts` (NEW)

Follow existing store patterns with CRUD operations.

---

### Phase 6: Update Existing Features (Priority 3)

#### 6.1 Championship Editions

**File**: `src/app/admin/championships/[id]/editions/new/page.tsx` (MODIFY)

Add:
- Season selector (required for new editions)
- Load seasons for the championship's federation
- Display season details (dates, registration periods)

**File**: `src/app/admin/championships/[id]/editions/[editionId]/page.tsx` (MODIFY)

Add:
- Display linked season information
- Option to change season (if no events created yet)

---

#### 6.2 Player Profile

**File**: `src/app/players/[id]/page.tsx` (MODIFY)

Add new section:
- "Federation Memberships" - Show permanent memberships with federation IDs
- "Season Registrations" - Show all season registrations with status

---

#### 6.3 Navigation Updates

**File**: `src/components/app-sidebar.tsx` (MODIFY)

Federation Admin Section:
```typescript
{
  title: 'Seasons',
  url: '/admin/seasons',
  icon: Calendar,
},
{
  title: 'Season Registrations',
  url: '/admin/season-registrations',
  icon: ClipboardCheck,
},
```

Team Management Section (for org admins):
```typescript
// Update quick action
{
  name: 'Season Registration',
  url: '/players/season-registration',
  icon: Users,
}
```

---

## UI/UX Flow Examples

### Example 1: First-Time Season Registration

**User**: Club Admin registering player "Ahmed" for first time

1. Navigate to "Season Registration" from sidebar
2. Select "Egyptian Speedball Federation"
3. Select "2023-2024 Season"
4. Select "U-16" age group
5. Table shows players:
   ```
   [✓] Ahmed (Age 15)
       Status: Not a federation member
       Age: ✅ Within range (14-16)

   [ ] Sara (Age 15)
       Status: Federation Member #EGY-2023-001
       Age: ⚠️ Too young (min age 16)
       Registrations: 1/2
   ```
6. Check Ahmed's checkbox
7. System detects: Ahmed is not a federation member
8. Dialog appears: "Ahmed is not a federation member. Enter federation ID:"
   ```
   Federation ID: [____________]
   (This will be Ahmed's permanent federation ID)
   ```
9. Enter: "EGY-2024-042"
10. Submit
11. Creates:
    - `season_player_registrations` (status: pending)
    - Will create `federation_members` on approval

**Federation Admin**: Approves registration
1. Go to "Season Registrations"
2. See pending registration for Ahmed
3. Click "Approve"
4. System creates `federation_members` record with ID "EGY-2024-042"
5. Updates registration status to 'approved'

---

### Example 2: Existing Member Multi-Age Group Registration

**User**: Club admin registering "Sara" (existing member) for multiple age groups

1. Navigate to "Season Registration"
2. Select federation + season
3. Select "U-18" age group
4. Table shows:
   ```
   [✓] Sara (Age 17)
       Federation Member: #EGY-2023-001 ✅
       Age: ✅ Within range (15-18)
       Current Registrations: 1/2 (can register for 1 more)
   ```
5. Check Sara's checkbox
6. No federation ID input needed (already member)
7. Submit → Registration created (pending approval)
8. Repeat for "Seniors" age group
9. Sara now has 2 pending registrations (reached max of 2)
10. Table now shows:
    ```
    [ ] Sara (Age 17) - DISABLED
        Federation Member: #EGY-2023-001 ✅
        Current Registrations: 2/2 (max reached)
    ```

---

### Example 3: Age Warning But Registration Allowed

**User**: Club admin registering "Mohamed" (age 19) for U-16

1. Select U-16 age group (max age: 16)
2. Table shows:
   ```
   [✓] Mohamed (Age 19)
       Federation Member: #EGY-2023-005
       Age: ⚠️ Too old (max age 16)
       Warning: Player is 19, older than max age 16
   ```
3. Checkbox is ENABLED (warnings don't block)
4. Admin can still select and submit
5. Registration created with:
   - `age_warning_shown: true`
   - `age_warning_type: 'too_old'`
6. Federation admin sees warning when approving:
   ```
   ⚠️ Age Warning: Mohamed (19) is older than max age (16)

   [Approve Anyway] [Reject]
   ```
7. Federation admin decides (has final authority)

---

## Testing Strategy

### Unit Tests
- Age warning logic (`checkAgeGroupWarning`)
- Season registration window checks (`isSeasonRegistrationOpen`)
- Max registrations validation (`canPlayerRegisterForAgeGroup`)
- Season name generation (`generateSeasonName`)

### Integration Tests
- Complete first-time registration flow
- Multi-age-group registration
- Age warning scenarios
- Max registrations limit enforcement
- Federation membership creation on approval
- Season status transitions

### Manual Testing Checklist
- [ ] Create season with registration periods
- [ ] Add multiple age groups (with/without age restrictions)
- [ ] Register new player (enter federation ID)
- [ ] Register existing member (show federation ID)
- [ ] Test age warnings (too young, too old, out of range)
- [ ] Test max registrations limit
- [ ] Approve registration (creates federation membership)
- [ ] Reject registration (with reason)
- [ ] Link championship edition to season
- [ ] Test season status transitions
- [ ] Test navigation and sidebar updates

---

## Migration Execution

### Step 1: Create Migration
```bash
npm run db:generate
```

### Step 2: Review Migration File
Check migration file includes:
- DROP statements for old tables
- CREATE statements for new tables in correct order
- ALTER statement for championship_editions
- All indexes and constraints

### Step 3: Run Migration
```bash
npm run db:migrate
```

### Step 4: Verify Schema
```bash
npm run db:studio
```

Verify:
- Old tables dropped
- New tables created with correct structure
- Indexes created
- Foreign keys working

---

## Rollback Plan

If issues occur:
1. **Database**: Restore from backup taken before migration
2. **Code**: Git revert to commit before implementation
3. **Old Tables**: Were completely dropped, restore from backup only

---

## Timeline Estimate

- **Phase 1 (Database)**: 2-3 hours
- **Phase 2 (Types/Schemas)**: 2 hours
- **Phase 3 (API Routes)**: 8-10 hours
- **Phase 4 (Business Logic)**: 4-5 hours
- **Phase 5 (Frontend)**: 10-12 hours
- **Phase 6 (Updates)**: 4-5 hours
- **Testing**: 4-6 hours

**Total**: ~35-45 hours

---

## Open Questions

1. **Federation ID Format**: What format should federation IDs follow? (e.g., EGY-2024-0001, or free text?)
2. **Season Auto-Close**: Should seasons auto-close after end date, or require manual status change?
3. **Payment**: Should we implement payment tracking now or just leave stubs?
4. **Historical Data**: Should we show old archived federation memberships in UI, or only active?
5. **Season Display Name**: Auto-generate from years or allow custom naming?

---

## Success Criteria

- ✅ Two-tier membership system working (permanent + seasonal)
- ✅ Federation IDs manually entered and tracked
- ✅ Season-based age groups with flexible validation
- ✅ Age warnings displayed but don't block registration
- ✅ Max age groups per player enforced
- ✅ Championship editions linked to seasons
- ✅ Old tables dropped successfully
- ✅ All tests passing
- ✅ Type-safe throughout
- ✅ Migration runs cleanly

---

## Notes

- This is a **breaking change** - old federation membership system completely replaced
- All existing code using `federationPlayers` or `federationPlayerRequests` must be updated
- The bulk application feature built recently will be completely removed and rebuilt
- Federation admins will need training on new season management workflow
- Club admins will need guidance on season registration vs permanent membership

---

**Plan Status**: Ready for Review and Implementation
**Last Updated**: January 2026
