# API Error Handling Update Guide

## Summary

This guide documents the systematic update of all API routes in `src/app/api/v1/` to use the centralized `handleApiError` utility instead of console.error + generic error responses.

## Completed Files

### Already Updated (before this task):
- ✅ src/app/api/v1/coaches/route.ts
- ✅ src/app/api/v1/events/route.ts
- ✅ src/app/api/v1/tests/route.ts
- ✅ src/app/api/v1/training-sessions/route.ts
- ✅ src/app/api/v1/players/route.ts

### Updated in This Task:
- ✅ src/app/api/v1/training-sessions/[id]/attendance/[playerId]/route.ts (GET, PATCH, DELETE)
- ✅ src/app/api/v1/training-sessions/[id]/attendance/route.ts (GET, POST)
- ✅ src/app/api/v1/training-sessions/[id]/attendance/bulk/route.ts (PATCH, DELETE)
- ✅ src/app/api/v1/players/[id]/matches/route.ts (GET)
- ✅ src/app/api/v1/championships/[id]/route.ts (GET, PATCH, DELETE)
- ✅ src/app/api/v1/championships/route.ts (GET, POST)
- ✅ src/app/api/v1/coaches/[id]/route.ts (GET, PATCH, DELETE)
- ✅ src/app/api/v1/events/[id]/route.ts (GET, PATCH, DELETE)
- ✅ src/app/api/v1/events/[id]/generate-bracket/route.ts (POST)
- ✅ src/app/api/v1/events/[id]/reset-bracket/route.ts (POST)
- ✅ src/app/api/v1/events/[id]/reset-heats/route.ts (POST)
- ✅ src/app/api/v1/events/[id]/generate-heats/route.ts (POST)
- ✅ src/app/api/v1/federations/route.ts (GET, POST)
- ✅ src/app/api/v1/federations/[id]/route.ts (GET, PATCH, DELETE)

## Remaining Files to Update

The following files still contain `console.error` and need to be updated:

1. src/app/api/v1/groups/route.ts
2. src/app/api/v1/groups/[id]/route.ts
3. src/app/api/v1/matches/route.ts
4. src/app/api/v1/matches/[id]/route.ts
5. src/app/api/v1/organizations/route.ts
6. src/app/api/v1/organizations/[id]/members/route.ts
7. src/app/api/v1/players/[id]/notes/route.ts
8. src/app/api/v1/players/[id]/notes/[noteId]/route.ts
9. src/app/api/v1/players/[id]/route.ts
10. src/app/api/v1/registrations/route.ts
11. src/app/api/v1/registrations/[id]/route.ts
12. src/app/api/v1/registrations/[id]/scores/route.ts
13. src/app/api/v1/results/route.ts
14. src/app/api/v1/results/[id]/route.ts
15. src/app/api/v1/sets/route.ts
16. src/app/api/v1/sets/[id]/route.ts
17. src/app/api/v1/sets/[id]/played/route.ts
18. src/app/api/v1/tests/[id]/route.ts
19. src/app/api/v1/training-sessions/[id]/route.ts
20. src/app/api/v1/users/route.ts
21. src/app/api/v1/users/[id]/route.ts
22. src/app/api/v1/users/me/route.ts
23. src/app/api/v1/users/me/coach/route.ts
24. src/app/api/v1/users/me/image/route.ts
25. src/app/api/v1/users/me/memberships/route.ts
26. src/app/api/v1/users/me/organization-context/route.ts
27. src/app/api/v1/users/me/player/route.ts
28. src/app/api/v1/attendance/club/route.ts
29. src/app/api/v1/players/me/attendance/route.ts

Note: Some files like src/app/api/v1/coaches/[id]/route.ts may still show console.error due to email logging (which is acceptable), but the main error handling has been updated.

## Update Pattern

For each remaining file, follow these steps:

### Step 1: Add Import
Add this import at the top of the file (after other imports):
```typescript
import { handleApiError } from '@/lib/api-error-handler'
```

### Step 2: Replace Catch Blocks
Replace all catch blocks that look like:
```typescript
} catch (error) {
  console.error('Error ...:', error)
  return Response.json({ message: 'Internal server error' }, { status: 500 })
}
```

