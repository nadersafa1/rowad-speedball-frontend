# Public vs Authenticated Entity Access

This document clarifies which entities and operations are publicly accessible vs requiring authentication in the Rowad Speedball platform.

## Overview

The platform follows a **progressive disclosure** model:
- **Public Data**: Essential information for transparency and engagement
- **Authenticated Data**: Operational and management information
- **Restricted Data**: Sensitive or private information with role-based access

---

## Access Level Matrix

### 🌍 Fully Public Entities
No authentication required for read access.

#### Players
- **GET /api/v1/players** ✅ Public
- **GET /api/v1/players/:id** ✅ Public
- **Rationale**: Player profiles are public to promote transparency and allow fans/parents to view player information
- **Sensitive fields**: Email, phone, address (if added) should be filtered out
- **Implementation**: No `requireAuthentication()` check in GET routes

#### Organizations
- **GET /api/v1/organizations** ✅ Public
- **GET /api/v1/organizations/:id** ✅ Public
- **Rationale**: Club/team information should be publicly discoverable
- **Visible to all**: Name, description, location, contact info

#### Federations
- **GET /api/v1/federations** ✅ Public
- **GET /api/v1/federations/:id** ✅ Public
- **Rationale**: Federation information is public for administrative transparency

#### Championships
- **GET /api/v1/championships** ✅ Public
- **GET /api/v1/championships/:id** ✅ Public
- **Rationale**: Championship information should be publicly accessible for promotion

---

### 🔒 Visibility-Based Entities
Read access depends on visibility flag and organization membership.

#### Events
- **GET /api/v1/events** 🔓 Partially Public
- **Authorization Logic**:
  ```
  IF event.visibility = 'public' OR event.organizationId IS NULL
    → Anyone can view
  ELSE IF event.visibility = 'private'
    → Only org members + system admin can view
  ```
- **Use Cases**:
  - **Public events**: Tournaments, public competitions (visible to all)
  - **Private events**: Internal training competitions, qualifiers (org members only)
  - **Global events**: Federation-level events with no org (visible to all)

#### Tests (Skill Assessments)
- **GET /api/v1/tests** 🔓 Partially Public
- **Authorization Logic**: Same as events (visibility-based)
- **Use Cases**:
  - **Public tests**: Standardized skill assessments (visible to all)
  - **Private tests**: Internal club assessments (org members only)

#### Registrations
- **GET /api/v1/registrations** 🔓 Inherits from parent event
- **Authorization Logic**: Follow parent event's visibility
- **Rationale**: Registration list visibility should match event visibility

#### Matches
- **GET /api/v1/matches** 🔓 Inherits from parent event
- **Authorization Logic**: Follow parent event's visibility
- **Rationale**: Match schedules/results should match event visibility

#### Groups
- **GET /api/v1/groups** 🔓 Inherits from parent event
- **Authorization Logic**: Follow parent event's visibility
- **Rationale**: Group assignments should match event visibility

#### Sets (Match Scores)
- **GET /api/v1/sets** 🔓 Inherits from parent match/event
- **Authorization Logic**: Follow parent event's visibility
- **Rationale**: Scores should match event visibility

#### Test Results
- **GET /api/v1/test-results** 🔓 Inherits from parent test
- **Authorization Logic**: Follow parent test's visibility
- **Rationale**: Test scores should match test visibility

---

### 🔐 Authenticated-Only Entities
Authentication required for read access.

#### Coaches
- **GET /api/v1/coaches** 🔐 Authenticated Required
- **Rationale**: Coach information is operational data for organization management
- **Access**: All authenticated users can view coaches
- **Implementation**: `requireAuthentication()` check in GET route

#### Training Sessions
- **GET /api/v1/training-sessions** 🔐 Authenticated Required
- **Rationale**: Training schedules are internal operational information
- **Access**: All authenticated users can view training sessions
- **Implementation**: `requireAuthentication()` check in GET route

#### Users
- **GET /api/v1/users** 🔐 Special: Authenticated + Active Org
- **Authorization Logic**:
  ```
  IF user.role = 'admin'
    → Can list all users
  ELSE IF user has active organization
    → Can list users
  ELSE
    → Forbidden
  ```
- **GET /api/v1/users/:id** 🔐 Authenticated Required
- **Rationale**: User profiles require authentication but are viewable by all authenticated users
- **Sensitive fields**: Email, role (filtered based on permissions)

---

### 🔒 Private-Only Entities
Organization membership required for read access.

