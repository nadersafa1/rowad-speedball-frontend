# Forms Development Guide

## Overview

This guide explains how to create, maintain, and migrate forms in the Rowad Speedball Management Platform. All forms use **React Hook Form** with **Zod** validation for type-safe, consistent form handling.

## Table of Contents

- [Quick Start](#quick-start)
- [Form Architecture](#form-architecture)
- [Creating a New Form](#creating-a-new-form)
- [Validation Patterns](#validation-patterns)
- [Form Components](#form-components)
- [Date Handling](#date-handling)
- [Common Patterns](#common-patterns)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Minimal Form Example

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/forms'
import { nameSchema, emailSchema } from '@/lib/forms/patterns'

const formSchema = z.object({
  name: nameSchema,
  email: emailSchema,
})

type FormData = z.infer<typeof formSchema>

export function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: FormData) => {
    try {
      // Your submission logic
      console.log(data)
    } catch (error) {
      console.error(error)
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

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          loadingText="Saving..."
        >
          Submit
        </LoadingButton>
      </form>
    </Form>
  )
}
```

---

## Form Architecture

### Directory Structure

```
src/
├── components/
│   ├── forms/                      # Reusable form components
│   │   ├── loading-button.tsx      # Loading state button
│   │   ├── form-error.tsx          # Form-level error display
│   │   ├── character-counter.tsx   # Text input counter
│   │   └── index.ts                # Exports
│   ├── ui/                         # Base UI components (Radix)
│   │   ├── form.tsx                # Form primitives
│   │   ├── input.tsx               # Input component
│   │   └── ...
│   └── [feature]/                  # Feature-specific forms
│       └── [entity]-form.tsx       # Entity form component
├── lib/
│   └── forms/
│       └── patterns.ts             # Shared validation schemas
├── types/
│   └── api/
│       └── [entity].schemas.ts     # API validation schemas
└── store/
    └── [entity]-store.ts           # Zustand state management
```

### Technology Stack

- **React Hook Form**: Form state management and validation
- **Zod**: Schema-based validation
- **zodResolver**: Bridge between React Hook Form and Zod
- **Radix UI**: Accessible form primitives
- **Tailwind CSS**: Styling

---

## Creating a New Form

### Step 1: Define Validation Schema

Create your schema in `src/lib/forms/patterns.ts` (for shared schemas) or inline (for form-specific schemas).

**Shared Schema Example** (add to `patterns.ts`):
```typescript
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
  .trim()
```

**Form-Specific Schema Example**:
```typescript
const myFormSchema = z.object({
  name: nameSchema,           // Use shared schema
  email: emailSchema,         // Use shared schema
  customField: z.string()     // Custom validation
    .min(1, 'Required')
    .max(100, 'Too long'),
})

type MyFormData = z.infer<typeof myFormSchema>
```

### Step 2: Setup Form Component

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const myFormSchema = z.object({
  // Your schema
})

type MyFormData = z.infer<typeof myFormSchema>

export function MyForm() {
  const form = useForm<MyFormData>({
    resolver: zodResolver(myFormSchema),
    defaultValues: {
      // Initialize all fields
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: MyFormData) => {
    // Submission logic
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### Step 3: Add Form Fields

Use the `FormField` component pattern:

```typescript
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Step 4: Add Submit Button

```typescript
<LoadingButton
  type="submit"
  isLoading={isSubmitting}
  loadingText="Saving..."
>
  Submit
</LoadingButton>
```

---

## Validation Patterns

### Available Shared Schemas

Import from `@/lib/forms/patterns`:

#### Basic Fields
```typescript
import {
  nameSchema,           // 2-255 chars
  rtlNameSchema,        // Optional RTL name
  emailSchema,          // Email validation
  descriptionSchema,    // Optional, max 1000 chars
  longTextSchema,       // Configurable max length
} from '@/lib/forms/patterns'
```

#### Password
```typescript
import {
  passwordSchema,           // Strong: 8+ chars, uppercase, lowercase, number, special
  passwordSignInSchema,     // Simple: 8+ chars (for login)
} from '@/lib/forms/patterns'
```

#### Dates
```typescript
import {
  dateOfBirthSchema,        // Must be 2+ years old, not future
  dateSchema,               // Cannot be in future
  futureDateSchema,         // Any date
  optionalDateSchema,       // Optional date
  dateStringSchema,         // API date string (YYYY-MM-DD)
  optionalDateStringSchema, // Optional API date string
} from '@/lib/forms/patterns'
```

#### Numbers
```typescript
import {
  positiveIntSchema,        // Greater than 0
  nonNegativeIntSchema,     // 0 or greater
  scoreSchema,              // Optional score (0+)
} from '@/lib/forms/patterns'

// Usage:
const schema = z.object({
  age: positiveIntSchema('Age'),
  score: nonNegativeIntSchema('Score'),
})
```

#### IDs
```typescript
import {
  uuidSchema,           // UUID validation
  optionalUuidSchema,   // Optional UUID
} from '@/lib/forms/patterns'
```

#### Enums
```typescript
import {
  genderSchema,         // 'male' | 'female'
  eventGenderSchema,    // 'male' | 'female' | 'mixed'
  preferredHandSchema,  // 'left' | 'right' | 'both'
  visibilitySchema,     // 'public' | 'private'
} from '@/lib/forms/patterns'
```

### Custom Validation with `.refine()`

For cross-field validation:

```typescript
const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'], // Show error on this field
  })
```

### Conditional Validation

```typescript
const schema = z.object({
  hasEmail: z.boolean(),
  email: z.string().optional(),
}).refine(
  (data) => {
    if (data.hasEmail) {
      return data.email && emailSchema.safeParse(data.email).success
    }
    return true
  },
  {
    message: 'Email is required when checkbox is selected',
    path: ['email'],
  }
)
```

---

## Form Components

### LoadingButton

Displays loading state during form submission.

**Basic Usage**:
```typescript
import { LoadingButton } from '@/components/forms'

<LoadingButton
  type="submit"
  isLoading={isSubmitting}
  loadingText="Saving..."
>
  Submit
</LoadingButton>
```

**With Icon**:
```typescript
import { Save } from 'lucide-react'

<LoadingButton
  type="submit"
  isLoading={isSubmitting}
  loadingText="Saving..."
  icon={<Save className="h-4 w-4" />}
>
  Save Changes
</LoadingButton>
```

**Props**:
- `isLoading`: boolean - Shows spinner when true
- `loadingText`: string - Text to display when loading (optional)
- `icon`: ReactNode - Icon to display before text (optional)
- `disabled`: boolean - Disable button
- All `Button` props (variant, size, etc.)

### FormError

Displays form-level error messages.

**Usage**:
```typescript
import { FormError } from '@/components/forms'

const [formError, setFormError] = useState<string | null>(null)

const onSubmit = async (data: FormData) => {
  try {
    await apiClient.post('/api/endpoint', data)
  } catch (error: any) {
    setFormError(error.message || 'An error occurred')
  }
}

return (
  <form>
    <FormError error={formError} />
    {/* fields */}
  </form>
)
```

### CharacterCounter

Shows character count for text inputs.

**Usage**:
```typescript
import { CharacterCounter } from '@/components/forms'
import { Textarea } from '@/components/ui/textarea'

<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Textarea {...field} maxLength={1000} />
      </FormControl>
      <CharacterCounter
        current={field.value?.length || 0}
        max={1000}
      />
      <FormMessage />
    </FormItem>
  )}
/>
```

**Features**:
- Yellow warning at 90%
- Red danger at 100%
- Shows "limit reached" message

---

## Date Handling

### Date Picker Pattern

```typescript
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

<FormField
  control={form.control}
  name="dateOfBirth"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Date of Birth</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !field.value && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Transforming Dates for API

Forms work with `Date` objects, APIs expect ISO strings (YYYY-MM-DD).

**Transform on Submit**:
```typescript
import { dateToISOString } from '@/lib/forms/patterns'

const onSubmit = async (data: FormData) => {
  const payload = {
    ...data,
    dateOfBirth: dateToISOString(data.dateOfBirth),
    eventDate: dateToISOString(data.eventDate),
  }

  await apiClient.post('/api/endpoint', payload)
}
```

**Transform on Load**:
```typescript
import { isoStringToDate } from '@/lib/forms/patterns'

useEffect(() => {
  if (initialData) {
    form.reset({
      ...initialData,
      dateOfBirth: isoStringToDate(initialData.dateOfBirth),
      eventDate: isoStringToDate(initialData.eventDate),
    })
  }
}, [initialData])
```

**Batch Transform**:
```typescript
import { transformDatesForAPI } from '@/lib/forms/patterns'

const onSubmit = async (data: FormData) => {
  const payload = transformDatesForAPI(data, ['dateOfBirth', 'eventDate'])
  await apiClient.post('/api/endpoint', payload)
}
```

---

## Standard Form Component Structure

### Recommended Pattern (Modern)

All new forms should follow this standardized structure using shared components:

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
import { toast } from 'sonner'

// 1. Define validation schema using shared patterns
const schema = z.object({
  name: nameSchema,
  email: emailSchema,
})

type FormData = z.infer<typeof schema>

// 2. Define props interface
interface EntityFormProps {
  entity?: Entity       // Optional for edit mode
  onSuccess?: () => void
  onCancel?: () => void
}

// 3. Component implementation
export const EntityForm = ({ entity, onSuccess, onCancel }: EntityFormProps) => {
  // Store actions and state
  const { createEntity, updateEntity, error: storeError, clearError } = useEntityStore()

  // Local error state for form-specific errors
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!entity

  // Initialize form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: entity?.name || '',
      email: entity?.email || '',
    },
  })

  // Submit handler
  const onSubmit = async (data: FormData) => {
    clearError()
    setError(null)

    try {
      if (isEditing) {
        await updateEntity(entity.id, data)
        toast.success('Updated successfully')
      } else {
        await createEntity(data)
        toast.success('Created successfully')
      }

      onSuccess?.()
    } catch (err) {
      // Error already in store state, optionally set local error
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields */}
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

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Error display using shared component */}
        <FormError error={error || storeError} />

        {/* Form actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}

          {/* Submit button using shared LoadingButton */}
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

### Key Components

#### 1. FormError Component

**Location**: `src/components/forms/form-error.tsx`

**Usage**:
```typescript
import { FormError } from '@/components/forms/form-error'

const [error, setError] = useState<string | null>(null)

// In JSX
<FormError error={error} />
```

**Features**:
- Only renders when error exists
- Red destructive color scheme
- AlertCircle icon
- `role="alert"` for accessibility
- Consistent styling across all forms

**Reference**: `src/components/forms/form-error.tsx`

#### 2. LoadingButton Component

**Location**: `src/components/forms/loading-button.tsx`

**Usage**:
```typescript
import { LoadingButton } from '@/components/forms/loading-button'

<LoadingButton
  type="submit"
  isLoading={form.formState.isSubmitting}
  loadingText="Saving..."
>
  Save Changes
</LoadingButton>
```

**Features**:
- Automatic disable during loading
- Rotating spinner (Loader2 icon)
- Optional custom loading text
- Optional icon support

**Reference**: `src/components/forms/loading-button.tsx`

#### 3. Shared Validation Patterns

**Location**: `src/lib/forms/patterns.ts`

**Available Patterns**:
```typescript
import {
  nameSchema,           // 2-255 chars, required
  rtlNameSchema,        // Optional RTL name, max 255
  emailSchema,          // Email validation
  descriptionSchema,    // Max 1000 chars, optional
  dateOfBirthSchema,    // DOB with age validation
  genderSchema,         // 'male' | 'female'
  preferredHandSchema,  // 'left' | 'right' | 'both'
  visibilitySchema,     // 'public' | 'private'
  uuidSchema,           // UUID validation
  optionalUuidSchema,   // Optional UUID
} from '@/lib/forms/patterns'
```

**Reference**: `src/lib/forms/patterns.ts`

### Migrating Legacy Forms

**Legacy Pattern** (To be updated):
```typescript
// ❌ Old pattern - inline error div
{error && (
  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
    <p className="text-destructive text-sm">{error}</p>
  </div>
)}

// ❌ Old pattern - manual button loading
<Button
  type="submit"
  disabled={form.formState.isSubmitting}
>
  {form.formState.isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    'Save'
  )}
</Button>

// ❌ Old pattern - inline Zod schema
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email'),
})
```

**Modern Pattern** (Use this):
```typescript
// ✅ New pattern - shared FormError component
<FormError error={error} />

// ✅ New pattern - shared LoadingButton component
<LoadingButton
  type="submit"
  isLoading={form.formState.isSubmitting}
  loadingText="Saving..."
>
  Save
</LoadingButton>

// ✅ New pattern - shared validation patterns
import { nameSchema, emailSchema } from '@/lib/forms/patterns'

const schema = z.object({
  name: nameSchema,
  email: emailSchema,
})
```

### Migration Checklist

When updating an existing form:

- [ ] Replace inline error divs with `<FormError error={error} />`
- [ ] Replace manual button loading with `<LoadingButton>`
- [ ] Replace inline Zod schemas with shared patterns from `@/lib/forms/patterns.ts`
- [ ] Ensure form uses `toast.success()` for success feedback
- [ ] Test form submission (success and error cases)
- [ ] Verify loading states display correctly
- [ ] Check error messages appear properly

### Benefits of Standard Pattern

**Consistency**:
- All forms look and behave the same
- Users have predictable experience
- Easier maintenance

**Reusability**:
- Shared components reduce code duplication
- Validation patterns prevent mistakes
- Less code to write and test

**Accessibility**:
- FormError has `role="alert"` built-in
- LoadingButton handles disabled state
- Consistent focus management

**Type Safety**:
- Shared schemas ensure consistent validation
- TypeScript inference works automatically
- Catch errors at compile time

---

## Common Patterns

### Number Input Pattern

```typescript
<FormField
  control={form.control}
  name="score"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Score</FormLabel>
      <FormControl>
        <Input
          type="number"
          inputMode="numeric"
          {...field}
          onChange={(e) =>
            field.onChange(
              e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
            )
          }
          onFocus={(e) => e.target.select()}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Key Points**:
- Use `type="number"` and `inputMode="numeric"`
- Parse string to number in `onChange`
- Handle empty string as 0
- Auto-select on focus for better UX

### Select/Dropdown Pattern

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<FormField
  control={form.control}
  name="gender"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Gender</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Checkbox Pattern

```typescript
import { Checkbox } from '@/components/ui/checkbox'

<FormField
  control={form.control}
  name="agreeToTerms"
  render={({ field }) => (
    <FormItem className="flex items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>I agree to the terms and conditions</FormLabel>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea Pattern

```typescript
import { Textarea } from '@/components/ui/textarea'
import { CharacterCounter } from '@/components/forms'

<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Textarea
          {...field}
          maxLength={1000}
          rows={4}
        />
      </FormControl>
      <CharacterCounter
        current={field.value?.length || 0}
        max={1000}
      />
      <FormMessage />
    </FormItem>
  )}
/>
```

### Dynamic Fields with useFieldArray

For repeating field groups (e.g., multiple players, scores):

```typescript
import { useFieldArray } from 'react-hook-form'

const schema = z.object({
  players: z.array(z.object({
    name: nameSchema,
    score: scoreSchema,
  })).min(1, 'At least one player required'),
})

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      players: [{ name: '', score: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'players',
  })

  return (
    <form>
      {fields.map((field, index) => (
        <div key={field.id}>
          <FormField
            control={form.control}
            name={`players.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Player {index + 1} Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="destructive"
            onClick={() => remove(index)}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button
        type="button"
        onClick={() => append({ name: '', score: 0 })}
      >
        Add Player
      </Button>
    </form>
  )
}
```

---

## Migration Guide

### Migrating from useState to React Hook Form

**Before (useState pattern)**:
```typescript
const [name, setName] = useState('')
const [email, setEmail] = useState('')
const [errors, setErrors] = useState({})

const handleSubmit = async (e) => {
  e.preventDefault()

  // Manual validation
  const newErrors = {}
  if (!name) newErrors.name = 'Required'
  if (!email) newErrors.email = 'Required'

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors)
    return
  }

  // Submit
}

return (
  <form onSubmit={handleSubmit}>
    <input value={name} onChange={(e) => setName(e.target.value)} />
    {errors.name && <span>{errors.name}</span>}
  </form>
)
```

**After (React Hook Form pattern)**:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { nameSchema, emailSchema } from '@/lib/forms/patterns'

const schema = z.object({
  name: nameSchema,
  email: emailSchema,
})

type FormData = z.infer<typeof schema>

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {
    name: '',
    email: '',
  },
})

const onSubmit = async (data: FormData) => {
  // Data is validated, submit directly
}

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  </Form>
)
```

### Migration Checklist

- [ ] Import React Hook Form and Zod
- [ ] Create Zod schema (use shared schemas where possible)
- [ ] Replace `useState` with `useForm`
- [ ] Replace manual validation with `zodResolver`
- [ ] Convert inputs to `FormField` components
- [ ] Replace manual error display with `FormMessage`
- [ ] Replace submit handler with `form.handleSubmit(onSubmit)`
- [ ] Replace loading state with `form.formState.isSubmitting`
- [ ] Use `LoadingButton` component
- [ ] Transform dates with `dateToISOString` if needed
- [ ] Test all validations
- [ ] Test submission flow

---

## Best Practices

### 1. Always Use Shared Schemas

❌ **Don't**:
```typescript
const schema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
})
```

✅ **Do**:
```typescript
import { nameSchema, emailSchema } from '@/lib/forms/patterns'

const schema = z.object({
  name: nameSchema,
  email: emailSchema,
})
```

### 2. Type Your Form Data

❌ **Don't**:
```typescript
const form = useForm({
  resolver: zodResolver(schema),
})

const onSubmit = (data: any) => { ... }
```

✅ **Do**:
```typescript
type FormData = z.infer<typeof schema>

const form = useForm<FormData>({
  resolver: zodResolver(schema),
})

const onSubmit = async (data: FormData) => { ... }
```

### 3. Initialize All Fields

❌ **Don't**:
```typescript
const form = useForm({
  resolver: zodResolver(schema),
})
```

✅ **Do**:
```typescript
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    name: '',
    email: '',
    dateOfBirth: null,
  },
})
```

### 4. Handle Loading States

❌ **Don't**:
```typescript
<Button type="submit">Submit</Button>
```

✅ **Do**:
```typescript
const { isSubmitting } = form.formState

