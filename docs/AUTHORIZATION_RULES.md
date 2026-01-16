# Authorization Rules Reference

This document provides a comprehensive overview of authorization rules for all entities in the Rowad Speedball platform.

## Table of Contents

- [Role Hierarchy](#role-hierarchy)
- [Entity Authorization Matrix](#entity-authorization-matrix)
- [Authorization Patterns](#authorization-patterns)
- [Special Cases](#special-cases)

---

## Role Hierarchy

### System Roles

1. **super_admin** - System administrator with unrestricted access
2. **federation-admin** - Federation-level administrator
3. **federation-editor** - Federation content editor

### Organization Roles (Highest to Lowest)

1. **owner** - Organization owner (full control)
2. **admin** - Organization administrator (full control except ownership transfer)
3. **coach** - Coach (create/edit permissions, limited delete)
4. **player** - Player role (read-only in most contexts)
5. **member** - Basic member (read-only)

### Permission Shortcuts

- **Admin-level permissions** = `system admin OR owner OR admin`
- **Coach-level permissions** = `admin-level OR coach`

---

## Entity Authorization Matrix

### Players

| Operation  | Roles                             | Organization Check                         | Notes                                    |
| ---------- | --------------------------------- | ------------------------------------------ | ---------------------------------------- |
| **Create** | System admin, Admin, Owner, Coach | Must have active org (unless system admin) | Coaches CAN create                       |
| **Read**   | Public (no auth required)         | N/A                                        | All player profiles are publicly visible |
| **Update** | System admin, Admin, Owner, Coach | Must be from user's org                    | Coaches CAN update                       |
| **Delete** | System admin, Admin, Owner        | Must be from user's org                    | **Coaches CANNOT delete**                |

**Implementation**: `src/lib/authorization/helpers/player-authorization.ts`

---

### Player Notes

| Operation  | Roles                                    | Organization Check              | Notes                          |
| ---------- | ---------------------------------------- | ------------------------------- | ------------------------------ |
| **Create** | System admin, Admin, Owner, Coach        | Must be from user's org         | Authenticated required         |
| **Read**   | System admin, Admin, Owner, Coach        | Must be from user's org         | Private to org members         |
| **Update** | System admin, Note creator               | N/A                             | Users can edit their own notes |
| **Delete** | System admin, Note creator, Admin, Owner | Note creator OR org admin/owner | Multiple deletion paths        |

**Implementation**: `src/lib/authorization/helpers/player-notes-authorization.ts`

---

### Coaches

| Operation  | Roles                      | Organization Check                         | Notes                         |
| ---------- | -------------------------- | ------------------------------------------ | ----------------------------- |
| **Create** | System admin, Admin, Owner | Must have active org (unless system admin) | Coaches CANNOT create coaches |
| **Read**   | Authenticated users        | N/A                                        | Requires authentication       |
| **Update** | System admin, Admin, Owner | Must be from user's org                    | Coaches CANNOT update coaches |
| **Delete** | System admin, Admin, Owner | Must be from user's org                    | Coaches CANNOT delete coaches |

**Implementation**: `src/lib/authorization/helpers/coach-authorization.ts`

---

### Events

| Operation  | Roles                                             | Organization Check                         | Notes                     |
| ---------- | ------------------------------------------------- | ------------------------------------------ | ------------------------- |
| **Create** | System admin, Admin, Owner, Coach                 | Must have active org (unless system admin) | Coaches CAN create        |
| **Read**   | Public for public events, Org members for private | See visibility rules below                 | Complex visibility logic  |
| **Update** | System admin, Admin, Owner, Coach                 | Must be from user's org                    | Coaches CAN update        |
| **Delete** | System admin, Admin, Owner                        | Must be from user's org                    | **Coaches CANNOT delete** |

**Visibility Rules**:

- **Public events** → Visible to everyone
- **Private events** → Visible to system admin + org members
- **No organization** → Visible to everyone (global events)

**Implementation**: `src/lib/authorization/helpers/event-authorization.ts`

---

### Groups

| Operation  | Roles                             | Organization Check                         | Notes                        |
| ---------- | --------------------------------- | ------------------------------------------ | ---------------------------- |
| **Create** | System admin, Admin, Owner, Coach | Must have active org (unless system admin) | Inherits from parent event   |
| **Read**   | Inherits from parent event        | N/A                                        | Check event visibility first |
| **Update** | System admin, Admin, Owner, Coach | Via parent event org                       | Coaches CAN update           |
| **Delete** | System admin, Admin, Owner        | Via parent event org                       | **Coaches CANNOT delete**    |

**Implementation**: `src/lib/authorization/helpers/group-authorization.ts`

---

### Registrations

| Operation  | Roles                             | Organization Check   | Notes                                 |
| ---------- | --------------------------------- | -------------------- | ------------------------------------- |
| **Create** | System admin, Admin, Owner, Coach | Via parent event org | Coaches CAN create                    |
| **Read**   | Inherits from parent event        | N/A                  | Public if event is public             |
| **Update** | System admin, Admin, Owner, Coach | Via parent event org | Coaches CAN update                    |
| **Delete** | System admin, Admin, Owner, Coach | Via parent event org | **Coaches CAN delete** (special case) |

**Special Note**: Registrations are the only entity where coaches have delete permissions.

**Implementation**: `src/lib/authorization/helpers/registration-authorization.ts`

---

### Matches

| Operation  | Roles                             | Organization Check   | Notes                      |
| ---------- | --------------------------------- | -------------------- | -------------------------- |
| **Create** | System admin, Admin, Owner, Coach | Via parent event org | Coaches CAN create         |
| **Read**   | Inherits from parent event        | N/A                  | Public if event is public  |
| **Update** | System admin, Admin, Owner, Coach | Via parent event org | Coaches CAN update         |
| **Delete** | System admin, Admin, Owner, Coach | Via parent event org | Coaches CAN delete matches |

**Implementation**: `src/lib/authorization/helpers/match-authorization.ts`

---

### Sets

| Operation  | Roles                             | Organization Check   | Notes                          |
| ---------- | --------------------------------- | -------------------- | ------------------------------ |
| **Create** | System admin, Admin, Owner, Coach | Via parent event org | Part of match scoring          |
| **Update** | System admin, Admin, Owner, Coach | Via parent event org | Sequential validation required |
| **Delete** | System admin, Admin, Owner, Coach | Via parent event org | Coaches CAN delete sets        |

**Implementation**: `src/lib/authorization/helpers/set-authorization.ts`

---

### Tests (Skill Assessments)

| Operation  | Roles                                            | Organization Check                         | Notes                     |
| ---------- | ------------------------------------------------ | ------------------------------------------ | ------------------------- |
| **Create** | System admin, Admin, Owner, Coach                | Must have active org (unless system admin) | Coaches CAN create        |
| **Read**   | Public for public tests, Org members for private | See visibility rules                       | Similar to events         |
| **Update** | System admin, Admin, Owner, Coach                | Must be from user's org                    | Coaches CAN update        |
| **Delete** | System admin, Admin, Owner                       | Must be from user's org                    | **Coaches CANNOT delete** |

**Implementation**: `src/lib/authorization/helpers/test-authorization.ts`

---

### Test Results

| Operation  | Roles                             | Organization Check  | Notes                      |
| ---------- | --------------------------------- | ------------------- | -------------------------- |
| **Create** | System admin, Admin, Owner, Coach | Via parent test org | Coaches CAN create results |
| **Read**   | Inherits from parent test         | N/A                 | Public if test is public   |
| **Update** | System admin, Admin, Owner, Coach | Via parent test org | Coaches CAN update results |
| **Delete** | System admin, Admin, Owner        | Via parent test org | **Coaches CANNOT delete**  |

**Implementation**: `src/lib/authorization/helpers/result-authorization.ts`

---

### Training Sessions

| Operation  | Roles                             | Organization Check                         | Notes                     |
| ---------- | --------------------------------- | ------------------------------------------ | ------------------------- |
| **Create** | System admin, Admin, Owner, Coach | Must have active org (unless system admin) | Coaches CAN create        |
| **Read**   | Authenticated users               | N/A                                        | Requires authentication   |
| **Update** | System admin, Admin, Owner, Coach | Must be from user's org                    | Coaches CAN update        |
| **Delete** | System admin, Admin, Owner        | Must be from user's org                    | **Coaches CANNOT delete** |

**Implementation**: `src/lib/authorization/helpers/training-session-authorization.ts`

---

### Championships

| Operation  | Roles                          | Organization Check             | Notes                     |
| ---------- | ------------------------------ | ------------------------------ | ------------------------- |
| **Create** | System admin, Federation admin | N/A                            | Federation-level entity   |
| **Read**   | Public                         | N/A                            | All championships visible |
| **Update** | System admin, Federation admin | Must be from user's federation | Federation-based check    |
| **Delete** | System admin, Federation admin | Must be from user's federation | Federation-based check    |

**Implementation**: `src/lib/authorization/helpers/championship-authorization.ts`

---

### Federations

| Operation  | Roles                          | Organization Check        | Notes                                |
| ---------- | ------------------------------ | ------------------------- | ------------------------------------ |
| **Create** | System admin only              | N/A                       | Restricted to system admins          |
| **Read**   | Public                         | N/A                       | All federations visible              |
| **Update** | System admin, Federation admin | Must be user's federation | Federation admins can edit their own |
| **Delete** | System admin only              | N/A                       | Restricted to system admins          |

**Implementation**: `src/lib/authorization/helpers/federation-authorization.ts`

---

### Organizations

| Operation  | Roles                      | Organization Check | Notes                                        |
| ---------- | -------------------------- | ------------------ | -------------------------------------------- |
| **Create** | Authenticated users        | N/A                | Any authenticated user can create            |
| **Read**   | Public                     | N/A                | All organizations visible                    |
| **Update** | System admin, Owner, Admin | Must be user's org | Owners and admins only                       |
| **Delete** | System admin, Owner        | Must be user's org | Only owners can delete (except system admin) |

**Implementation**: `src/lib/authorization/helpers/organization-authorization.ts`

---

### Users

| Operation  | Roles                     | Organization Check                | Notes                                      |
| ---------- | ------------------------- | --------------------------------- | ------------------------------------------ |
| **Create** | System admin only         | N/A                               | User creation via better-auth registration |
| **Read**   | Authenticated users       | N/A                               | All authenticated users can view profiles  |
| **Update** | System admin, Self        | N/A                               | Users can edit their own profile           |
| **Delete** | System admin only         | N/A                               | Restricted to system admins                |
| **List**   | System admin, Org members | Must have active org (non-admins) | Special list permission                    |

**Implementation**: `src/lib/authorization/helpers/user-authorization.ts`

---

## Authorization Patterns

### Pattern 1: Standard CRUD with Coach Access

Used by: Events, Registrations, Matches, Sets, Tests, Training Sessions

```typescript
Create: System admin OR (Admin OR Owner OR Coach) with active org
Read: Public or visibility-based
Update: System admin OR (Admin OR Owner OR Coach) from same org
Delete: System admin OR (Admin OR Owner) from same org
```

**Key**: Coaches can create/update but **cannot delete**.

---

### Pattern 2: Admin-Only CRUD

Used by: Coaches, Organizations (delete)

```typescript
Create: System admin OR (Admin OR Owner) with active org
Read: Authenticated or Public
Update: System admin OR (Admin OR Owner) from same org
Delete: System admin OR (Admin OR Owner) from same org
```

**Key**: Coaches have **no creation/modification** permissions.

---

### Pattern 3: Visibility-Based Read

Used by: Events, Tests

```typescript
Read Logic:
- System admin: ALL resources
- Public visibility: ALL users
- Private visibility: Org members only
- No organization: ALL users (global resources)
```

**Key**: Organization ownership + visibility flag determine access.

---

### Pattern 4: Special Delete Rules

Used by: Registrations (coaches CAN delete)

```typescript
Delete: System admin OR (Admin OR Owner OR Coach) from same org
```

**Key**: Registrations are the exception where coaches have delete access.

---

## Special Cases

### 1. Player Notes Authorization

- **Read**: Only org members with coach+ permissions can read notes
- **Update**: Only note creator or system admin (no org ownership)
- **Delete**: Note creator, org admins, or system admin

### 2. User List Permission

- **System admins**: Can list all users
- **Org members**: Can list users only if they have an active organization
- **Non-authenticated**: Cannot list users

### 3. Global Resources (No Organization)

System admins can create resources without an organization:

- Players without org = Global players
- Events without org = Global events
- Tests without org = Global tests

### 4. Federation-Based Authorization

Championships and Federations use `federationId` instead of `organizationId`:

- Federation admins can manage their federation's championships
- System admins have full access

---

## Implementation Notes

### Backend Authorization

All authorization helpers follow this pattern:

```typescript
export function checkEntityActionAuthorization(
  context: OrganizationContext,
  resource?: ResourceType
): AuthorizationResult {
  // 1. Check authentication (if required)
  const authCheck = requireAuthentication(context)
  if (authCheck) return authCheck

  // 2. Check role permissions
  if (!hasRequiredPermissions(context)) {
    return forbiddenResponse('Insufficient permissions')
  }

  // 3. Check organization ownership (if applicable)
  if (!isSystemAdmin(context)) {
    const orgCheck = requireOrganization(context)
    if (orgCheck) return orgCheck

    const ownershipCheck = checkOrganizationAccess(
      context,
      resource.organizationId
    )
    if (ownershipCheck) return ownershipCheck
  }

  return null
}
```

### Frontend Permission Hooks

All permission hooks follow this pattern:

```typescript
export const useEntityPermissions = (resource?: Entity) => {
  const { context } = useOrganizationContext()

  return useMemo(() => ({
    canCreate: /* role + org check */,
    canRead: /* visibility + org check */,
    canUpdate: /* role + org ownership check */,
    canDelete: /* admin role + org ownership check */,
  }), [resource, context])
}
```

---

## Quick Reference: Can Coaches Delete?

| Entity            | Coaches Can Delete? |
| ----------------- | ------------------- |
| Players           | ❌ No               |
| Player Notes      | ✅ Yes (if creator) |
| Coaches           | ❌ No               |
| Events            | ❌ No               |
| Groups            | ❌ No               |
| **Registrations** | **✅ Yes**          |
| Matches           | ✅ Yes              |
| Sets              | ✅ Yes              |
| Tests             | ❌ No               |
| Test Results      | ❌ No               |
| Training Sessions | ❌ No               |
| Championships     | ❌ No               |
| Federations       | ❌ No               |
| Organizations     | ❌ No               |
| Users             | ❌ No               |

**Rule of Thumb**: Coaches can delete **match-related entities** (registrations, matches, sets) and **their own notes**, but cannot delete **master data** (players, coaches, events, tests, training sessions).

---

## Testing Authorization

When testing authorization:

1. **Test all roles**: super_admin, owner, admin, coach, player, member, unauthenticated
2. **Test organization boundaries**: Cross-org access should be blocked (except system admin)
3. **Test visibility**: Public vs private resources
4. **Test special cases**: Note creators, self-profile edits, etc.
5. **Test edge cases**: Null organizations, deleted orgs, inactive users

---

## Frontend Hook Usage

### Specialized Authorization Hooks

For page components, use specialized hooks instead of directly accessing `useOrganizationContext`:

**For Role Checks:**

```typescript
import { useRoles } from '@/hooks/authorization/use-roles'

const MyPage = () => {
  const { isSystemAdmin, isFederationAdmin, isAdmin, isLoading } = useRoles()
  // Use role flags
}
```

**For Organization Data:**

```typescript
import { useOrganization } from '@/hooks/authorization/use-organization'

const MyPage = () => {
  const { organization, organizationId, isOwner, isAdmin, isLoading } =
    useOrganization()
  // Use organization data
}
```

**For Federation Data:**

```typescript
import { useFederation } from '@/hooks/authorization/use-federation'

const MyPage = () => {
  const { federationId, isFederationAdmin, isSystemAdmin, isLoading } =
    useFederation()
  // Use federation data
}
```

**For Entity-Specific Permissions:**

```typescript
import { usePlayerPermissions } from '@/hooks/authorization/use-player-permissions'

const MyPage = () => {
  const { canCreate, canEdit, canDelete } = usePlayerPermissions(player)
  // Use permission flags
}
```

**Note**: Entity permission hooks (e.g., `usePlayerPermissions`) internally use `useOrganizationContext` - this is correct. Page components should use the specialized hooks above.

---

## References

- Backend helpers: `src/lib/authorization/helpers/`
- Frontend hooks: `src/hooks/authorization/`
- Type definitions: `src/lib/authorization/types.ts`
- Organization context: `src/lib/organization-helpers.ts`
