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
