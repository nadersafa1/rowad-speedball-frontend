# Component Standards

**Last Updated**: January 2026

This guide establishes standards for React component organization, file structure, naming conventions, and patterns in the Rowad Speedball platform.

## Table of Contents
- [Component Organization](#component-organization)
- [Component File Structure](#component-file-structure)
- [Component Naming](#component-naming)
- [Component Patterns](#component-patterns)
- [Props Patterns](#props-patterns)
- [Reusability Guidelines](#reusability-guidelines)
- [Import/Export Patterns](#importexport-patterns)

---

## Component Organization

### Directory Structure

```
src/components/
├── ui/                      # Radix UI primitives + custom UI components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── card.tsx
│   └── ... (45+ components)
├── forms/                   # Reusable form components
│   ├── loading-button.tsx
│   ├── form-error.tsx
│   └── character-counter.tsx
├── shared/                  # Shared feature components
│   ├── header.tsx
│   └── ...
└── [feature]/              # Feature-specific components
    ├── players/
    │   ├── player-form.tsx
    │   ├── player-card.tsx
    │   └── date-of-birth-picker.tsx
    ├── coaches/
    │   ├── coach-form.tsx
    │   └── coach-card.tsx
    └── events/
        ├── event-form.tsx
        └── event-card.tsx
```

### When to Place Components

**`src/components/ui/`** - UI Primitives:
- Radix UI component wrappers
- Basic UI elements (buttons, inputs, cards)
- Generic, reusable across entire app
- No business logic
- Examples: `button.tsx`, `dialog.tsx`, `card.tsx`

**`src/components/forms/`** - Form-Specific Components:
- Form field components
- Form utilities (LoadingButton, FormError)
- Validation displays
- Character counters
- Examples: `loading-button.tsx`, `form-error.tsx`

**`src/components/shared/`** - Shared Feature Components:
- Reusable across multiple features
- Contains some business logic
- Not tied to a specific entity
- Examples: `header.tsx`, `stats-card.tsx`

**`src/components/[feature]/`** - Feature-Specific:
- Tied to a specific domain entity (players, coaches, events)
- Contains feature-specific business logic
- May use API calls, stores, or hooks
- Examples: `player-form.tsx`, `event-card.tsx`

### Decision Tree: Where Does This Component Go?

```
Is it a Radix UI wrapper or basic UI element?
  └─ Yes → ui/

Does it relate specifically to forms?
  └─ Yes → forms/

Is it tied to a specific entity (player, coach, event)?
  └─ Yes → [feature]/

Is it reusable across multiple features?
  └─ Yes → shared/
```

---

## Component File Structure

### Standard Component Structure

```typescript
'use client' // Only if component uses client-side features

// 1. External imports (React, third-party libs)
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 2. Internal UI component imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem } from '@/components/ui/form'

// 3. Feature component imports
import { LoadingButton } from '@/components/forms/loading-button'

// 4. Store/hook imports
import { usePlayersStore } from '@/store/players-store'
import { usePlayerPermissions } from '@/hooks/authorization/use-player-permissions'

// 5. Type imports
import type { Player } from '@/types'

// 6. Utility imports
import { formatDate } from '@/lib/utils'

// 7. Constants
const MAX_NAME_LENGTH = 255

// 8. Type/Interface definitions
interface ComponentProps {
  player?: Player
  onSuccess?: () => void
  onCancel?: () => void
}

// 9. Validation schemas (if applicable)
const schema = z.object({
  name: z.string().min(1),
})

// 10. Component definition
export const ComponentName = ({ player, onSuccess }: ComponentProps) => {
  // Component implementation
}

// 11. Named exports only (no default export)
```

**Reference**: `src/components/players/player-form.tsx:1-50`

### Import Organization Rules

1. **External imports first** (React, third-party libraries)
2. **UI components** (`@/components/ui`)
3. **Feature components** (`@/components/[feature]`, `@/components/forms`)
4. **Stores and hooks** (`@/store`, `@/hooks`)
5. **Types** (`@/types`, type imports)
6. **Utilities** (`@/lib`)

**Group related imports together**:
```typescript
// ✅ Good: Grouped by source
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

// ❌ Bad: Scattered
import { Button } from '@/components/ui/button'
import { usePlayersStore } from '@/store/players-store'
import { Input } from '@/components/ui/input'
```

### Single Responsibility Principle

**Each component file should have ONE primary component**:

```typescript
// ✅ Good: player-form.tsx
export const PlayerForm = ({ ... }) => { ... }

// ❌ Bad: players.tsx with multiple components
export const PlayerForm = ({ ... }) => { ... }
export const PlayerCard = ({ ... }) => { ... }
export const PlayerList = ({ ... }) => { ... }
```

**Helper components** can be in the same file if:
- They're only used by the primary component
- They're small (< 20 lines)
- They're not reusable elsewhere

```typescript
// Helper component (not exported)
const PlayerCardHeader = ({ name }: { name: string }) => (
  <div className="font-semibold">{name}</div>
)

// Main component (exported)
export const PlayerCard = ({ player }: PlayerCardProps) => (
  <Card>
    <PlayerCardHeader name={player.name} />
    {/* ... */}
  </Card>
)
```

---

## Component Naming

**For comprehensive naming conventions, see [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md).**

### Quick Reference

- **File names**: `kebab-case.tsx` (e.g., `player-form.tsx`)
- **Component names**: `PascalCase` (e.g., `PlayerForm`)
- **Naming patterns**: `[Entity]Form`, `[Entity]Card`, `[Entity]Dialog`, etc.

### Component Type Patterns

- **Forms**: `PlayerForm`, `CoachForm`, `EventForm`
- **Dialogs**: `PlayerCreateDialog`, `DeleteConfirmDialog`
- **Cards**: `PlayerCard`, `EventCard`, `StatsCard`
- **Tables/Lists**: `PlayersTable`, `EventList`
- **Pickers**: `DateOfBirthPicker`, `CoachSelector`
- **Stats**: `PlayersStats`, `EventStats`

---

## Component Patterns

### Form Component Pattern

**Standard Structure**:
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/forms/loading-button'
import { FormError } from '@/components/forms/form-error'
import { useEntityStore } from '@/store/entity-store'
import { nameSchema, emailSchema } from '@/lib/forms/patterns'

const schema = z.object({
  name: nameSchema,
  email: emailSchema,
})

type FormData = z.infer<typeof schema>

interface EntityFormProps {
  entity?: Entity  // Optional for edit mode
  onSuccess?: () => void
  onCancel?: () => void
}

export const EntityForm = ({ entity, onSuccess, onCancel }: EntityFormProps) => {
  const { createEntity, updateEntity, error, clearError } = useEntityStore()
  const [formError, setFormError] = useState<string | null>(null)
  const isEditing = !!entity

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: entity?.name || '',
      email: entity?.email || '',
    },
  })

  const onSubmit = async (data: FormData) => {
    clearError()
    setFormError(null)

    try {
      if (isEditing) {
        await updateEntity(entity.id, data)
      } else {
        await createEntity(data)
      }
      onSuccess?.()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormError error={formError || error} />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <LoadingButton
            type="submit"
            isLoading={form.formState.isSubmitting}
            loadingText={isEditing ? 'Updating...' : 'Creating...'}
          >
            {isEditing ? 'Update' : 'Create'}
          </LoadingButton>
        </div>
      </form>
    </Form>
  )
}
```

**Reference**: `src/components/players/player-form.tsx`

### Dialog Component Pattern

**Wrapped in Dialog (Standard)**:
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export const EntityFormDialog = ({ open, onOpenChange }: DialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Open Form</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Entity</DialogTitle>
          <DialogDescription>
            Fill in the details below
          </DialogDescription>
        </DialogHeader>
        <EntityForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
```

**Form Component Only (More Flexible)**:
```typescript
// Component just renders form, dialog managed by parent
export const EntityForm = ({ onSuccess }: EntityFormProps) => {
  return (
    <Form {...form}>
      {/* form content */}
    </Form>
  )
}

// Parent manages dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Entity</DialogTitle>
    </DialogHeader>
    <EntityForm onSuccess={() => setOpen(false)} />
  </DialogContent>
</Dialog>
```

**Prefer the second approach** for more flexibility.

### Card Component Pattern

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EntityCardProps {
  entity: Entity
  onClick?: () => void
}

export const EntityCard = ({ entity, onClick }: EntityCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{entity.name}</CardTitle>
          <Badge variant="outline">{entity.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {entity.description}
        </p>
      </CardContent>
    </Card>
  )
}
```

### Table Component Pattern

**Use table-core system** for new tables:
```typescript
// No component needed, just config
// See: src/config/tables/playersTableConfig.ts
```

**Legacy table pattern** (being phased out):
```typescript
// Multiple files per table (avoid for new tables):
// - [entity]-table.tsx
// - [entity]-columns.tsx
// - [entity]-controls.tsx
// - [entity]-handlers.tsx
// etc.
```

---

## Props Patterns

### Props Interface Definition

**Always use `interface` for props** (not `type`):

```typescript
// ✅ Good
interface PlayerFormProps {
  player?: Player
  onSuccess?: () => void
  onCancel?: () => void
}

// ❌ Bad
type PlayerFormProps = {
  player?: Player
  onSuccess?: () => void
  onCancel?: () => void
}
```

**Why?** Interfaces are more performant and provide better error messages.

### Props Organization

**Order**: Required first, optional last

```typescript
interface ComponentProps {
  // Required props
  id: string
  name: string

  // Optional data props
  player?: Player
  options?: Option[]

  // Optional callbacks
  onSuccess?: () => void
  onCancel?: () => void
  onChange?: (value: string) => void

  // Optional styling
  className?: string
}
```

### Callback Naming

**Pattern**: `on[EventName]`

```typescript
interface ComponentProps {
  onSave?: () => void
  onDelete?: () => void
  onChange?: (value: string) => void
  onPlayerSelect?: (player: Player) => void
  onSuccess?: () => void
  onCancel?: () => void
}

// ❌ Bad
interface ComponentProps {
  saveHandler?: () => void
  handleDelete?: () => void
  playerSelected?: (player: Player) => void
}
```

### Data Props: Pass Objects, Not Individual Fields

```typescript
// ✅ Good: Pass entire object
interface PlayerCardProps {
  player: Player
}

const PlayerCard = ({ player }: PlayerCardProps) => (
  <Card>
    <p>{player.name}</p>
    <p>{player.age}</p>
  </Card>
)

// ❌ Bad: Individual fields
interface PlayerCardProps {
  name: string
  age: number
  gender: string
  dateOfBirth: string
  // ... many more fields
}
```

**Exception**: When component is generic and reusable:
```typescript
// ✅ Acceptable for generic components
interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
}
```

### Children Pattern

**For composition**:
```typescript
interface CardProps {
  title: string
  children: React.ReactNode
}

export const Card = ({ title, children }: CardProps) => (
  <div>
    <h3>{title}</h3>
    {children}
  </div>
)

// Usage
<Card title="Player Details">
  <PlayerInfo player={player} />
  <PlayerStats player={player} />
</Card>
```

### Optional vs Required Props

**Make props optional when they have reasonable defaults**:
```typescript
interface ButtonProps {
  children: React.ReactNode  // Required
  variant?: 'primary' | 'secondary'  // Optional (defaults to 'primary')
  size?: 'sm' | 'md' | 'lg'  // Optional (defaults to 'md')
  onClick?: () => void  // Optional
}
```

**Make props required when they're essential**:
```typescript
interface PlayerFormProps {
  onSuccess: () => void  // Required - must handle success
  player?: Player  // Optional - only for edit mode
}
```

---

## Reusability Guidelines

### When to Create a Shared Component

**Create shared component if**:
1. Used in 3+ places
2. Contains complex logic worth abstracting
3. Enforces a standard pattern (FormError, LoadingButton)

**Keep feature-specific if**:
1. Only used in one feature
2. Contains feature-specific business logic
3. Unlikely to be reused

### Avoiding Premature Abstraction

```typescript
// ❌ Bad: Premature abstraction
// Created after seeing similar code twice
const GenericDataDisplayer = ({ data, config, options, handlers }) => {
  // 200 lines of complex abstraction logic
}

// ✅ Good: Wait for clear pattern
// Player-specific component (used once)
const PlayerDisplay = ({ player }) => {
  return <div>{player.name}</div>
}

// After seeing this pattern 3+ times in different features:
// THEN consider abstracting
```

**Rule**: Three strikes and you refactor. Not before.

### Props vs Composition for Flexibility

**Use props** for simple variations:
```typescript
<Button variant="primary" size="lg">
  Click Me
</Button>
```

**Use composition** for complex content:
```typescript
// ✅ Good: Composition
<Dialog>
  <DialogHeader>
    <DialogTitle>Custom Title</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <CustomForm />
  </DialogContent>
</Dialog>

// ❌ Bad: Props
<Dialog
  title="Custom Title"
  content={<CustomForm />}
  headerActions={<Button>Action</Button>}
  footerActions={<Button>Close</Button>}
/>
```

---

## Import/Export Patterns

### Named Exports Only

**Always use named exports** (no default exports):

```typescript
// ✅ Good
export const PlayerForm = ({ ... }) => { ... }

// ❌ Bad
const PlayerForm = ({ ... }) => { ... }
export default PlayerForm
```

**Why?**
- Better for refactoring (IDE can rename everywhere)
- Clear what's being imported
- Consistent with TypeScript best practices

### Barrel Exports

**Use barrel exports** for related components:

```typescript
// src/components/forms/index.ts
export { LoadingButton } from './loading-button'
export { FormError } from './form-error'
export { CharacterCounter } from './character-counter'

// Usage
import { LoadingButton, FormError } from '@/components/forms'
```

**Don't overuse**: Only for tightly related components in the same directory.

### Import Aliases

**Always use `@/` alias**:

```typescript
// ✅ Good
import { Button } from '@/components/ui/button'
import { usePlayersStore } from '@/store/players-store'

// ❌ Bad
import { Button } from '../../components/ui/button'
import { usePlayersStore } from '../../../store/players-store'
```

---

## Quick Reference

### Component File Template

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useEntityStore } from '@/store/entity-store'
import type { Entity } from '@/types'

interface ComponentNameProps {
  entity: Entity
  onSuccess?: () => void
}

export const ComponentName = ({ entity, onSuccess }: ComponentNameProps) => {
  const [state, setState] = useState(null)

  return (
    <div>
      {/* Component content */}
    </div>
  )
}
```

### Component Checklist

- [ ] Named export (no default export)
- [ ] Props interface with clear naming
- [ ] File name in kebab-case
- [ ] Component name in PascalCase
- [ ] Single responsibility
- [ ] Imports organized by category
- [ ] Type safety (no `any` types)
- [ ] Accessible (ARIA labels where needed)

---

## Related Documentation

- **UI Component Standards**: See [`UI_COMPONENT_STANDARDS.md`](./UI_COMPONENT_STANDARDS.md) - Radix UI usage, Tailwind patterns, layout
- **Forms Guide**: See [`FORMS_GUIDE.md`](./FORMS_GUIDE.md) - Form development patterns
- **State Management**: See [`STATE_MANAGEMENT_STANDARDS.md`](./STATE_MANAGEMENT_STANDARDS.md) - Zustand store patterns
- **Naming Conventions**: See [`NAMING_CONVENTIONS.md`](./NAMING_CONVENTIONS.md) - Comprehensive naming standards

---

## Reference Implementations

**Form Component**: `src/components/players/player-form.tsx`
**Card Component**: `src/components/players/player-card.tsx`
**Reusable Form Components**: `src/components/forms/`
**UI Primitives**: `src/components/ui/`
**Shared Components**: `src/components/shared/`
