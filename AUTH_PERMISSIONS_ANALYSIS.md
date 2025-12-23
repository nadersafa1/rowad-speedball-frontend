# Authorization and Permissions Analysis

## Executive Summary

This document provides a comprehensive analysis of authorization and permission handling across the Rowad Speedball application (both frontend and backend). The analysis identifies current patterns, inconsistencies, and areas for improvement.

---

## Current Architecture

### Authentication Provider
- **Framework**: `better-auth` with organization plugin
- **Session Management**: Cookie-based with 7-day expiry
- **Location**: `src/lib/auth.ts` (backend), `src/lib/auth-client.ts` (frontend)

### Role-Based Access Control (RBAC)

#### Defined Roles
Located in `src/components/auth/permissions.ts`:

1. **super_admin** - System-wide administrator
2. **owner** - Organization owner (full org control)
3. **admin** - Organization administrator
4. **coach** - Organization coach (limited permissions)
5. **player** - Organization player (read-only)
6. **member** - Organization member (basic access)

#### Role Permissions Matrix
```
Resource        | System Admin | Owner | Admin | Coach | Player | Member
----------------|--------------|-------|-------|-------|--------|--------
Organization    | Full         | Full  | Full  | None  | None   | Read
Coaches         | Full         | Full  | Full  | None  | None   | None
Players         | Full         | Full  | Full  | Full  | None   | None
Events          | Full         | Full  | Full  | Full  | None   | None
Training        | Full         | Full  | Full  | Full  | None   | None
Tests/Results   | Full         | Full  | Full  | Full  | None   | None
Player Notes    | Full         | Full  | Full  | Full  | None   | None
```

---

## Frontend Authorization

### Organization Context Helper
**Location**: `src/lib/organization-helpers.ts:41`

**Function**: `getOrganizationContext()`
- Retrieves session from better-auth
- Determines active organization
- Computes role flags: `isSystemAdmin`, `isOwner`, `isAdmin`, `isCoach`, `isPlayer`, `isMember`
- Handles federation roles: `isFederationAdmin`, `isFederationEditor`
- Returns `OrganizationContext` object

### Custom Permission Hooks

