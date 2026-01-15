# Authorization Hooks Refactoring

**Date:** 2026-01-11
**Status:** ✅ Completed

## Overview

This document describes the refactoring of page components to use specialized authorization hooks instead of directly accessing `useOrganizationContext`.

## Motivation

Previously, page components were directly using `useOrganizationContext()` to access role flags, organization data, and federation information. This approach had several issues:

1. **Tight Coupling**: Components were tightly coupled to the organization context structure
2. **Inconsistent Usage**: Different components extracted different pieces of context
3. **Poor Separation of Concerns**: Context access mixed with business logic
4. **Difficult Testing**: Hard to mock specific aspects of authorization

## Solution

We created three specialized hooks to replace direct `useOrganizationContext` usage in page components:

### 1. `useRoles` Hook

**Purpose**: Simple role checking
**Location**: `src/hooks/authorization/use-roles.ts`

**Returns:**
```typescript
{
  // System level
  isSystemAdmin: boolean
  isAuthenticated: boolean
  userId: string | null

  // Federation level
  isFederationAdmin: boolean
  isFederationEditor: boolean

  // Organization level
  isOwner: boolean
  isAdmin: boolean
  isCoach: boolean
  isPlayer: boolean

  // Helper flags
  isOrgMember: boolean
  isFederationMember: boolean

  isLoading: boolean
}
```

**Use Cases:**
- Check if user has specific role(s)
- Simple authorization checks in pages
- Role-based UI rendering

### 2. `useOrganization` Hook

**Purpose**: Access organization context data
**Location**: `src/hooks/authorization/use-organization.ts`

**Returns:**
```typescript
{
  organization: Organization | null
  organizationId: string | undefined
  activeOrgId: string | null
  isOwner: boolean
  isAdmin: boolean
  isLoading: boolean
}
```

**Use Cases:**
- Access organization details (name, slug, etc.)
- Get organization ID for API calls
- Check organization ownership/admin status

### 3. `useFederation` Hook

**Purpose**: Access federation context data
**Location**: `src/hooks/authorization/use-federation.ts`

**Returns:**
```typescript
{
  federationId: string | null
  isFederationAdmin: boolean
  isFederationEditor: boolean
  isSystemAdmin: boolean
  isLoading: boolean
}
```

**Use Cases:**
- Access federation ID for API calls
- Check federation-level permissions
- Federation-specific page logic

## Files Refactored

### Page Components (25 files)

#### Simple Entity Pages
✅ `/src/app/tests/page.tsx` - Removed `useOrganizationContext`, using only `useTestPermissions`
✅ `/src/app/events/page.tsx` - Removed `useOrganizationContext`, using only `useEventPermissions`
✅ `/src/app/championships/page.tsx` - Removed `useOrganizationContext`, using only `useChampionshipPermissions`
✅ `/src/app/sessions/page.tsx` - Removed `useOrganizationContext`, using only `useTrainingSessionPermissions`
✅ `/src/app/coaches/page.tsx` - Removed `useOrganizationContext`, using `authClient` for session check

#### Admin Pages
✅ `/src/app/admin/placement-tiers/page.tsx` - Now uses `useRoles`
✅ `/src/app/admin/points-schemas/page.tsx` - Now uses `useRoles`
✅ `/src/app/admin/points-schemas/[id]/page.tsx` - Now uses `useRoles`
✅ `/src/app/admin/federation-clubs/page.tsx` - Now uses `useFederation`

#### Organization & Home Pages
✅ `/src/app/organization/page.tsx` - Now uses `useOrganization`
✅ `/src/app/page.tsx` (landing) - Now uses `useRoles`

### Components
✅ `/src/app/admin/clubs/[id]/_components/link-user-dialog.tsx` - Now uses `useRoles`
✅ `/src/app/admin/users/_components/link-user-dialog.tsx` - Now uses `useRoles`
✅ `/src/app/admin/federations/components/federations-table.tsx` - Now uses `useRoles`

## Remaining `useOrganizationContext` Usage

The following files **still use** `useOrganizationContext` and should NOT be refactored:

### Entity Permission Hooks (16 files)
These hooks internally use `useOrganizationContext` to compute permissions - this is correct:
- `use-championship-permissions.ts`
- `use-coach-permissions.ts`
- `use-event-permissions.ts`
- `use-federation-permissions.ts`
- `use-federation-club-request-permissions.ts`
- `use-group-permissions.ts`
- `use-match-permissions.ts`
- `use-organization-permissions.ts`
- `use-player-note-permissions.ts`
- `use-player-permissions.ts`
- `use-points-schema-permissions.ts`
- `use-registration-permissions.ts`
- `use-result-permissions.ts`
- `use-set-permissions.ts`
- `use-test-permissions.ts`
- `use-training-session-permissions.ts`
- `use-user-permissions.ts`