<LoadingButton
  type="submit"
  isLoading={isSubmitting}
  loadingText="Saving..."
>
  Submit
</LoadingButton>
```

### 5. Transform Dates Properly

❌ **Don't**:
```typescript
const onSubmit = async (data: FormData) => {
  await apiClient.post('/api/endpoint', data) // Date object sent to API
}
```

✅ **Do**:
```typescript
import { dateToISOString } from '@/lib/forms/patterns'

const onSubmit = async (data: FormData) => {
  const payload = {
    ...data,
    dateOfBirth: dateToISOString(data.dateOfBirth),
  }
  await apiClient.post('/api/endpoint', payload)
}
```

### 6. Handle Form-Level Errors

✅ **Good**:
```typescript
import { FormError } from '@/components/forms'
const [formError, setFormError] = useState<string | null>(null)

const onSubmit = async (data: FormData) => {
  try {
    await apiClient.post('/api/endpoint', data)
  } catch (error: any) {
    setFormError(error.message || 'An error occurred')
  }
}

return (
  <form>
    <FormError error={formError} />
    {/* fields */}
  </form>
)
```

### 7. Use Proper Input Types

✅ **Good**:
```typescript
// For emails
<Input type="email" inputMode="email" {...field} />

// For numbers
<Input type="number" inputMode="numeric" {...field} />