#### Player Notes
- **GET /api/v1/player-notes** 🔒 Org Members Only
- **Authorization Logic**:
  ```
  IF user is system admin
    → Can view all notes
  ELSE IF user has coach+ permissions AND player belongs to user's org
    → Can view notes
  ELSE
    → Forbidden
  ```
- **Rationale**: Player notes contain sensitive performance, medical, and behavioral information
- **Access**: System admin, org admins, owners, coaches (for their org's players)

---

## Implementation Patterns

### Pattern 1: Fully Public
```typescript
// No authentication check
export async function GET(request: NextRequest) {
  // Get organization context (optional, for filtering)
  const context = await getOrganizationContext()

  // Query and return data
  const entities = await db.query.entity.findMany()
  return Response.json({ data: entities })
}
```

**Used by**: Players, Organizations, Federations, Championships

---

### Pattern 2: Visibility-Based
```typescript
export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()

  // Build visibility conditions
  const conditions = []

  // Public visibility OR no organization
  conditions.push(
    or(
      eq(schema.entity.visibility, 'public'),
      isNull(schema.entity.organizationId)
    )
  )

  // System admin can see all
  if (!context.isSystemAdmin) {
    // Org members can see their org's private resources
    if (context.organization?.id) {
      conditions.push(
        and(
          eq(schema.entity.visibility, 'private'),
          eq(schema.entity.organizationId, context.organization.id)
        )
      )
    }
  } else {
    // System admin: include all private resources
    conditions.push(eq(schema.entity.visibility, 'private'))
  }

  const entities = await db.query.entity.findMany({
    where: or(...conditions)
  })

  return Response.json({ data: entities })
}
```

**Used by**: Events, Tests

---

### Pattern 3: Authenticated Required
```typescript
export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()

  // Require authentication
  const authError = requireAuthentication(context)
  if (authError) return authError

  // Query and return data
  const entities = await db.query.entity.findMany()
  return Response.json({ data: entities })
}
```

**Used by**: Coaches, Training Sessions

---

### Pattern 4: Organization Members Only
```typescript
export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()

  // Require authentication
  const authError = requireAuthentication(context)
  if (authError) return authError

  // Check if user has required role AND org membership
  if (!context.isSystemAdmin && !hasCoachPermissions(context)) {
    return forbiddenResponse('Insufficient permissions')
  }

  // Filter by organization
  const entities = await db.query.entity.findMany({
    where: context.isSystemAdmin
      ? undefined
      : eq(schema.entity.organizationId, context.organization?.id)
  })

  return Response.json({ data: entities })
}
```

**Used by**: Player Notes (with additional player ownership checks)

---

## Sensitive Data Filtering

Even for public entities, certain fields should be filtered based on user permissions.

### Players (Public Entity)
```typescript
// Public fields (always visible)
- id, name, nameRtl, dateOfBirth, gender
- preferredHand, teamLevel, organizationId
- age, ageGroup (computed)

// Sensitive fields (require authentication or ownership)
- email (if added in future)
- phone (if added in future)
- address (if added in future)
- userId (internal linking, not exposed in API)

// Private fields (org members only)
- Player notes (separate endpoint)
```

### Events (Visibility-Based Entity)
```typescript
// Always visible fields
- id, name, eventType, format, gender
- registrationStartDate, registrationEndDate
- eventDates, visibility, organizationId

// Conditionally visible
- registrations list (if event is public)
- matches/results (if event is public)
```

### Users (Authenticated Entity)
```typescript
// Public to authenticated users
- id, name, email (basic)

// Restricted fields
- role (only visible to system admin and federation admins)
- federationId (only visible to system admin)
- Internal auth fields (never exposed)
```

---

## Frontend Implications

### Public Pages (No Auth Required)
Components should handle unauthenticated state gracefully:

```typescript
// Good: Graceful handling
const { context } = useOrganizationContext()

return (
  <div>
    <PlayerList /> {/* Always visible */}
    {context.isAuthenticated && <CreatePlayerButton />}
  </div>
)
```

```typescript
// Good: Visibility-based display
const EventDetails = ({ event }: { event: Event }) => {
  if (event.visibility === 'public') {
    return <PublicEventView event={event} />
  }

  // Private event - check auth
  const { context } = useOrganizationContext()
  if (!context.isAuthenticated) {
    return <LoginPrompt />
  }

  return <PrivateEventView event={event} />
}
```

---

## SEO & Public Discoverability

### Publicly Indexed Pages
These routes should be accessible to search engines:

✅ **Indexable**:
- `/players` - Player directory
- `/players/:id` - Player profiles
- `/organizations` - Organization directory
- `/organizations/:id` - Organization profiles
- `/events` - Public events list
- `/events/:id` - Public event pages (if `visibility = 'public'`)
- `/federations` - Federation list
- `/championships` - Championship list

❌ **No Index** (robots meta tag):
- `/admin/*` - Admin panel
- `/coaches` - Coach directory (authenticated)
- `/training-sessions` - Training schedules (authenticated)
- `/events/:id` - Private event pages (if `visibility = 'private'`)
- `/player-notes` - All note pages (private)

### Implementation Example
```typescript
// app/players/[id]/page.tsx
export const metadata = {
  robots: 'index, follow', // Public page
}

// app/coaches/page.tsx
export const metadata = {
  robots: 'noindex, nofollow', // Private page
}
```

---

## Security Considerations

### 1. Never Trust Client-Side Checks
- Frontend visibility checks are for **UX only**
- Always enforce authorization on the backend
- Client can manipulate requests, bypass UI restrictions

### 2. Sensitive Data Leaks
- Filter out sensitive fields even from "public" entities
- Example: Player's userId should never be exposed in API responses
- Use projection in database queries to exclude sensitive fields

### 3. Enumeration Attacks
- Public endpoints can be used to enumerate resources
- This is acceptable for truly public data (players, orgs)
- Add rate limiting for public endpoints to prevent scraping

### 4. Private Event Discovery
- Private events should not appear in public event lists
- Event IDs are UUIDs (not sequential) to prevent guessing
- 404 for unauthorized access (don't confirm existence)

---

## Testing Checklist

When implementing or modifying entity access:

- [ ] Test **unauthenticated** access to public endpoints
- [ ] Test **authenticated** access to public endpoints (should work)
- [ ] Test **unauthenticated** access to authenticated endpoints (should fail)
- [ ] Test **visibility-based** filtering (public vs private)
- [ ] Test **organization boundaries** (cross-org access blocked)
- [ ] Test **system admin** override (should access everything)
- [ ] Test **sensitive field filtering** (exclude private data)
- [ ] Test **child entity inheritance** (registrations inherit event visibility)
- [ ] Verify **frontend graceful degradation** (no auth required pages work without login)
- [ ] Check **SEO meta tags** (correct robots directives)

---

## Quick Reference Table

| Entity | Public Read | Authenticated Read | Org Members Read | Notes |
|--------|------------|-------------------|------------------|-------|
| **Players** | ✅ Yes | ✅ Yes | ✅ Yes | Fully public |
| **Player Notes** | ❌ No | ❌ No | ✅ Yes | Org members only |
| **Coaches** | ❌ No | ✅ Yes | ✅ Yes | Authenticated required |
| **Events** | 🔓 Depends | 🔓 Depends | ✅ Yes | Visibility-based |
| **Groups** | 🔓 Inherits | 🔓 Inherits | ✅ Yes | From parent event |
| **Registrations** | 🔓 Inherits | 🔓 Inherits | ✅ Yes | From parent event |
| **Matches** | 🔓 Inherits | 🔓 Inherits | ✅ Yes | From parent event |
| **Sets** | 🔓 Inherits | 🔓 Inherits | ✅ Yes | From parent event |
| **Tests** | 🔓 Depends | 🔓 Depends | ✅ Yes | Visibility-based |
| **Test Results** | 🔓 Inherits | 🔓 Inherits | ✅ Yes | From parent test |
| **Training Sessions** | ❌ No | ✅ Yes | ✅ Yes | Authenticated required |
| **Championships** | ✅ Yes | ✅ Yes | ✅ Yes | Fully public |
| **Federations** | ✅ Yes | ✅ Yes | ✅ Yes | Fully public |
| **Organizations** | ✅ Yes | ✅ Yes | ✅ Yes | Fully public |
| **Users** | ❌ No | ✅ Yes | ✅ Yes | Authenticated required |

**Legend**:
- ✅ Yes - Always accessible
- ❌ No - Never accessible at this level
- 🔓 Depends - Conditional access based on visibility or parent entity

---

## References

- Authorization rules: `docs/AUTHORIZATION_RULES.md`
- Backend helpers: `src/lib/authorization/helpers/`
- Frontend hooks: `src/hooks/authorization/`