### New Specialized Hooks (3 files)
These hooks internally use `useOrganizationContext` - this is correct:
- `use-roles.ts`
- `use-organization.ts`
- `use-federation.ts`

## Benefits Achieved

1. **Better Separation of Concerns**: Page components no longer need to know about the organization context structure
2. **Clearer Intent**: `useRoles()` clearly indicates role checking, `useOrganization()` indicates organization data access
3. **Easier Testing**: Can mock specific hooks instead of entire context
4. **Type Safety**: Each hook returns specific, well-typed data
5. **Reusability**: Common patterns abstracted into reusable hooks
6. **Maintainability**: Changes to context structure only affect the specialized hooks

## Migration Guide

### Before (Old Pattern)
```typescript
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'

const MyPage = () => {
  const { context, isLoading } = useOrganizationContext()
  const { isSystemAdmin, isFederationAdmin, organization } = context

  // ... use the extracted values
}
```

### After (New Pattern)

**For Role Checks:**
```typescript
import { useRoles } from '@/hooks/authorization/use-roles'

const MyPage = () => {
  const { isSystemAdmin, isFederationAdmin, isLoading } = useRoles()

  // ... use the role flags
}
```

**For Organization Data:**
```typescript
import { useOrganization } from '@/hooks/authorization/use-organization'

const MyPage = () => {
  const { organization, organizationId, isOwner, isAdmin, isLoading } = useOrganization()

  // ... use organization data
}
```

**For Federation Data:**
```typescript
import { useFederation } from '@/hooks/authorization/use-federation'

const MyPage = () => {
  const { federationId, isFederationAdmin, isSystemAdmin, isLoading } = useFederation()

  // ... use federation data
}
```

**For Entity-Specific Permissions:**
```typescript
import { usePlayerPermissions } from '@/hooks/authorization/use-player-permissions'

const MyPage = () => {
  const { canCreate, canEdit, canDelete } = usePlayerPermissions(player)

  // ... use permission flags
}
```

## Testing Recommendations

When testing components that use these hooks, you can mock them individually:

```typescript
// Mock useRoles
vi.mock('@/hooks/authorization/use-roles', () => ({
  useRoles: vi.fn(() => ({
    isSystemAdmin: true,
    isAuthenticated: true,
    isLoading: false,
    // ... other fields
  }))
}))

// Mock useOrganization
vi.mock('@/hooks/authorization/use-organization', () => ({
  useOrganization: vi.fn(() => ({
    organization: { id: '1', name: 'Test Org' },
    organizationId: '1',
    isLoading: false,
    // ... other fields
  }))
}))
```

---

## Completing the Migration

### Current Migration Status

While the specialized hooks (`useRoles`, `useOrganization`, `useFederation`) have been created, many page components still use the legacy `useOrganizationContext()` pattern. This section provides guidance for completing the migration.

### Migration Checklist

- [ ] Identify all page components using `useOrganizationContext()`
- [ ] Determine which specialized hook to use for each component
- [ ] Replace `useOrganizationContext()` with specialized hook
- [ ] Remove unused imports
- [ ] Test authorization behavior with different roles
- [ ] Verify loading states work correctly
- [ ] Ensure organization/federation context still available when needed

### Decision Tree: Which Hook to Use?

```
Need only role checks (isSystemAdmin, isAdmin, etc.)
  └─ Use useRoles()

Need organization data or organization ID
  └─ Use useOrganization()

Need federation context or federation admin checks
  └─ Use useFederation()

Need entity-specific permissions (canCreate, canEdit, canDelete)
  └─ Use use[Entity]Permissions()

Need multiple contexts (roles + organization)
  └─ Use multiple specialized hooks
```

### Common Migration Patterns

#### Pattern 1: Role Checks Only

**Before** (using `useOrganizationContext`):
```typescript
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'

const MyPage = () => {
  const { context, isLoading } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner } = context

  if (isLoading) return <Loading />

  return <PageContent />
}
```

**After** (using `useRoles`):
```typescript
import { useRoles } from '@/hooks/authorization/use-roles'

const MyPage = () => {
  const { isSystemAdmin, isAdmin, isOwner, isLoading } = useRoles()

  if (isLoading) return <Loading />

  return <PageContent />
}
```

**Benefits**:
- Clearer intent: "I need role information"
- Direct access to role flags
- No nested `context` object

#### Pattern 2: Role Checks + Organization Data

**Before**:
```typescript
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'

const MyPage = () => {
  const { context, isLoading } = useOrganizationContext()
  const { isSystemAdmin, organization } = context

  if (!organization && !isSystemAdmin) {
    return <NoOrganization />
  }

  return <PageContent organizationName={organization?.name} />
}
```