// For phone numbers
<Input type="tel" inputMode="tel" {...field} />
```

### 8. Provide Clear Validation Messages

❌ **Don't**:
```typescript
z.string().min(2)
```

✅ **Do**:
```typescript
z.string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(255, 'Name must be less than 255 characters')
```

---

## Troubleshooting

### Issue: Form Not Validating

**Solution**: Check that you're using `zodResolver`:
```typescript
const form = useForm({
  resolver: zodResolver(schema), // Required!
  defaultValues: { ... },
})
```

### Issue: TypeScript Errors with Zod

**Problem**: `errorMap`, `required_error`, or `invalid_type_error` not found

**Solution**: Use simplified Zod 3.x syntax:
```typescript
// ❌ Old syntax
z.date({ required_error: 'Required', invalid_type_error: 'Invalid' })

// ✅ New syntax
z.date()
```

### Issue: Field Value Not Updating

**Solution**: Ensure you're spreading `{...field}`:
```typescript
<FormControl>
  <Input {...field} /> {/* Spread all field props */}
</FormControl>
```

### Issue: Number Input Shows String

**Solution**: Parse in `onChange`:
```typescript
<Input
  type="number"
  {...field}
  onChange={(e) =>
    field.onChange(
      e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
    )
  }
/>
```

### Issue: Date Not Submitting to API

**Solution**: Transform Date to ISO string:
```typescript
import { dateToISOString } from '@/lib/forms/patterns'

