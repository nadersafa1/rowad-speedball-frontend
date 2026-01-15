# Implementation Standards & Migration Guide

This document outlines the new standards implemented in the codebase and provides migration instructions for updating existing code.

## Table of Contents
- [Error Handling Standard](#error-handling-standard)
- [Type Import Standard](#type-import-standard)
- [Organization ID Resolution Standard](#organization-id-resolution-standard)
- [Validation Schema Standard](#validation-schema-standard)
- [Migration Checklist](#migration-checklist)

---

## Error Handling Standard

### New Standard: `handleApiError` Utility

**Location**: `src/lib/api-error-handler.ts`

**Benefits**:
- ✅ Structured logging with error tracking IDs
- ✅ Automatic error type detection (Zod, database, generic)
- ✅ Consistent error responses
- ✅ Production-ready for monitoring services (Sentry, DataDog)

### Before (Old Pattern)
```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await db.query.entity.findMany()
    return Response.json({ data })
  } catch (error) {
    console.error('Error fetching entity:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
```

### After (New Standard)
```typescript
import { handleApiError } from '@/lib/api-error-handler'
import { getOrganizationContext } from '@/lib/organization-helpers'

export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()

  try {
    const data = await db.query.entity.findMany()
    return Response.json({ data })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/entity',
      method: 'GET',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
```

### Migration Steps

**Step 1**: Add import
```typescript
import { handleApiError } from '@/lib/api-error-handler'
```

**Step 2**: Replace catch block
```typescript
// Old
} catch (error) {
  console.error('Error fetching entity:', error)
  return Response.json({ message: 'Internal server error' }, { status: 500 })
}

// New
} catch (error) {
  return handleApiError(error, {
    endpoint: '/api/v1/entity',        // Current route
    method: 'GET',                      // HTTP method
    userId: context.userId,             // From getOrganizationContext()
    organizationId: context.organization?.id,
  })
}
```

**Step 3**: Custom error messages (optional)
```typescript
} catch (error) {
  return handleApiError(error, {
    endpoint: '/api/v1/entity',
    method: 'POST',
    userId: context.userId,
    organizationId: context.organization?.id,
    customMessage: 'Failed to create entity',  // User-friendly message
    severity: ErrorSeverity.CRITICAL,           // Optional severity override
  })
}
```

### Additional Utilities

**Not Found Responses**:
```typescript
import { notFoundResponse } from '@/lib/api-error-handler'

if (!entity) {
  return notFoundResponse('Entity', {
    endpoint: '/api/v1/entity',
    method: 'GET',
    userId: context.userId,
  })
}
```

**Validation Errors**:
```typescript
import { validationErrorResponse } from '@/lib/api-error-handler'

if (age < 2) {
  return validationErrorResponse(
    ['Player must be at least 2 years old'],
    { endpoint: '/api/v1/players', method: 'POST' }
  )
}
```

---

## Type Import Standard

### New Standard: Import All Types from `@/types`

**Central Location**: `src/types/index.ts`

**Benefits**:
- ✅ Single source of truth
- ✅ No duplicate type definitions
- ✅ Better IDE autocomplete
- ✅ Easier refactoring

### Before (Inconsistent)
```typescript
// Some files
import type { Coach } from '@/db/schema'
import type { Player } from '@/types'

// Other files
import type { coaches } from '@/db/schema'
export type Coach = typeof coaches.$inferSelect

// Yet other files
import type { TrainingSession } from '@/db/schema'
```

### After (New Standard)
```typescript
// Always import from @/types
import type { Coach, Player, TrainingSession, User } from '@/types'
```

### Available Types from `@/types`

**Manually Defined** (with calculated fields):
- `Player` - Includes `age`, `ageGroup`, `organizationName`
- `Test` - Includes `totalTime`, `formattedTotalTime`, `status`
- `Event` - Full event type with all fields

**Re-exported from Schema** (for consistency):
- `Coach`
- `TrainingSession`, `TrainingSessionCoach`, `TrainingSessionAttendance`
- `User`
- `Organization`, `Member`, `Invitation`
- `Federation`, `Championship`, `FederationClub`, `FederationPlayer`
- `Match`, `Set`, `Registration`, `Group`
- `TestResult`

### Migration Steps

**Step 1**: Find inconsistent imports
```bash
# Search for direct schema imports
grep -r "from '@/db/schema'" src/store/
grep -r "from '@/db/schema'" src/config/
grep -r "from '@/db/schema'" src/components/
```

**Step 2**: Replace with centralized import
```typescript
// Old
import type { Coach } from '@/db/schema'

// New
import type { Coach } from '@/types'
```

**Step 3**: Remove local type definitions
```typescript
// Old
import type { coaches } from '@/db/schema'
export type Coach = typeof coaches.$inferSelect

// New
import type { Coach } from '@/types'
// Remove the export line
```

### Files Already Updated
- ✅ `src/store/users-store.ts`
- ✅ `src/store/coaches-store.ts`
- ✅ `src/store/training-sessions-store.ts`
- ✅ `src/config/tables/coaches.config.ts`
- ✅ `src/config/tables/tests.config.ts`
- ✅ `src/config/tables/training-sessions.config.ts`

### Files Still Need Updates
- Run grep to find remaining direct schema imports
- Update systematically across components, hooks, and services

---

## Organization ID Resolution Standard

### New Standard: `resolveOrganizationId` Helper

**Location**: `src/lib/organization-helpers.ts:238-269`

**Benefits**:
- ✅ Eliminates 20+ lines of duplicate logic per route
- ✅ Consistent authorization behavior
- ✅ Automatic organization validation for system admins

### Before (Duplicated Logic)
```typescript
export async function POST(request: NextRequest) {
  const context = await getOrganizationContext()
  const { isSystemAdmin, organization } = context
  const body = await request.json()
  const { organizationId: providedOrgId } = body

  // 20+ lines of duplicate logic
  let finalOrganizationId = providedOrgId
  if (!isSystemAdmin) {
    finalOrganizationId = organization?.id || null
  } else if (providedOrgId !== undefined && providedOrgId !== null) {
    const orgCheck = await db
      .select()
      .from(schema.organization)
      .where(eq(schema.organization.id, providedOrgId))
      .limit(1)
    if (orgCheck.length === 0) {
      return Response.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }
  }

  await db.insert(schema.entity).values({
    ...data,
    organizationId: finalOrganizationId,
  })
}
```

### After (New Standard)
```typescript
import { resolveOrganizationId } from '@/lib/organization-helpers'

export async function POST(request: NextRequest) {
  const context = await getOrganizationContext()
  const body = await request.json()
  const { organizationId: providedOrgId } = body

  // Single line replaces 20+ lines
  const { organizationId: finalOrganizationId, error: orgError } =
    await resolveOrganizationId(context, providedOrgId)
  if (orgError) return orgError

  await db.insert(schema.entity).values({
    ...data,
    organizationId: finalOrganizationId,
  })
}
```

### Migration Steps

**Step 1**: Add import
```typescript
import { resolveOrganizationId } from '@/lib/organization-helpers'
```

**Step 2**: Find organization ID resolution logic
Look for patterns like:
```typescript
let finalOrganizationId = providedOrgId
if (!isSystemAdmin) {
  finalOrganizationId = organization?.id || null
}
```

**Step 3**: Replace with helper call
```typescript
const { organizationId: finalOrganizationId, error: orgError } =
  await resolveOrganizationId(context, providedOrgId)
if (orgError) return orgError
```

### Files Already Updated
- ✅ `src/app/api/v1/players/route.ts` (POST method)

### Files Still Need Updates
Search for duplicate org ID resolution:
```bash
grep -A 10 "let finalOrganizationId" src/app/api/v1/*/route.ts
```

Likely candidates:
- `src/app/api/v1/coaches/route.ts` (POST)
- `src/app/api/v1/events/route.ts` (POST)
- `src/app/api/v1/tests/route.ts` (POST)
- `src/app/api/v1/training-sessions/route.ts` (POST)
- Any other routes that accept `organizationId` in request body

---

## Validation Schema Standard

### New Standard: Use Centralized Patterns

**Location**: `src/lib/forms/patterns.ts`

**Benefits**:
- ✅ Eliminates 46+ duplicate validation schemas
- ✅ Consistent validation messages
- ✅ Single place to update validation rules
- ✅ Strongly typed with TypeScript

### Available Patterns

**Basic Fields**:
```typescript
import {
  nameSchema,           // 2-255 chars, required
  rtlNameSchema,        // Optional RTL name, max 255
  emailSchema,          // Email validation
  descriptionSchema,    // Max 1000 chars, optional
  longTextSchema,       // Configurable max length
} from '@/lib/forms/patterns'
```

**IDs**:
```typescript
import {
  uuidSchema,           // UUID validation
  optionalUuidSchema,   // Optional UUID
} from '@/lib/forms/patterns'
```

**Dates**:
```typescript
import {
  dateStringSchema,         // API date string (YYYY-MM-DD)
  optionalDateStringSchema, // Optional date string
  dateOfBirthSchema,        // DOB with age validation
  futureDateSchema,         // For events, registrations
} from '@/lib/forms/patterns'
```

**Common Sport Fields**:
```typescript
import {
  genderSchema,         // 'male' | 'female'
  eventGenderSchema,    // Includes 'mixed'
  preferredHandSchema,  // 'left' | 'right' | 'both'
  visibilitySchema,     // 'public' | 'private'
} from '@/lib/forms/patterns'
```

### Before (Duplicated)
```typescript
// In players.schemas.ts
name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
nameRtl: z.string().max(255, 'RTL Name is too long').optional().nullable(),
gender: z.enum(['male', 'female'], { message: 'Gender must be male or female' }),
userId: z.uuid('Invalid user ID format').optional().nullable(),

// In coaches.schemas.ts
name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
nameRtl: z.string().max(255, 'RTL Name is too long').optional().nullable(),
gender: z.enum(['male', 'female'], { message: 'Gender must be male or female' }),

// Same pattern repeated in events, tests, training-sessions, etc.
```

### After (New Standard)
```typescript
import {
  nameSchema,
  rtlNameSchema,
  genderSchema,
  optionalUuidSchema,
} from '@/lib/forms/patterns'

// In all schema files
export const entityCreateSchema = z.object({
  name: nameSchema,
  nameRtl: rtlNameSchema,
  gender: genderSchema,
  userId: optionalUuidSchema,
  // ... other fields
})
```

### Migration Steps

**Step 1**: Add import to schema file
```typescript
import {
  nameSchema,
  rtlNameSchema,
  genderSchema,
  preferredHandSchema,
  uuidSchema,
  optionalUuidSchema,
  dateStringSchema,
  visibilitySchema,
} from '@/lib/forms/patterns'
```

**Step 2**: Replace duplicate validation schemas

| Old Pattern | New Pattern |
|------------|-------------|
| `z.string().min(1).max(255)` | `nameSchema` |
| `z.string().max(255).optional().nullable()` | `rtlNameSchema` |
| `z.enum(['male', 'female'], {...})` | `genderSchema` |
| `z.enum(['left', 'right', 'both'], {...})` | `preferredHandSchema` |
| `z.uuid(...).optional().nullable()` | `optionalUuidSchema` |
| `z.uuid(...)` (required) | `uuidSchema` |
| `z.enum(['public', 'private'], {...})` | `visibilitySchema` |
| Date string with validation | `dateStringSchema` |

**Step 3**: Test validation still works
```bash
npm run type-check
```

### Files Already Updated
- ✅ `src/types/api/players.schemas.ts` (partial - imports added, create schema updated)

### Files Still Need Full Updates
- `src/types/api/coaches.schemas.ts`
- `src/types/api/events.schemas.ts`
- `src/types/api/tests.schemas.ts`
- `src/types/api/training-sessions.schemas.ts`
- `src/types/api/organizations.schemas.ts`
- `src/types/api/championships.schemas.ts`
- `src/types/api/federations.schemas.ts`
- And 8+ more schema files

---

## Migration Checklist

### Phase 1: High Priority (Do First)

#### Error Handling
- [ ] Update all GET routes to use `handleApiError`
- [ ] Update all POST routes to use `handleApiError`
- [ ] Update all PATCH routes to use `handleApiError`
- [ ] Update all DELETE routes to use `handleApiError`
- [ ] Replace 404 checks with `notFoundResponse`
- [ ] Replace custom validation errors with `validationErrorResponse`

**Estimated Impact**: 48 API route files

#### Type Imports
- [ ] Find all `import { X } from '@/db/schema'` in stores
- [ ] Replace with `import { X } from '@/types'`
- [ ] Find all local type redefinitions
- [ ] Remove duplicate type exports

**Estimated Impact**: 15-20 files (stores, configs, components)

### Phase 2: Medium Priority

#### Organization ID Resolution
- [ ] Find all POST routes with `organizationId` in body
- [ ] Replace duplicate resolution logic with `resolveOrganizationId`
- [ ] Test that system admin org validation works

**Estimated Impact**: 10-15 POST routes

#### Validation Schemas
- [ ] Update `coaches.schemas.ts` to use patterns
- [ ] Update `events.schemas.ts` to use patterns
- [ ] Update `tests.schemas.ts` to use patterns
- [ ] Update `training-sessions.schemas.ts` to use patterns
- [ ] Update remaining schema files

**Estimated Impact**: 15+ schema files

### Phase 3: Verification

- [ ] Run `npm run type-check` - Must pass
- [ ] Run `npm run build` - Must pass
- [ ] Test API routes in development
- [ ] Verify error tracking IDs appear in logs
- [ ] Check that all components still work

---

## Quick Reference Commands

### Find Files to Update

**Error handling**:
```bash
grep -r "console.error" src/app/api/v1/ | grep "Error fetching"
grep -r "Internal server error" src/app/api/v1/
```

**Type imports**:
```bash
grep -r "from '@/db/schema'" src/store/
grep -r "from '@/db/schema'" src/config/
grep -r "typeof.*\$inferSelect" src/
```

**Org ID resolution**:
```bash
grep -r "finalOrganizationId" src/app/api/v1/
grep -A 10 "System admin.*validate" src/app/api/v1/
```

**Validation patterns**:
```bash
grep -r "\.min(1,.*Name is required" src/types/api/
grep -r "\.max(255,.*too long" src/types/api/
grep -r "z\.enum(\['male', 'female'\]" src/types/api/
```

---

## Benefits Summary

| Standard | Files Affected | Lines Removed | Benefits |
|----------|----------------|---------------|----------|
| Error Handling | ~48 routes | ~200 lines | Structured logging, error tracking |
| Type Imports | ~20 files | ~40 lines | Consistency, single source of truth |
| Org ID Resolution | ~15 routes | ~300 lines | DRY, consistent validation |
| Validation Schemas | ~15 schemas | ~460 lines | Reusable, maintainable |
| **Total** | **~100 files** | **~1000 lines** | **Production-ready, maintainable** |

---

---

## Advanced Error Handling Details

### Error ID Generation

**Pattern**: `err_[timestamp]_[random]`

```typescript
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
```

**Example**: `err_1704985234567_k2x9m`

**Benefits**:
- Unique tracking across distributed systems
- Timestamp for temporal correlation
- Random suffix prevents collisions

### Error Severity Levels

**Four levels** (from `ErrorSeverity` enum):

```typescript
export enum ErrorSeverity {
  INFO = 'info',        // Informational, not an error
  WARNING = 'warning',  // Potential issue, doesn't break flow
  ERROR = 'error',      // Error occurred, request failed
  CRITICAL = 'critical' // System-level failure, requires immediate attention
}
```

**When to use each**:
- **INFO**: Logging successful operations with notable details
- **WARNING**: Validation issues, deprecated API usage, rate limiting
- **ERROR**: Failed requests, database errors, API call failures (default)
- **CRITICAL**: Database connection loss, authentication system failure, data corruption

### Structured Logging Format

**Log entry structure**:
```typescript
interface ErrorLogEntry {
  timestamp: string           // ISO 8601 format
  errorId: string             // Unique error ID
  severity: ErrorSeverity     // Error level
  message: string             // Human-readable message
  endpoint: string            // API route path
  method: string              // HTTP method
  statusCode: number          // HTTP status code
  userId?: string | null      // User who triggered error
  organizationId?: string | null  // Org context
  stack?: string              // Stack trace (dev only)
  details?: Record<string, unknown>  // Additional context
}
```

**Example log output**:
```json
{
  "timestamp": "2026-01-15T10:30:45.123Z",
  "errorId": "err_1704985234567_k2x9m",
  "severity": "error",
  "message": "Failed to fetch players",
  "endpoint": "/api/v1/players",
  "method": "GET",
  "statusCode": 500,
  "userId": "user_123",
  "organizationId": "org_456",
  "stack": "Error: Database connection failed..."
}
```

### Production Monitoring Integration

**Ready for integration** with monitoring services:

```typescript
function logError(entry: ErrorLogEntry): void {
  // In production, send to:
  // - Sentry: Sentry.captureException(entry)
  // - DataDog: datadogLogs.logger.error(entry)
  // - CloudWatch: cloudwatch.putLogEvents(entry)
  // - Custom service: await sendToLoggingService(entry)

  console.error('[API Error]', JSON.stringify(entry, null, 2))
}
```

**Reference**: `src/lib/api-error-handler.ts:48-70`

### Database Error Handling

**Automatic detection** of database error types:

```typescript
// Unique constraint violation → 409 Conflict
if (message.includes('unique constraint')) {
  return NextResponse.json(
    { message: 'A record with this value already exists', errorId },
    { status: 409 }
  )
}

// Foreign key violation → 409 Conflict
if (message.includes('foreign key constraint')) {
  return NextResponse.json(
    { message: 'Cannot delete: record is referenced by other data', errorId },
    { status: 409 }
  )
}

// Connection/timeout error → 503 Service Unavailable
if (message.includes('connection') || message.includes('timeout')) {
  return NextResponse.json(
    { message: 'Database temporarily unavailable', errorId },
    { status: 503, severity: ErrorSeverity.CRITICAL }
  )
}
```

---

## LoadingButton Pattern

### Component Usage

**Location**: `src/components/forms/loading-button.tsx`

**Standard Form Usage**:
```typescript
import { LoadingButton } from '@/components/forms/loading-button'
import { useForm } from 'react-hook-form'

export const EntityForm = () => {
  const form = useForm()

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}

      <LoadingButton
        type="submit"
        isLoading={form.formState.isSubmitting}
        loadingText="Saving..."
      >
        Save Changes
      </LoadingButton>
    </form>
  )
}
```

### Props Interface

```typescript
interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean      // Show loading state
  loadingText?: string     // Text to display during loading
  icon?: React.ReactNode   // Optional icon (shown when not loading)
}
```

### Features

1. **Automatic Disable**: Button disabled during loading
2. **Spinner Animation**: Rotating Loader2 icon
3. **Text Change**: Optional different text during loading
4. **Icon Support**: Show icon when not loading

**Examples**:
```typescript
// Basic usage
<LoadingButton isLoading={isSubmitting}>
  Submit
</LoadingButton>

// With custom loading text
<LoadingButton isLoading={isSubmitting} loadingText="Creating...">
  Create Player
</LoadingButton>

// With icon
<LoadingButton
  isLoading={isSubmitting}
  icon={<Save className="h-4 w-4" />}
>
  Save
</LoadingButton>
```

### When to Use vs Standard Button

**Use LoadingButton when**:
- Form submission
- Async action (create, update, delete)
- Any action that requires user to wait

**Use standard Button when**:
- Navigation
- Opening dialogs
- Synchronous actions (cancel, close)
- Actions that don't need loading feedback

---

## Data Transformation Patterns

### Date Transformations

**API to Component** (display):
```typescript
import { parseDateFromAPI } from '@/lib/date-utils'

// API returns: "2024-01-15" (YYYY-MM-DD string)
const dateOfBirth = parseDateFromAPI(player.dateOfBirth)  // → Date object
```

**Component to API** (submission):
```typescript
import { formatDateForAPI } from '@/lib/date-utils'

// Form has: Date object
const formattedData = {
  ...data,
  dateOfBirth: formatDateForAPI(data.dateOfBirth)  // → "2024-01-15" string
}

await apiClient.createPlayer(formattedData)
```

**Pattern in Stores**:
```typescript
createPlayer: async (data: any) => {
  const formattedData = {
    ...data,
    dateOfBirth: data.dateOfBirth instanceof Date
      ? formatDateForAPI(data.dateOfBirth)
      : data.dateOfBirth,  // Already string
  }

  const newPlayer = await apiClient.createPlayer(formattedData)
  // ...
}
```

**Reference**: `src/store/players-store.ts:97-121`

### Position Scores (JSONB Handling)

**Database Format**: JSONB with keys `R`, `L`, `F`, `B`

```typescript
// Position scores structure
interface PositionScores {
  R?: number   // Right hand
  L?: number   // Left hand
  F?: number   // Forehand
  B?: number   // Backhand
}

// API returns/accepts as JSONB
const registration = {
  playerId: "player_123",
  positionScores: { R: 85, L: 78, F: 92, B: 81 }
}
```

**Form Handling**:
```typescript
// Display in form
<FormField name="positionScores.R" />
<FormField name="positionScores.L" />
<FormField name="positionScores.F" />
<FormField name="positionScores.B" />

// Submit as object
const data = {
  positionScores: {
    R: parseInt(formData.R),
    L: parseInt(formData.L),
    F: parseInt(formData.F),
    B: parseInt(formData.B),
  }
}
```

### Stats Extraction with Type Guards

**Problem**: API may return different stats types

**Solution**: Type guards for safe extraction

```typescript
import type { PlayersStats, CoachesStats } from '@/types/api/pagination'

// Type guard functions
function isPlayersStats(stats: any): stats is PlayersStats {
  return stats && 'maleCount' in stats && 'femaleCount' in stats
}

function isCoachesStats(stats: any): stats is CoachesStats {
  return stats && 'totalCount' in stats && 'activeCount' in stats
}

// Usage in store
fetchPlayers: async (filters = {}) => {
  const response = await apiClient.getPlayers(params) as PaginatedResponse<Player> & { stats?: PlayersStats }

  set({
    players: response.data,
    stats: response.stats || null,  // Safely extract stats
    isLoading: false,
  })
}
```

**Reference**: `src/store/players-store.ts:61`

---

## API Response Standards

### Paginated Response Structure

**Standard format** for all list endpoints:

```typescript
interface PaginatedResponse<T> {
  data: T[]              // Array of entities
  page: number           // Current page (1-indexed)
  limit: number          // Items per page
  totalItems: number     // Total items in dataset
  totalPages: number     // Calculated: Math.ceil(totalItems / limit)
  stats?: EntityStats    // Optional aggregated stats
}
```

**Example API response**:
```json
{
  "data": [
    { "id": "1", "name": "John Doe" },
    { "id": "2", "name": "Jane Smith" }
  ],
  "page": 1,
  "limit": 25,
  "totalItems": 48,
  "totalPages": 2,
  "stats": {
    "maleCount": 30,
    "femaleCount": 18,
    "ageGroupsCount": 5
  }
}
```

**Helper Function**:
```typescript
function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  totalItems: number
): PaginatedResponse<T> {
  return {
    data,
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  }
}
```

**With Stats**:
```typescript
const response = createPaginatedResponse(players, page, limit, totalItems)
return Response.json({ ...response, stats: computedStats })
```

### Stats Inclusion Pattern

**Stats computed server-side** and included in response:

```typescript
export async function GET(request: NextRequest) {
  // ... fetch data

  // Compute stats with Promise.all for efficiency
  const [maleCount, femaleCount] = await Promise.all([
    db.select({ count: count() })
      .from(schema.players)
      .where(eq(schema.players.gender, 'male')),
    db.select({ count: count() })
      .from(schema.players)
      .where(eq(schema.players.gender, 'female')),
  ])

  const stats: PlayersStats = {
    maleCount: maleCount[0].count,
    femaleCount: femaleCount[0].count,
    totalCount: maleCount[0].count + femaleCount[0].count,
  }

  return Response.json({
    ...createPaginatedResponse(players, page, limit, totalItems),
    stats,
  })
}
```

### Error Response Format

**Standard error response**:
```typescript
interface ErrorResponse {
  message: string               // User-friendly error message
  errorId: string               // Unique tracking ID
  errors?: ValidationError[]    // Validation errors (if applicable)
  stack?: string               // Stack trace (dev only, not in production)
}
```

**Validation Error**:
```json
{
  "message": "Validation error",
  "errorId": "err_1704985234567_k2x9m",
  "errors": [
    {
      "path": "name",
      "message": "Name is required"
    },
    {
      "path": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Generic Error**:
```json
{
  "message": "Failed to fetch players",
  "errorId": "err_1704985234567_k2x9m"
}
```

---

## Support

For questions or issues during migration:
1. Check this guide first
2. Look at reference implementations:
   - Error handling: `src/app/api/v1/players/route.ts` (example in comments)
   - Type imports: `src/config/tables/coaches.config.ts`
   - Org resolution: `src/app/api/v1/players/route.ts` (POST)
   - Validation: `src/types/api/players.schemas.ts`
3. Review source utilities:
   - `src/lib/api-error-handler.ts`
   - `src/lib/organization-helpers.ts`
   - `src/lib/forms/patterns.ts`

## Related Documentation

- **UI Standards**: See `/docs/UI_COMPONENT_STANDARDS.md`
- **Component Standards**: See `/docs/COMPONENT_STANDARDS.md`
- **State Management**: See `/docs/STATE_MANAGEMENT_STANDARDS.md`
- **Naming Conventions**: See `/docs/NAMING_CONVENTIONS.md`
- **Forms**: See `/docs/FORMS_GUIDE.md`
- **Authorization**: See `/docs/AUTHORIZATION_RULES.md`
