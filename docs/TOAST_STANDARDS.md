# Toast Notification Standards

## Overview

This document defines the standards for using toast notifications in the Rowad Speedball Management Platform. All toasts use the `sonner` library and should follow consistent patterns for user feedback.

## Table of Contents

- [Library and Setup](#library-and-setup)
- [Toast Types](#toast-types)
- [Success Message Standards](#success-message-standards)
- [Error Message Standards](#error-message-standards)
- [When to Show Toasts](#when-to-show-toasts)
- [Toast Placement](#toast-placement)
- [Toast with Descriptions](#toast-with-descriptions)
- [File Locations](#file-locations)
- [Examples](#examples)
- [Related Documentation](#related-documentation)

---

## Library and Setup

**Library**: `sonner`

**Import**:
```typescript
import { toast } from 'sonner'
```

**Toaster Component**: `src/components/ui/sonner.tsx`

The toaster is already configured in the root layout and supports theme switching (light/dark mode).

---

## Toast Types

### Available Types

- **`toast.success()`** - Successful operations (create, update, delete)
- **`toast.error()`** - Errors and failures
- **`toast.warning()`** - Warnings (use sparingly)
- **`toast.info()`** - Informational messages (use sparingly)

**Default Usage**: Use `success` and `error` for most cases. Use `warning` and `info` only when necessary.

---

## Success Message Standards

### Format

**Standard Format**: `'[Entity] [action] successfully'`

### Examples

```typescript
// ✅ Good - Specific and clear
toast.success('Player created successfully')
toast.success('Note updated successfully')
toast.success('Set deleted successfully')
toast.success('Club created successfully')
toast.success('Coach profile updated successfully')

// ❌ Bad - Too generic
toast.success('Created successfully')
toast.success('Updated successfully')
toast.success('User deleted')
toast.success('Set updated')
```

### Entity Naming

- Use consistent entity names matching UI terminology:
  - `'Club'` (not `'Organization'` - matches UI)
  - `'Player'`
  - `'Coach'`
  - `'Event'`
  - `'Note'`
  - `'Set'`
  - `'Championship'`
  - `'Federation'`
  - `'Season'`
  - `'Test'`
  - `'User'`

- For profiles, be specific:
  - ✅ `'Player profile updated successfully'`
  - ✅ `'Coach profile updated successfully'`
  - ❌ `'Profile updated successfully'` (too generic)

### Special Cases

**Bulk Operations**:
```typescript
toast.success(`Successfully submitted ${count} registration(s) for approval`)
```

**With Context** (use description):
```typescript
toast.success('Email update pending', {
  description: 'Please check your email for a verification link',
})
```

**Short Actions** (acceptable for simple updates):
```typescript
toast.success('Match date updated')
toast.success('Scores updated successfully')
```

**Note**: Even for short actions, prefer including "successfully" when possible for consistency.

---

## Error Message Standards

### Standard Pattern

**Always use this pattern**:
```typescript
toast.error(
  error instanceof Error ? error.message : 'Failed to [action] [entity]'
)
```

### Examples

```typescript
// ✅ Good - Consistent pattern
try {
  await createPlayer(data)
  toast.success('Player created successfully')
} catch (error) {
  toast.error(
    error instanceof Error ? error.message : 'Failed to create player'
  )
}

// ✅ Good - With API response error
try {
  const res = await apiClient.createClub(data)
  if (res.error) {
    toast.error(
      res.error instanceof Error
        ? res.error.message
        : 'Failed to create club'
    )
    return
  }
  toast.success('Club created successfully')
} catch (error) {
  toast.error(
    error instanceof Error ? error.message : 'Failed to create club'
  )
}

// ❌ Bad - Inconsistent patterns
toast.error(error.message || 'Failed to create player')
toast.error(res.error.message || 'Failed to create club')
toast.error(data.message ?? 'Error')
toast.error('Error')
```

### Error Message Guidelines

1. **Always check `error instanceof Error`** before accessing `.message`
   - Prevents runtime errors if error is not an Error instance
   - Handles cases where error might be a string or other type

2. **Provide specific fallback**: `'Failed to [action] [entity]'`
   - Use the action verb (create, update, delete, link, etc.)
   - Use the entity name (player, club, note, etc.)

3. **Use entity name in error message** for context
   - Helps users understand what operation failed

4. **Never use generic fallbacks** like `"Error"` or `"Something went wrong"`

### Handling Different Error Types

**Standard Error**:
```typescript
catch (error) {
  toast.error(
    error instanceof Error ? error.message : 'Failed to delete player'
  )
}
```

**API Response Error**:
```typescript
if (res.error) {
  toast.error(
    res.error instanceof Error
      ? res.error.message
      : 'Failed to create club'
  )
}
```

**Custom Error Message**:
```typescript
catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : 'Failed to update attendance status'
  toast.error(message)
}
```

---

## When to Show Toasts

### Always Show Toasts For

- **Create operations** (success toast)
- **Update operations** (success toast)
- **Delete operations** (success toast)
- **All errors** (error toast)

### Optional Toasts

- **Read operations** (usually no toast needed)
- **Navigation actions** (usually no toast needed)
- **Real-time updates** (socket events - can use toasts for important events)

### Examples

```typescript
// ✅ Good - Shows success toast
const handleCreate = async (data: FormData) => {
  try {
    await createPlayer(data)
    toast.success('Player created successfully')
    onSuccess?.()
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Failed to create player'
    )
  }
}

// ✅ Good - Shows success toast for delete
const handleDelete = async (id: string) => {
  try {
    await deletePlayer(id)
    toast.success('Player deleted successfully')
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Failed to delete player'
    )
  }
}

// ❌ Bad - Missing success toast
const handleUpdate = async (data: FormData) => {
  try {
    await updatePlayer(data)
    // Missing success toast!
    onSuccess?.()
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Failed to update player'
    )
  }
}
```

---

## Toast Placement

### In Components (Not in Stores)

**Rule**: Stores throw errors, components handle toasts.

- ✅ Show success toast after successful store operation
- ✅ Show error toast in catch block
- ❌ Never show toasts in stores (stores should throw errors)

### Pattern

```typescript
const onSubmit = async (data: FormData) => {
  try {
    // Store operation (throws error on failure)
    await createEntity(data)
    
    // Success toast in component
    toast.success('Entity created successfully')
    onSuccess?.()
  } catch (error) {
    // Error toast in component
    toast.error(
      error instanceof Error ? error.message : 'Failed to create entity'
    )
  }
}
```

### Store Pattern (No Toasts)

```typescript
// ✅ Good - Store throws error
export const useEntityStore = create<EntityStore>((set) => ({
  createEntity: async (data: EntityData) => {
    const result = await apiClient.createEntity(data)
    if (result.error) {
      throw new Error(result.error.message || 'Failed to create entity')
    }
    set((state) => ({ entities: [...state.entities, result.data] }))
  },
}))

// ❌ Bad - Store shows toast
export const useEntityStore = create<EntityStore>((set) => ({
  createEntity: async (data: EntityData) => {
    const result = await apiClient.createEntity(data)
    if (result.error) {
      toast.error('Failed to create entity') // ❌ Don't do this
      return
    }
    toast.success('Entity created successfully') // ❌ Don't do this
    set((state) => ({ entities: [...state.entities, result.data] }))
  },
}))
```

---

## Toast with Descriptions

### When to Use Descriptions

Use descriptions for complex messages that need additional context:

```typescript
toast.success('Email update pending', {
  description: 'Please check your email for a verification link',
})

toast.warning('Session expired', {
  description: 'Please sign in again to continue',
})

toast.error('Upload failed', {
  description: 'File size must be less than 5MB',
})
```

### When Not to Use Descriptions

For simple success/error messages, descriptions are usually unnecessary:

```typescript
// ✅ Good - Simple message, no description needed
toast.success('Player created successfully')

// ❌ Unnecessary - Description adds no value
toast.success('Player created successfully', {
  description: 'The player has been added to the system',
})
```

---

## File Locations

| Item | Path |
|------|------|
| **Toaster component** | `src/components/ui/sonner.tsx` |
| **Import** | `import { toast } from 'sonner'` |
| **Documentation** | `docs/TOAST_STANDARDS.md` |

---

## Examples

### Complete Form Submission Example

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/forms'
import { nameSchema, emailSchema } from '@/lib/forms/patterns'

const formSchema = z.object({
  name: nameSchema,
  email: emailSchema,
})

type FormData = z.infer<typeof formSchema>

export const PlayerForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await createPlayer(data)
      toast.success('Player created successfully')
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create player'
      )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
        <LoadingButton
          type="submit"
          loading={form.formState.isSubmitting}
        >
          Create Player
        </LoadingButton>
      </form>
    </Form>
  )
}
```

### Delete Operation Example

```typescript
const handleDelete = async (id: string) => {
  try {
    await deletePlayer(id)
    toast.success('Player deleted successfully')
    // Refresh list or navigate
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Failed to delete player'
    )
  }
}
```

### Update Operation Example

```typescript
const handleUpdate = async (id: string, data: UpdateData) => {
  try {
    await updatePlayer(id, data)
    toast.success('Player updated successfully')
    onSuccess?.()
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Failed to update player'
    )
  }
}
```

### Link/Unlink Operation Example

```typescript
const handleLink = async (playerId: string, userId: string) => {
  try {
    await linkUserToPlayer(playerId, userId)
    toast.success('User linked to player successfully')
    onSuccess?.()
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Failed to link user to player'
    )
  }
}
```

### Socket Event Example

```typescript
socket.on(SOCKET_EVENTS.MATCH_COMPLETED, (data) => {
  toast.success('Match completed!')
  handleMatchCompleted(data)
})
```

---

## Related Documentation

- **Forms Guide**: See [`FORMS_GUIDE.md`](./FORMS_GUIDE.md) - Form development patterns with toast examples
- **Component Standards**: See [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md) - Component structure and patterns
- **State Management**: See [`STATE_MANAGEMENT_STANDARDS.md`](./STATE_MANAGEMENT_STANDARDS.md) - Zustand store patterns (stores don't use toasts)
- **Implementation Standards**: See [`IMPLEMENTATION_STANDARDS.md`](./IMPLEMENTATION_STANDARDS.md) - General coding standards

---