const payload = {
  ...data,
  dateOfBirth: dateToISOString(data.dateOfBirth),
}
```

### Issue: Validation Not Showing on First Submit

**Solution**: React Hook Form validates on submit by default. To validate on blur/change:
```typescript
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur', // or 'onChange'
})
```

---

## Quick Reference

### Validation Schemas Table

All schemas imported from `@/lib/forms/patterns`

| Schema | Type | Rules | Usage |
|--------|------|-------|-------|
| `nameSchema` | `string` | Required, 2-255 chars, trimmed | Player names, coach names, etc. |
| `rtlNameSchema` | `string \| null` | Optional, max 255 chars | Arabic/RTL names |
| `emailSchema` | `string` | Required, valid email, trimmed, lowercase | User emails |
| `descriptionSchema` | `string \| null` | Optional, max 1000 chars | Short descriptions |
| `longTextSchema(maxLength)` | `string \| null` | Optional, configurable max | Notes, long descriptions |
| `passwordSchema` | `string` | 8+ chars, uppercase, lowercase, number, special char | New passwords, password reset |
| `passwordSignInSchema` | `string` | 8+ chars only | Sign-in forms |
| `dateOfBirthSchema` | `Date` | Must be 2+ years old, not in future | Player DOB |
| `dateSchema` | `Date` | Cannot be in future | General past dates |
| `futureDateSchema` | `Date` | Any date | Event dates |
| `optionalDateSchema` | `Date \| null` | Optional date | Optional date fields |
| `dateStringSchema` | `string` | Valid date, not in future | API date strings |
| `optionalDateStringSchema` | `string \| null` | Optional date string | Optional API dates |
| `positiveIntSchema(fieldName)` | `number` | Integer > 0 | Counts, quantities |
| `nonNegativeIntSchema(fieldName)` | `number` | Integer >= 0 | Scores, ages |
| `scoreSchema` | `number \| null` | Optional, integer >= 0 | Optional scores |
| `uuidSchema` | `string` | Valid UUID | Required IDs |
| `optionalUuidSchema` | `string \| null` | Optional UUID | Optional foreign keys |
| `genderSchema` | `'male' \| 'female'` | Enum | Player gender |
| `eventGenderSchema` | `'male' \| 'female' \| 'mixed'` | Enum | Event gender |
| `preferredHandSchema` | `'left' \| 'right' \| 'both'` | Enum | Player preferred hand |
| `visibilitySchema` | `'public' \| 'private'` | Enum | Visibility settings |

### Transform Helpers

| Function | Input | Output | Usage |
|----------|-------|--------|-------|
| `dateToISOString(date)` | `Date \| null \| undefined` | `string \| null` | Convert Date to YYYY-MM-DD for API |
| `isoStringToDate(str)` | `string \| null \| undefined` | `Date \| null` | Convert API date string to Date |
| `transformDatesForAPI(data, fields)` | `object, string[]` | `object` | Batch transform multiple date fields |

### Common Patterns Cheat Sheet

| Pattern | Code |
|---------|------|
| **Import form basics** | `import { useForm } from 'react-hook-form'`<br>`import { zodResolver } from '@hookform/resolvers/zod'`<br>`import { z } from 'zod'` |
| **Import form components** | `import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'` |
| **Import custom components** | `import { LoadingButton, FormError, CharacterCounter } from '@/components/forms'` |
| **Import validation schemas** | `import { nameSchema, emailSchema, dateToISOString } from '@/lib/forms/patterns'` |
| **Create schema** | `const schema = z.object({ name: nameSchema })` |
| **Infer type** | `type FormData = z.infer<typeof schema>` |
| **Setup form** | `const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: {} })` |
| **Get submit state** | `const { isSubmitting } = form.formState` |
| **Submit handler** | `const onSubmit = async (data: FormData) => { ... }` |
| **Render form** | `<Form {...form}><form onSubmit={form.handleSubmit(onSubmit)}>` |
| **Transform date for API** | `dateToISOString(data.dateOfBirth)` |
| **Parse date from API** | `isoStringToDate(apiData.dateOfBirth)` |