#### 1. Event Permissions (`src/hooks/use-event-permissions.ts`)
**Permissions Checked**:
- `canRead`: System admin OR public event OR event without org OR user's org event
- `canCreate`: System admin OR (admin/owner/coach with active org)
- `canUpdate`: System admin OR (admin/owner/coach with active org AND event from user's org)
- `canDelete`: System admin OR (admin/owner/coach with active org AND event from user's org)

#### 2. Match Permissions (`src/hooks/use-match-permissions.ts`)
**Special Case**: Player updating their own matches
- Players can update matches IF:
  1. User is a player with organization
  2. Match is linked to training session
  3. Training session belongs to player's org
  4. Player is registered in the match

#### 3. Player Notes Permissions (`src/hooks/use-player-notes-permissions.ts`)
**Permissions Checked**:
- `canReadNotes`: Requires authentication AND (system admin OR admin/owner/coach of player's org)

### Missing Permission Hooks
The following resources lack dedicated permission hooks:
- Coaches
- Players (general CRUD)
- Training Sessions
- Tests & Results
- Registrations
- Matches (general CRUD)
- Sets
- Championships
- Federations
- Organizations
- Users

---

## Backend Authorization

### Pattern 1: Authorization Helper Functions

#### Event Authorization Helpers (`src/lib/event-authorization-helpers.ts`)
**Functions**:
- `checkEventCreateAuthorization()` - Returns Response or null
- `checkEventUpdateAuthorization()` - Returns Response or null
- `checkEventDeleteAuthorization()` - Returns Response or null
- `checkRegistrationDeleteAuthorization()` - Returns Response or null
- `checkEventReadAuthorization()` - Returns Response or null
- `canPlayerUpdateMatch()` - Returns boolean (async)

**Pattern**: Helper returns `Response.json()` if unauthorized, `null` if authorized

#### Player Notes Authorization Helpers (`src/lib/player-notes-authorization-helpers.ts`)
**Functions**:
- `checkPlayerNotesReadAuthorization()`
- `checkPlayerNotesCreateAuthorization()`
- `checkPlayerNoteUpdateAuthorization()`
- `checkPlayerNoteDeleteAuthorization()`

**Pattern**: Same as event helpers (Response or null)

### Pattern 2: Inline Authorization Checks

#### Routes Using Inline Checks
**Count**: 41 API routes use `getOrganizationContext()` with inline authorization

**Example Pattern** (from `src/app/api/v1/players/[id]/route.ts:81`):
```typescript
const { isSystemAdmin, isAdmin, isOwner, isCoach, organization, isAuthenticated }
  = await getOrganizationContext()

if (!isAuthenticated) {
  return Response.json({ message: 'Unauthorized' }, { status: 401 })
}

if (
  (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) ||
  (!isSystemAdmin && !organization?.id)
) {
  return Response.json({ message: 'Only system admins...' }, { status: 403 })
}
```

**Routes with Inline Checks**:
- Players CRUD
- Coaches CRUD (with special rule: coaches cannot update other coaches)
- Training Sessions CRUD
- Tests CRUD
- Results CRUD
- Matches CRUD
- Sets CRUD
- Registrations CRUD
- Championships CRUD
- Federations CRUD
- Organizations CRUD
- Users CRUD

### Authorization Check Distribution

**Total API Routes**: ~45 routes
**Using Helper Functions**: 16 routes (events, registrations, player notes related)
**Using Inline Checks**: 29+ routes
**No Authorization**: Few public routes (e.g., GET public events)

---

## Identified Issues

### 1. Inconsistent Authorization Patterns
**Severity**: HIGH

**Problem**: Two competing patterns exist
- Some routes use authorization helper functions
- Others implement checks inline
- No clear guidelines on when to use which

**Impact**:
- Code duplication
- Inconsistent error messages
- Harder to maintain
- Potential security gaps

**Example**:
- Events use `checkEventUpdateAuthorization()`
- Players implement identical logic inline at `src/app/api/v1/players/[id]/route.ts:102-113`

### 2. Missing Authorization Helpers
**Severity**: HIGH

**Problem**: Most resources lack centralized authorization helpers

**Missing Helpers For**:
- Players CRUD
- Coaches CRUD
- Training Sessions CRUD
- Tests & Results CRUD
- Matches CRUD (admin actions)
- Sets CRUD
- Registrations CRUD (some exist via events)
- Championships CRUD
- Federations CRUD
- Organizations CRUD
- Users CRUD

**Impact**:
- Each route reimplements authorization logic
- Risk of permission bypasses if logic differs
- Difficult to audit permissions

### 3. Code Duplication
**Severity**: MEDIUM

**Problem**: Authorization logic repeated across 29+ routes

**Duplicated Elements**:
- Authentication checks
- Role validation
- Organization ownership checks
- Error message strings
- Permission combinations

**Example Duplication**:
```typescript
// Repeated in multiple files:
if (!isAuthenticated) {
  return Response.json({ message: 'Unauthorized' }, { status: 401 })
}

if (
  (!isSystemAdmin && !isAdmin && !isOwner && !isCoach) ||
  (!isSystemAdmin && !organization?.id)
) {
  return Response.json({
    message: 'Only system admins, club admins, club owners, and club coaches...'
  }, { status: 403 })
}
```

### 4. Unclear Permission Boundaries
**Severity**: MEDIUM

**Problem**: Inconsistent rules for similar resources

**Examples**:
- Coaches can create/update/delete events but cannot update other coaches
- Coaches can create/update/delete players but are excluded from coaches CRUD
- Some resources allow coach access, others don't (inconsistent)

**Location**: `src/app/api/v1/coaches/[id]/route.ts:93-108`

### 5. Missing Frontend Permission Hooks
**Severity**: MEDIUM

**Problem**: Only 3 permission hooks exist for UI conditional rendering

**Missing Hooks**:
- useCoachPermissions
- usePlayerPermissions
- useTrainingSessionPermissions
- useTestPermissions
- useResultPermissions
- useRegistrationPermissions
- useMatchPermissions (admin)
- useSetPermissions
- useChampionshipPermissions
- useFederationPermissions
- useOrganizationPermissions

**Impact**:
- UI components may implement permission checks inline
- Inconsistent UX (showing buttons user can't use)
- Permission logic not reusable

### 6. Organization Context Complexity
**Severity**: LOW

**Problem**: Many role flags to track and check

**Current Flags**:
```typescript
{
  isSystemAdmin,
  isOwner,
  isAdmin,
  isCoach,
  isPlayer,
  isMember,
  isFederationAdmin,
  isFederationEditor,
  organization,
  userId,
  role,
  activeOrgId,
  federationId,
  isAuthenticated
}
```

**Impact**:
- Easy to forget a flag
- Complex boolean conditions
- Verbose authorization checks

### 7. No Permission Documentation
**Severity**: MEDIUM

**Problem**: No central documentation of permission model

**Missing**:
- Permission matrix (who can do what)
- Resource ownership rules
- Special cases documentation
- Permission testing strategy

**Impact**:
- Hard for new developers to understand
- Difficult to audit security
- Inconsistent implementation

### 8. Inline vs Helper Decision Unclear
**Severity**: MEDIUM

**Problem**: No clear criteria for when to use helpers vs inline

**Questions**:
- Why do events use helpers but players don't?
- When should new resources use helpers?
- Should all inline checks be converted?

### 9. Federation Roles Underutilized
**Severity**: LOW

**Problem**: Federation roles exist but aren't consistently checked

**Current State**:
- `isFederationAdmin` and `isFederationEditor` flags exist
- Not used in most authorization checks
- Unclear what permissions they should have

**Location**: `src/lib/organization-helpers.ts:27-39`

### 10. Error Message Inconsistency
**Severity**: LOW

**Problem**: Similar operations have different error messages

**Examples**:
- "Unauthorized" vs "Forbidden" for 401/403
- "Only system admins, club admins..." vs "You can only..."
- Inconsistent status codes

---

## Recommendations

### Priority 1: Standardize Authorization Pattern

**Goal**: Single, consistent pattern for all authorization checks

**Approach**:
1. Create comprehensive authorization helper library
2. Migrate all inline checks to helpers
3. Establish clear guidelines

**Proposed Structure**:
```
src/lib/authorization/
  ├── helpers/
  │   ├── player-authorization.ts
  │   ├── coach-authorization.ts
  │   ├── training-session-authorization.ts
  │   ├── test-authorization.ts
  │   ├── result-authorization.ts
  │   ├── match-authorization.ts
  │   ├── set-authorization.ts
  │   ├── registration-authorization.ts
  │   ├── championship-authorization.ts
  │   ├── federation-authorization.ts
  │   ├── organization-authorization.ts
  │   └── user-authorization.ts
  ├── types.ts
  └── index.ts
```

**Benefits**:
- Single source of truth
- Easier to audit
- Consistent error messages
- Better testability

### Priority 2: Create Authorization Helper Template

**Goal**: Standardized helper function signature

**Template**:
```typescript
export function checkResourceActionAuthorization(
  context: OrganizationContext,
  resource?: ResourceType
): ReturnType<typeof Response.json> | null {
  // 1. Authentication check
  if (!isAuthenticated) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // 2. Role check
  if (!hasRequiredRole(context)) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  // 3. Organization ownership check (if resource provided)
  if (resource && !hasOrganizationAccess(context, resource)) {
    return Response.json({ message: 'Forbidden' }, { status: 403 })
  }

  return null
}
```

### Priority 3: Develop Frontend Permission Hooks

**Goal**: Complete set of permission hooks for all resources

**Pattern** (from `use-event-permissions.ts`):
```typescript
export const useResourcePermissions = (resource: Resource | null | undefined) => {
  const { context } = useOrganizationContext()

  return useMemo(() => ({
    canRead: checkReadPermission(context, resource),
    canCreate: checkCreatePermission(context),
    canUpdate: checkUpdatePermission(context, resource),
    canDelete: checkDeletePermission(context, resource),
  }), [context, resource])
}
```

**Hooks to Create**:
- useCoachPermissions
- usePlayerPermissions
- useTrainingSessionPermissions
- useTestPermissions
- useResultPermissions
- useRegistrationPermissions
- useMatchPermissions
- useSetPermissions
- useChampionshipPermissions
- useFederationPermissions
- useOrganizationPermissions
- useUserPermissions

### Priority 4: Document Permission Model

**Goal**: Clear documentation of permission rules

**Content**:
1. Permission matrix table
2. Resource ownership rules
3. Special cases (e.g., player updating own match)
4. Federation role permissions
5. Organization context behavior

**Location**: Create `PERMISSIONS.md` in project root

### Priority 5: Clarify Coach Permissions

**Goal**: Resolve inconsistencies in coach permissions

**Questions to Answer**:
1. Should coaches be able to update other coaches?
2. What's the rationale for current restrictions?
3. Should permissions be role-based or resource-based?

**Current Inconsistency**:
- Coaches CAN: create/update/delete events, players, training sessions, tests
- Coaches CANNOT: update other coaches
- Why the difference?

### Priority 6: Implement Permission Testing

**Goal**: Automated testing of authorization logic

**Approach**:
1. Unit tests for authorization helpers
2. Integration tests for API routes
3. Test all role combinations
4. Test organization ownership rules

**Coverage**:
- Each authorization helper
- Each permission hook
- Edge cases (no org, multiple orgs, etc.)

### Priority 7: Create Permission Audit Tool

**Goal**: Script to verify authorization consistency

**Features**:
- List all API routes
- Identify routes without authorization
- Check for inline vs helper usage
- Verify error message consistency

### Priority 8: Standardize Error Messages

**Goal**: Consistent error responses

**Proposed Standards**:
- 401: "Authentication required"
- 403: "Insufficient permissions"
- 404: "Resource not found"

**Implementation**:
- Error message constants file
- Centralized error response helpers

---

## Areas for Development

### 1. Authorization Helper Library
**Effort**: HIGH
**Impact**: HIGH
**Priority**: 1

Create comprehensive authorization helper functions for all resources following the event authorization pattern.

### 2. Frontend Permission Hooks
**Effort**: MEDIUM
**Impact**: HIGH
**Priority**: 2

Develop complete set of custom hooks for UI conditional rendering.

### 3. Permission Documentation
**Effort**: LOW
**Impact**: MEDIUM
**Priority**: 3

Document the complete permission model with examples.

### 4. Migration of Inline Checks
**Effort**: HIGH
**Impact**: HIGH
**Priority**: 4

Refactor all routes using inline checks to use new helpers.

### 5. Permission Testing Suite
**Effort**: MEDIUM
**Impact**: HIGH
**Priority**: 5

Comprehensive test coverage for authorization logic.

### 6. Federation Role Integration
**Effort**: MEDIUM
**Impact**: LOW
**Priority**: 6

Fully integrate federation roles into permission checks.

### 7. Permission Audit Tooling
**Effort**: LOW
**Impact**: MEDIUM
**Priority**: 7

Build tools to verify and maintain authorization consistency.

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Document current permission model
- [ ] Create authorization helper library structure
- [ ] Define authorization helper template
- [ ] Write authorization tests for events (baseline)

### Phase 2: Backend Consolidation (Weeks 3-5)
- [ ] Create authorization helpers for all resources
- [ ] Migrate 5-10 routes per week to new helpers
- [ ] Update error messages for consistency
- [ ] Test each migrated route

### Phase 3: Frontend Enhancement (Weeks 6-7)
- [ ] Create remaining permission hooks
- [ ] Audit UI components for inline permission checks
- [ ] Migrate UI to use permission hooks
- [ ] Add loading states for permission checks

### Phase 4: Testing & Documentation (Week 8)
- [ ] Complete authorization test suite
- [ ] Write PERMISSIONS.md
- [ ] Create permission audit script
- [ ] Code review and security audit

### Phase 5: Polish & Optimization (Week 9)
- [ ] Optimize permission checks (caching)
- [ ] Add permission error logging
- [ ] Performance testing
- [ ] Final documentation updates

---

## Conclusion

The Rowad Speedball application has a solid foundation for authorization using better-auth with organization-based RBAC. However, there are significant inconsistencies between different resources and patterns.

**Key Strengths**:
- Good use of better-auth with organization plugin
- Some well-designed authorization helpers (events, player notes)
- Clear role definitions
- Organization context abstraction

**Key Weaknesses**:
- Inconsistent use of authorization patterns
- Missing authorization helpers for most resources
- Extensive code duplication
- Limited frontend permission hooks
- No centralized permission documentation

**Priority Actions**:
1. Standardize on helper function pattern
2. Create authorization helpers for all resources
3. Develop complete set of permission hooks
4. Document permission model
5. Implement comprehensive testing

Implementing these recommendations will result in:
- More maintainable codebase
- Better security posture
- Improved developer experience
- Clearer permission model
- Easier onboarding for new developers

---

**Generated**: 2025-12-22
**Branch**: enhancement/auth-permissions-review
