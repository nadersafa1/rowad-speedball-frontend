# Forms Quick Reference

Quick lookup for validation schemas, components, and code snippets.

## Table of Contents

- [Validation Schemas](#validation-schemas)
- [Form Components](#form-components)
- [Code Snippets](#code-snippets)

---

## Validation Schemas

All schemas imported from `@/lib/forms/patterns`

### Basic Fields

| Schema | Type | Rules | Usage |
|--------|------|-------|-------|
| `nameSchema` | `string` | Required, 2-255 chars, trimmed | Player names, coach names, etc. |
| `rtlNameSchema` | `string \| null` | Optional, max 255 chars | Arabic/RTL names |
| `emailSchema` | `string` | Required, valid email, trimmed, lowercase | User emails |
| `descriptionSchema` | `string \| null` | Optional, max 1000 chars | Short descriptions |
| `longTextSchema(maxLength)` | `string \| null` | Optional, configurable max | Notes, long descriptions |

**Example**:
```typescript
import { nameSchema, emailSchema } from '@/lib/forms/patterns'

const schema = z.object({
  name: nameSchema,
  email: emailSchema,
})
```

### Password

| Schema | Type | Rules | Usage |
|--------|------|-------|-------|
| `passwordSchema` | `string` | 8+ chars, uppercase, lowercase, number, special char | New passwords, password reset |
| `passwordSignInSchema` | `string` | 8+ chars only | Sign-in forms |

**Example**:
```typescript
import { passwordSchema, passwordSignInSchema } from '@/lib/forms/patterns'

// Sign-up form
const signUpSchema = z.object({
  password: passwordSchema, // Strong validation
})

// Sign-in form
const signInSchema = z.object({
  password: passwordSignInSchema, // Simple validation
})
```

### Dates

| Schema | Type | Rules | Usage |
|--------|------|-------|-------|
| `dateOfBirthSchema` | `Date` | Must be 2+ years old, not in future | Player DOB |
| `dateSchema` | `Date` | Cannot be in future | General past dates |
| `futureDateSchema` | `Date` | Any date | Event dates |
| `optionalDateSchema` | `Date \| null` | Optional date | Optional date fields |
| `dateStringSchema` | `string` | Valid date, not in future | API date strings |
| `optionalDateStringSchema` | `string \| null` | Optional date string | Optional API dates |

**Example**:
```typescript
import { dateOfBirthSchema, futureDateSchema } from '@/lib/forms/patterns'

const schema = z.object({
  dateOfBirth: dateOfBirthSchema,
  eventDate: futureDateSchema,
})
```

### Numbers

| Schema | Type | Rules | Usage |
|--------|------|-------|-------|
| `positiveIntSchema(fieldName)` | `number` | Integer > 0 | Counts, quantities |
| `nonNegativeIntSchema(fieldName)` | `number` | Integer >= 0 | Scores, ages |
| `scoreSchema` | `number \| null` | Optional, integer >= 0 | Optional scores |

**Example**:
```typescript
import { positiveIntSchema, nonNegativeIntSchema } from '@/lib/forms/patterns'

const schema = z.object({
  age: positiveIntSchema('Age'),
  score: nonNegativeIntSchema('Score'),
})
```

### IDs

| Schema | Type | Rules | Usage |
|--------|------|-------|-------|
| `uuidSchema` | `string` | Valid UUID | Required IDs |
| `optionalUuidSchema` | `string \| null` | Optional UUID | Optional foreign keys |

**Example**:
```typescript
import { uuidSchema, optionalUuidSchema } from '@/lib/forms/patterns'

const schema = z.object({
  id: uuidSchema,
  organizationId: optionalUuidSchema,
})
```

### Enums

| Schema | Values | Usage |
|--------|--------|-------|
| `genderSchema` | `'male' \| 'female'` | Player gender |
| `eventGenderSchema` | `'male' \| 'female' \| 'mixed'` | Event gender |
| `preferredHandSchema` | `'left' \| 'right' \| 'both'` | Player preferred hand |
| `visibilitySchema` | `'public' \| 'private'` | Visibility settings |

**Example**:
```typescript
import { genderSchema, preferredHandSchema } from '@/lib/forms/patterns'

const schema = z.object({
  gender: genderSchema,
  preferredHand: preferredHandSchema,
})
```

### Transform Helpers

| Function | Input | Output | Usage |
|----------|-------|--------|-------|
| `dateToISOString(date)` | `Date \| null \| undefined` | `string \| null` | Convert Date to YYYY-MM-DD for API |
| `isoStringToDate(str)` | `string \| null \| undefined` | `Date \| null` | Convert API date string to Date |
| `transformDatesForAPI(data, fields)` | `object, string[]` | `object` | Batch transform multiple date fields |

**Example**:
```typescript
import { dateToISOString, transformDatesForAPI } from '@/lib/forms/patterns'

// Single date
const payload = {
  ...data,
  dateOfBirth: dateToISOString(data.dateOfBirth),
}

// Multiple dates
const payload = transformDatesForAPI(data, ['dateOfBirth', 'eventDate'])
```

### Array Helpers

| Function | Parameters | Returns | Usage |
|----------|------------|---------|-------|
| `nonEmptyArraySchema(itemSchema, message?)` | `ZodType, string?` | `ZodArray` | At least one item required |
| `boundedArraySchema(itemSchema, min, max, fieldName?)` | `ZodType, number, number, string?` | `ZodArray` | Min/max length array |

**Example**:
```typescript
import { nonEmptyArraySchema } from '@/lib/forms/patterns'

const schema = z.object({
  players: nonEmptyArraySchema(
    z.object({ name: nameSchema }),
    'At least one player is required'
  ),
})
```

### Range Validation Helper

| Function | Usage |
|----------|-------|
| `createRangeValidation(minField?, maxField?)` | Ensure min <= max |

**Example**:
```typescript
import { createRangeValidation } from '@/lib/forms/patterns'

const schema = z.object({
  minAge: z.number(),
  maxAge: z.number(),
}).refine(createRangeValidation('minAge', 'maxAge'), {
  message: 'Min age must be less than max age',
  path: ['minAge'],
})
```

### Enum Helper

| Function | Parameters | Returns | Usage |
|----------|------------|---------|-------|
| `createEnumSchema(values, fieldName)` | `string[], string` | `ZodEnum` | Custom enum with error message |

**Example**:
```typescript
import { createEnumSchema } from '@/lib/forms/patterns'

const statusSchema = createEnumSchema(['active', 'inactive', 'pending'], 'status')
```

---

## Form Components

All components imported from `@/components/forms`

### LoadingButton

Displays loading spinner during submission.

**Props**:
```typescript
interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
  icon?: ReactNode
}
```

**Usage**:
```typescript
import { LoadingButton } from '@/components/forms'

<LoadingButton
  type="submit"
  isLoading={isSubmitting}
  loadingText="Saving..."
  icon={<Save className="h-4 w-4" />}
>
  Submit
</LoadingButton>
```

**Variants**:
```typescript
// Default
<LoadingButton variant="default" />

// Outline
<LoadingButton variant="outline" />

// Destructive
<LoadingButton variant="destructive" />

// Ghost
<LoadingButton variant="ghost" />

// Link
<LoadingButton variant="link" />
```

**Sizes**:
```typescript
<LoadingButton size="sm" />
<LoadingButton size="default" />
<LoadingButton size="lg" />
<LoadingButton size="icon" />
```

### FormError

Displays form-level error messages with icon.

**Props**:
```typescript
interface FormErrorProps {
  error?: string | null
  className?: string
}
```

**Usage**:
```typescript
import { FormError } from '@/components/forms'
const [formError, setFormError] = useState<string | null>(null)

<form>
  <FormError error={formError} />
  {/* fields */}
</form>
```

### CharacterCounter

Shows character count with visual feedback.

**Props**:
```typescript
interface CharacterCounterProps {
  current: number
  max: number
  className?: string
}
```

**Usage**:
```typescript
import { CharacterCounter } from '@/components/forms'

<Textarea {...field} maxLength={1000} />
<CharacterCounter
  current={field.value?.length || 0}
  max={1000}
/>
```

**States**:
- Normal: `text-muted-foreground`
- Warning (90%+): `text-yellow-600`
- Danger (100%): `text-destructive` + "(limit reached)"

---

## Code Snippets

### Basic Form Template

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/forms'
import { nameSchema } from '@/lib/forms/patterns'

const formSchema = z.object({
  name: nameSchema,
})

type FormData = z.infer<typeof formSchema>

export function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: FormData) => {
    // Submit logic
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

        <LoadingButton type="submit" isLoading={isSubmitting}>
          Submit
        </LoadingButton>
      </form>
    </Form>
  )
}
```

### Text Input

```typescript
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Number Input

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

### Date Picker

```typescript
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

<FormField
  control={form.control}
  name="date"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Date</FormLabel>
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

### Select/Dropdown

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

### Checkbox

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
        <FormLabel>I agree to the terms</FormLabel>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea

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
        <Textarea {...field} maxLength={1000} rows={4} />
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

### Radio Group

```typescript
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

<FormField
  control={form.control}
  name="visibility"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Visibility</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          defaultValue={field.value}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="public" />
            <label htmlFor="public">Public</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private" id="private" />
            <label htmlFor="private">Private</label>
          </div>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Dynamic Fields (useFieldArray)

```typescript
import { useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'

const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: 'players',
})

return (
  <>
    {fields.map((field, index) => (
      <div key={field.id}>
        <FormField
          control={form.control}
          name={`players.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player {index + 1}</FormLabel>
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
      onClick={() => append({ name: '' })}
    >
      Add Player
    </Button>
  </>
)
```

### Cross-Field Validation

```typescript
const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
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