### File Locations

| Item | Path |
|------|------|
| **Validation schemas** | `src/lib/forms/patterns.ts` |
| **LoadingButton** | `src/components/forms/loading-button.tsx` |
| **FormError** | `src/components/forms/form-error.tsx` |
| **CharacterCounter** | `src/components/forms/character-counter.tsx` |
| **Form primitives** | `src/components/ui/form.tsx` |
| **Input component** | `src/components/ui/input.tsx` |
| **Select component** | `src/components/ui/select.tsx` |
| **Textarea component** | `src/components/ui/textarea.tsx` |
| **Calendar component** | `src/components/ui/calendar.tsx` |
| **Checkbox component** | `src/components/ui/checkbox.tsx` |
| **Radio Group component** | `src/components/ui/radio-group.tsx` |

---

## Development Checklists

### New Form Checklist

Use this when creating a new form from scratch.

**Planning & Setup:**
- [ ] Identify all form fields and their types
- [ ] Determine validation rules for each field
- [ ] Check if shared validation schemas exist in `src/lib/forms/patterns.ts`
- [ ] Identify cross-field validation requirements
- [ ] Determine if dates need to be transformed for API submission
- [ ] Plan for error handling (field-level and form-level)

**Implementation:**
- [ ] Import React Hook Form, Zod, and form components
- [ ] Create Zod schema using shared schemas where possible
- [ ] Infer TypeScript type: `type FormData = z.infer<typeof formSchema>`
- [ ] Setup `useForm` hook with `zodResolver` and `defaultValues`
- [ ] Create async `onSubmit` handler with date transformations
- [ ] Add `FormField` components for each input
- [ ] Add `FormError` component for form-level errors
- [ ] Add `LoadingButton` with `isSubmitting` state