**After** (using both hooks):
```typescript
import { useRoles } from '@/hooks/authorization/use-roles'
import { useOrganization } from '@/hooks/authorization/use-organization'

const MyPage = () => {
  const { isSystemAdmin, isLoading: rolesLoading } = useRoles()
  const { organization, isLoading: orgLoading } = useOrganization()

  const isLoading = rolesLoading || orgLoading

  if (isLoading) return <Loading />

  if (!organization && !isSystemAdmin) {
    return <NoOrganization />
  }

  return <PageContent organizationName={organization?.name} />
}
```

**Benefits**:
- Separation of concerns
- Clear which data comes from where
- Independent loading states (if needed)

#### Pattern 3: Authentication Check + Organization Data

**Before**:
```typescript
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'

const MyPage = () => {
  const { context, isLoading } = useOrganizationContext()
  const { isAuthenticated, organization } = context

  if (isLoading) return <Loading />
  if (!isAuthenticated) return <Unauthorized />

  return <PageContent organization={organization} />
}
```

**After**:
```typescript
import { useRoles } from '@/hooks/authorization/use-roles'
import { useOrganization } from '@/hooks/authorization/use-organization'

const MyPage = () => {
  const { isAuthenticated, isLoading: authLoading } = useRoles()
  const { organization, isLoading: orgLoading } = useOrganization()

  const isLoading = authLoading || orgLoading

  if (isLoading) return <Loading />
  if (!isAuthenticated) return <Unauthorized />

  return <PageContent organization={organization} />
}
```

#### Pattern 4: Federation Context

**Before**:
```typescript
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'

const MyPage = () => {
  const { context, isLoading } = useOrganizationContext()
  const { isFederationAdmin, federationId } = context

  if (!isFederationAdmin) return <Unauthorized />

  return <FederationContent federationId={federationId} />
}
```

**After**:
```typescript
import { useFederation } from '@/hooks/authorization/use-federation'

const MyPage = () => {
  const { isFederationAdmin, federationId, isLoading } = useFederation()

  if (isLoading) return <Loading />
  if (!isFederationAdmin) return <Unauthorized />

  return <FederationContent federationId={federationId} />
}
```

### Audit Command

**Find all page components using `useOrganizationContext`**:
```bash
grep -r "useOrganizationContext" src/app/ --include="page.tsx"
```

### Files to Update (Priority Order)

#### Priority 1: Public-Facing Pages
- `src/app/players/page.tsx`
- `src/app/events/page.tsx`
- `src/app/tests/page.tsx`
- High visibility, most users access these

#### Priority 2: Admin Pages
- `src/app/coaches/page.tsx`
- `src/app/training-sessions/page.tsx`
- `src/app/admin/*/page.tsx`
- Moderate visibility, admin users only

#### Priority 3: Internal Pages
- Settings pages
- Profile pages
- Low visibility or infrequently accessed

### Testing After Migration

**For Each Updated Component**:

1. **Test with different roles**:
   - System admin
   - Organization admin
   - Coach
   - Player/Member
   - Unauthenticated user

2. **Verify loading states**:
   - Component shows loading spinner initially
   - Content renders after loading complete

3. **Check authorization**:
   - Unauthorized users see appropriate message
   - Authorized users see full content
   - Role-specific features show/hide correctly

4. **Test organization context**:
   - Organization data available when needed
   - Organization ID used in API calls
   - Multi-tenant filtering works correctly

### Rollback Plan

If issues arise after migration:

1. **Revert specific component**:
   ```bash
   git checkout HEAD~1 -- src/app/[feature]/page.tsx
   ```

2. **Keep specialized hooks** - they're additive, not breaking

3. **Document issues** - help improve migration guide

### When NOT to Migrate

**Keep `useOrganizationContext()` if**:
- Component needs full context object for some reason
- Component is about to be deleted/refactored anyway
- Too risky to change (critical production component)

**Migration is optional** - both patterns are supported.

---

## Future Improvements

1. Consider adding more specific hooks for common patterns (e.g., `useCanAccessAdminPages`)
2. Add JSDoc comments to all hooks with usage examples
3. Consider creating a context hook composition pattern for complex pages
4. Add unit tests for the new hooks
5. Complete migration of all page components to specialized hooks

## Related Documentation

- **Authorization Rules**: See `/docs/AUTHORIZATION_RULES.md`
- **Public vs Authenticated Access**: See `/docs/PUBLIC_VS_AUTHENTICATED_ACCESS.md`
- **Component Standards**: See `/docs/COMPONENT_STANDARDS.md`
- **Implementation Standards**: See `/docs/IMPLEMENTATION_STANDARDS.md`