### Form with API Error Handling

```typescript
import { FormError } from '@/components/forms'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

const [formError, setFormError] = useState<string | null>(null)

const onSubmit = async (data: FormData) => {
  setFormError(null)

  try {
    await apiClient.post('/api/endpoint', data)
    toast.success('Saved successfully')
  } catch (error: any) {
    setFormError(error.message || 'An error occurred')
    toast.error('Failed to save')
  }
}

return (
  <form>
    <FormError error={formError} />
    {/* fields */}
  </form>
)
```

### Date Transformation

```typescript
import { dateToISOString, isoStringToDate } from '@/lib/forms/patterns'

// On submit (Date -> API string)
const onSubmit = async (data: FormData) => {
  const payload = {
    ...data,
    dateOfBirth: dateToISOString(data.dateOfBirth),
  }
  await apiClient.post('/api/endpoint', payload)
}

// On load (API string -> Date)
useEffect(() => {
  if (initialData) {
    form.reset({
      ...initialData,
      dateOfBirth: isoStringToDate(initialData.dateOfBirth),
    })
  }
}, [initialData])
```

### Reset Form After Submit

```typescript
const onSubmit = async (data: FormData) => {
  await apiClient.post('/api/endpoint', data)
  form.reset() // Reset to default values
}
```

### Manual Field Errors

```typescript
const onSubmit = async (data: FormData) => {
  try {
    await apiClient.post('/api/endpoint', data)
  } catch (error: any) {
    if (error.field) {
      form.setError(error.field, {
        message: error.message,
      })
    }
  }
}
```

### Watch Field Values

```typescript
const emailValue = form.watch('email')
const allValues = form.watch()

useEffect(() => {
  console.log('Email changed:', emailValue)
}, [emailValue])
```

---

## Common Patterns Cheat Sheet

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

---

## File Locations

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

## Related Documentation

- **Comprehensive Guide**: `docs/FORMS_GUIDE.md`
- **Migration Checklist**: `docs/FORMS_CHECKLIST.md`
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