**Testing:**
- [ ] Test form renders without errors
- [ ] Test all field inputs work correctly
- [ ] Test all validation rules trigger properly
- [ ] Test error messages display correctly
- [ ] Test successful submission flow
- [ ] Test API error handling
- [ ] Test loading states during submission
- [ ] Test date transformations (if applicable)
- [ ] Test cross-field validations (if applicable)

### Migration Checklist

Use this when migrating an existing form to React Hook Form + Zod.

**Analysis:**
- [ ] Identify current form implementation pattern
- [ ] List all form fields and their current validation
- [ ] Identify all submission logic and API calls
- [ ] Note any special behaviors (conditional fields, dynamic arrays, etc.)
- [ ] Check for date handling requirements

**Implementation:**
- [ ] Create Zod schema matching current validation
- [ ] Add `.refine()` for cross-field validation if needed
- [ ] Replace `useState` with `useForm` hook
- [ ] Remove manual validation logic
- [ ] Convert inputs to `FormField` pattern
- [ ] Replace manual error display with `FormMessage`
- [ ] Replace submit handler with `form.handleSubmit(onSubmit)`
- [ ] Replace loading state with `form.formState.isSubmitting`
- [ ] Use `LoadingButton` component
- [ ] Transform dates with `dateToISOString` if needed