With:
```typescript
} catch (error) {
  return handleApiError(error, {
    endpoint: '/api/v1/[entity]/[action]',  // Use actual endpoint path
    method: 'GET|POST|PUT|PATCH|DELETE',    // Use actual HTTP method
    userId: context.userId,                  // If context is available
    organizationId: context.organization?.id, // If context is available
  })
}
```

### Step 3: Context Considerations
- If `context` is available in the function scope (from `await getOrganizationContext()`), include `userId` and `organizationId` in the error handler
- If no auth is required (like public GET endpoints), you can omit `userId` and `organizationId`:
  ```typescript
  return handleApiError(error, {
    endpoint: '/api/v1/[entity]',
    method: 'GET',
  })
  ```
- If context is NOT in scope but auth is used, you may need to call `getOrganizationContext()` in the catch block

## Examples by HTTP Method

### GET (with auth)
```typescript
export async function GET(request: NextRequest) {
  const context = await getOrganizationContext()
  // ... auth checks ...

  try {
    // ... query logic ...
    return Response.json(data)
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

### GET (public, no auth)
```typescript
export async function GET(request: NextRequest) {
  try {
    // ... query logic ...
    return Response.json(data)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/entity',
      method: 'GET',
    })
  }
}
```

### POST (with auth)
```typescript
export async function POST(request: NextRequest) {
  const context = await getOrganizationContext()
  // ... auth checks ...

  try {
    const body = await request.json()
    // ... creation logic ...
    return Response.json(result, { status: 201 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/entity',
      method: 'POST',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
```

### PATCH (with auth)
```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params

  try {
    const body = await request.json()
    // ... existing record check ...
    const context = await getOrganizationContext()
    // ... auth checks ...
    // ... update logic ...
    return Response.json(result)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/entity/[id]',
      method: 'PATCH',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
```

### DELETE (with auth)
```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params

  try {
    // ... existing record check ...
    const context = await getOrganizationContext()
    // ... auth checks ...
    // ... delete logic ...
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/v1/entity/[id]',
      method: 'DELETE',
      userId: context.userId,
      organizationId: context.organization?.id,
    })
  }
}
```

## Quick Reference: Endpoint Paths

Use these exact paths for the `endpoint` parameter:

- `/api/v1/groups` (GET, POST)
- `/api/v1/groups/[id]` (GET, PATCH, DELETE)
- `/api/v1/matches` (GET, POST)
- `/api/v1/matches/[id]` (GET, PATCH, DELETE)
- `/api/v1/organizations` (GET, POST)
- `/api/v1/organizations/[id]/members` (GET, POST)
- `/api/v1/players/[id]/notes` (GET, POST)
- `/api/v1/players/[id]/notes/[noteId]` (GET, PATCH, DELETE)
- `/api/v1/players/[id]` (GET, PATCH, DELETE)
- `/api/v1/registrations` (GET, POST)
- `/api/v1/registrations/[id]` (GET, PATCH, DELETE)
- `/api/v1/registrations/[id]/scores` (PATCH)
- `/api/v1/results` (GET, POST)
- `/api/v1/results/[id]` (GET, PATCH, DELETE)
- `/api/v1/sets` (GET, POST)
- `/api/v1/sets/[id]` (GET, PATCH, DELETE)
- `/api/v1/sets/[id]/played` (PATCH)
- `/api/v1/tests/[id]` (GET, PATCH, DELETE)
- `/api/v1/training-sessions/[id]` (GET, PATCH, DELETE)
- `/api/v1/users` (GET, POST)
- `/api/v1/users/[id]` (GET, PATCH, DELETE)
- `/api/v1/users/me` (GET, PATCH)
- `/api/v1/users/me/coach` (GET)
- `/api/v1/users/me/image` (POST)
- `/api/v1/users/me/memberships` (GET)
- `/api/v1/users/me/organization-context` (GET)
- `/api/v1/users/me/player` (GET)
- `/api/v1/attendance/club` (GET)
- `/api/v1/players/me/attendance` (GET)

## Notes

- Always use the correct HTTP method for each handler
- Keep `console.error` statements that are used for email sending errors or other non-request-related logging
- The handleApiError utility will automatically log the error, format it properly, and return the appropriate response
- Make sure the context variable is available in scope when including userId/organizationId

## Verification

After updating each file:
1. Check that the import is added
2. Verify all catch blocks have been updated
3. Ensure the endpoint path and method are correct
4. Confirm userId and organizationId are included when context is available