**Cleanup:**
- [ ] Remove unused imports (`useState`, etc.)
- [ ] Remove unused state variables
- [ ] Remove manual validation functions
- [ ] Remove old error handling code

### Common Pitfalls

**❌ Not Spreading Field Props:**
```typescript
// Wrong
<Input value={field.value} onChange={field.onChange} />
// Correct
<Input {...field} />
```

**❌ Forgetting to Parse Number Inputs:**
```typescript
// Wrong - field.value will be a string!
<Input type="number" {...field} />
// Correct
<Input
  type="number"
  {...field}
  onChange={(e) =>
    field.onChange(
      e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
    )
  }
/>
```

**❌ Not Transforming Dates for API:**
```typescript
// Wrong - Date objects sent to API will cause errors
await apiClient.post('/api/endpoint', data)
// Correct
const payload = {
  ...data,
  dateOfBirth: dateToISOString(data.dateOfBirth),
}
await apiClient.post('/api/endpoint', payload)
```

**❌ Forgetting zodResolver:**
```typescript
// Wrong - No validation!
const form = useForm({ defaultValues: { ... } })
// Correct
const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { ... },
})
```

**❌ Not Initializing All Fields:**
```typescript
// Wrong - defaultValues: undefined
const form = useForm({ resolver: zodResolver(formSchema) })
// Correct
const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: '',
    email: '',
  },
})
```

---

## Additional Resources

- **React Hook Form Docs**: https://react-hook-form.com/
- **Zod Docs**: https://zod.dev/
- **Radix UI Form**: https://www.radix-ui.com/primitives/docs/components/form

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check existing forms for similar patterns (especially `player-form.tsx`, `test-event-score-form.tsx`)
2. Review the validation schemas in `src/lib/forms/patterns.ts`
3. Consult the React Hook Form documentation
4. Check the Zod documentation for advanced validation patterns
