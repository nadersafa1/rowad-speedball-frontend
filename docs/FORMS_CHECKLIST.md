# Form Migration & Development Checklist

Use this checklist when creating new forms or migrating existing forms to the standardized React Hook Form + Zod pattern.

## Table of Contents

- [New Form Checklist](#new-form-checklist)
- [Migration Checklist](#migration-checklist)
- [Quality Assurance Checklist](#quality-assurance-checklist)
- [Common Pitfalls](#common-pitfalls)

---

## New Form Checklist

Use this when creating a new form from scratch.

### 1. Planning & Schema Definition

- [ ] Identify all form fields and their types
- [ ] Determine validation rules for each field
- [ ] Check if shared validation schemas exist in `src/lib/forms/patterns.ts`
- [ ] Identify cross-field validation requirements (e.g., password confirmation)
- [ ] Determine if dates need to be transformed for API submission
- [ ] Plan for error handling (field-level and form-level)

### 2. Setup Imports

```typescript
- [ ] Import React Hook Form
      import { useForm } from 'react-hook-form'

- [ ] Import Zod and resolver
      import { zodResolver } from '@hookform/resolvers/zod'
      import { z } from 'zod'

- [ ] Import form components
      import {
        Form,
        FormControl,
        FormField,
        FormItem,
        FormLabel,
        FormMessage,
      } from '@/components/ui/form'

- [ ] Import input components (as needed)
      import { Input } from '@/components/ui/input'
      import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
      import { Textarea } from '@/components/ui/textarea'
      import { Checkbox } from '@/components/ui/checkbox'
      import { Calendar } from '@/components/ui/calendar'
      // etc.

- [ ] Import custom form components
      import { LoadingButton, FormError, CharacterCounter } from '@/components/forms'

- [ ] Import shared validation schemas (as needed)
      import {
        nameSchema,
        emailSchema,
        dateToISOString,
        // etc.
      } from '@/lib/forms/patterns'
```

### 3. Create Validation Schema

```typescript
- [ ] Define Zod schema using shared schemas where possible
      const formSchema = z.object({
        name: nameSchema,
        email: emailSchema,
        // ... other fields
      })

- [ ] Add cross-field validation with .refine() if needed
      .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords must match',
        path: ['confirmPassword'],
      })

- [ ] Infer TypeScript type from schema
      type FormData = z.infer<typeof formSchema>
```

### 4. Initialize Form

```typescript
- [ ] Setup useForm hook with proper typing
      const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          // Initialize all fields
        },
      })

- [ ] Extract isSubmitting state
      const { isSubmitting } = form.formState

- [ ] Add form error state if needed for API errors
      const [formError, setFormError] = useState<string | null>(null)
```

### 5. Create Submit Handler

```typescript
- [ ] Define async onSubmit function with proper typing
      const onSubmit = async (data: FormData) => {
        setFormError(null)

        try {
          // Transform dates if needed
          const payload = {
            ...data,
            dateField: dateToISOString(data.dateField),
          }

          // Submit to API
          await apiClient.post('/api/endpoint', payload)

          // Show success feedback
          toast.success('Saved successfully')

          // Handle success (close dialog, navigate, etc.)
        } catch (error: any) {
          setFormError(error.message || 'An error occurred')
          toast.error('Failed to save')
        }
      }
```

### 6. Build Form UI

```typescript
- [ ] Wrap form with Form component
      <Form {...form}>

- [ ] Setup form element with submit handler
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

- [ ] Add FormError component if using form-level errors
      <FormError error={formError} />

- [ ] Add FormField for each input (see field patterns below)

- [ ] Add LoadingButton for submit
      <LoadingButton
        type="submit"
        isLoading={isSubmitting}
        loadingText="Saving..."
      >
        Submit
      </LoadingButton>
```

### 7. Field Patterns

For each field, use appropriate pattern:

**Text Input**:
```typescript
- [ ] <FormField
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

**Number Input**:
```typescript
- [ ] <Input
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
```

**Date Picker** (see FORMS_REFERENCE.md for full pattern):
```typescript
- [ ] Add date picker with Calendar and Popover components
```

**Select** (see FORMS_REFERENCE.md for full pattern):
```typescript
- [ ] Add Select with SelectTrigger and SelectContent
```

**Textarea with counter**:
```typescript
- [ ] <Textarea {...field} maxLength={1000} />
      <CharacterCounter current={field.value?.length || 0} max={1000} />
```

### 8. Testing

- [ ] Test form renders without errors
- [ ] Test all field inputs work correctly
- [ ] Test all validation rules trigger properly
- [ ] Test error messages display correctly
- [ ] Test successful submission flow
- [ ] Test API error handling
- [ ] Test loading states during submission
- [ ] Test form reset after successful submission (if applicable)
- [ ] Test date transformations (if applicable)
- [ ] Test cross-field validations (if applicable)

---

## Migration Checklist

Use this when migrating an existing form to React Hook Form + Zod.

### Phase 1: Analysis

- [ ] Identify current form implementation pattern (useState, custom hooks, etc.)
- [ ] List all form fields and their current validation
- [ ] Identify all submission logic and API calls
- [ ] Note any special behaviors (conditional fields, dynamic arrays, etc.)
- [ ] Check for date handling requirements
- [ ] Identify current error handling approach

### Phase 2: Preparation

- [ ] Read the file using Read tool to understand current implementation
- [ ] Check if shared validation schemas exist for fields
- [ ] Create new shared schemas if needed (add to `patterns.ts`)
- [ ] Plan the migration approach (big bang vs incremental)

### Phase 3: Schema Creation

```typescript
- [ ] Create Zod schema matching current validation
      const formSchema = z.object({
        // Map each field to Zod schema
      })

- [ ] Add .refine() for any cross-field validation
      .refine((data) => condition, {
        message: 'Error message',
        path: ['fieldName'],
      })

- [ ] Infer TypeScript type
      type FormData = z.infer<typeof formSchema>
```

### Phase 4: Replace State Management

**Remove**:
```typescript
- [ ] Remove individual useState calls for each field
      ❌ const [name, setName] = useState('')
      ❌ const [email, setEmail] = useState('')

- [ ] Remove manual error state
      ❌ const [errors, setErrors] = useState({})

- [ ] Remove manual validation logic
      ❌ if (!name) setErrors({ name: 'Required' })
```

**Add**:
```typescript
- [ ] Add useForm hook
      const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          name: '',
          email: '',
        },
      })

- [ ] Extract isSubmitting
      const { isSubmitting } = form.formState
```

### Phase 5: Update Submit Handler

**Before**:
```typescript
❌ const handleSubmit = async (e) => {
     e.preventDefault()
     // Manual validation
     // Submit logic
   }
```

**After**:
```typescript
✅ const onSubmit = async (data: FormData) => {
     // Transform dates if needed
     const payload = {
       ...data,
       dateField: dateToISOString(data.dateField),
     }

     // Submit logic (validation already done)
     await apiClient.post('/api/endpoint', payload)
   }
```

- [ ] Remove `e.preventDefault()` (handled by React Hook Form)
- [ ] Remove manual validation code
- [ ] Update to use validated data parameter
- [ ] Add date transformations if needed
- [ ] Keep API calls and success/error handling

### Phase 6: Update Form JSX

**Remove**:
```typescript
- [ ] Remove manual form element
      ❌ <form onSubmit={handleSubmit}>

- [ ] Remove individual value/onChange props
      ❌ <input value={name} onChange={(e) => setName(e.target.value)} />

- [ ] Remove manual error displays
      ❌ {errors.name && <span>{errors.name}</span>}
```

**Add**:
```typescript
- [ ] Wrap with Form component
      ✅ <Form {...form}>

- [ ] Update form element
      ✅ <form onSubmit={form.handleSubmit(onSubmit)}>

- [ ] Convert each input to FormField pattern
      ✅ <FormField
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

### Phase 7: Update Submit Button

**Before**:
```typescript
❌ <Button type="submit" disabled={isLoading}>
     {isLoading ? 'Saving...' : 'Submit'}
   </Button>
```

**After**:
```typescript
✅ <LoadingButton
     type="submit"
     isLoading={isSubmitting}
     loadingText="Saving..."
   >
     Submit
   </LoadingButton>
```

- [ ] Replace Button with LoadingButton
- [ ] Update loading state to use isSubmitting
- [ ] Remove manual loading text logic

### Phase 8: Handle Special Cases

**Dynamic Fields (useFieldArray)**:
```typescript
- [ ] Identify arrays of fields
- [ ] Import useFieldArray
      import { useFieldArray } from 'react-hook-form'

- [ ] Setup field array
      const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'arrayFieldName',
      })

- [ ] Update JSX to use fields.map with FormField pattern
      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={form.control}
          name={`arrayFieldName.${index}.fieldName`}
          // ...
        />
      ))}
```

**Conditional Fields**:
```typescript
- [ ] Keep conditional rendering logic
- [ ] Ensure schema handles optional fields
      fieldName: z.string().optional()

- [ ] Add .refine() for conditional validation if needed
```

### Phase 9: Testing

- [ ] Type check passes (`npm run type-check`)
- [ ] Form renders without errors
- [ ] All fields accept input correctly
- [ ] All validation rules work as before
- [ ] Submission flow works correctly
- [ ] Error handling works correctly
- [ ] Loading states display properly
- [ ] No regressions from original behavior

### Phase 10: Cleanup

- [ ] Remove unused imports (useState, etc.)
- [ ] Remove unused state variables
- [ ] Remove manual validation functions
- [ ] Remove old error handling code
- [ ] Format code
- [ ] Add comments if needed for complex logic

---

## Quality Assurance Checklist

Use this for final review before considering the form complete.

### Code Quality

- [ ] All imports are organized and necessary
- [ ] Type safety: FormData type is inferred from schema
- [ ] No `any` types used (except error handling)
- [ ] Shared validation schemas used where appropriate
- [ ] Code follows project conventions (see CLAUDE.md)
- [ ] No console.log or debug code left behind
- [ ] Proper TypeScript strict mode compliance

### Validation

- [ ] All required fields are validated
- [ ] Field-level validation messages are clear and helpful
- [ ] Cross-field validation works correctly (if applicable)
- [ ] Validation triggers at appropriate times (onSubmit, onBlur, etc.)
- [ ] No validation logic duplicated between frontend and backend

### User Experience

- [ ] Loading states provide clear feedback
- [ ] Error messages are user-friendly
- [ ] Success feedback is provided (toast, redirect, etc.)
- [ ] Form is keyboard accessible (tab navigation works)
- [ ] Input types match field purpose (email, number, tel, etc.)
- [ ] Number inputs select on focus for easy editing
- [ ] Date pickers are intuitive
- [ ] Character counters show for long text fields
- [ ] Disabled states are visually clear

### Accessibility

- [ ] All form fields have labels
- [ ] FormLabel components are used (connects label to input)
- [ ] Error messages are associated with fields (FormMessage)
- [ ] Form-level errors are announced (FormError with role="alert")
- [ ] Buttons have descriptive text
- [ ] Focus management is logical

### Performance

- [ ] Form doesn't re-render unnecessarily
- [ ] Heavy computations are memoized if needed
- [ ] API calls are debounced if needed (search, autocomplete)
- [ ] Large lists use virtualization if needed

### Data Handling

- [ ] Dates are transformed correctly for API (Date -> ISO string)
- [ ] Dates are parsed correctly from API (ISO string -> Date)
- [ ] Numbers are parsed from string inputs correctly
- [ ] Optional fields handle null/undefined correctly
- [ ] Arrays and nested objects are handled correctly (useFieldArray)

### Error Handling

- [ ] Form-level errors display properly (FormError)
- [ ] Field-level errors display properly (FormMessage)
- [ ] API errors are caught and displayed
- [ ] Network errors are handled gracefully
- [ ] User is notified of all error states

### Integration

- [ ] API endpoints work correctly with submitted data
- [ ] Store updates correctly after submission (if using Zustand)
- [ ] Dialogs close correctly after success (if applicable)
- [ ] Navigation works correctly after success (if applicable)
- [ ] Optimistic updates work correctly (if applicable)

### Testing Coverage

- [ ] Happy path: form submits successfully
- [ ] Validation errors: all rules trigger correctly
- [ ] API errors: handled and displayed
- [ ] Loading states: show during submission
- [ ] Edge cases: empty strings, nulls, extremes
- [ ] Cross-field validation works
- [ ] Dynamic fields add/remove correctly (if applicable)
- [ ] Reset form works (if applicable)

---

## Common Pitfalls

### ❌ Pitfall 1: Not Spreading Field Props

**Wrong**:
```typescript
<Input value={field.value} onChange={field.onChange} />
```

**Correct**:
```typescript
<Input {...field} />
```

### ❌ Pitfall 2: Forgetting to Parse Number Inputs

**Wrong**:
```typescript
<Input type="number" {...field} />
// field.value will be a string!
```

**Correct**:
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

### ❌ Pitfall 3: Not Transforming Dates for API

**Wrong**:
```typescript
await apiClient.post('/api/endpoint', data)
// Date objects sent to API will cause errors
```

**Correct**:
```typescript
const payload = {
  ...data,
  dateOfBirth: dateToISOString(data.dateOfBirth),
}
await apiClient.post('/api/endpoint', payload)
```

### ❌ Pitfall 4: Using Old Zod Syntax

**Wrong**:
```typescript
z.date({ required_error: 'Required', invalid_type_error: 'Invalid' })
```

**Correct**:
```typescript
z.date() // Simpler Zod 3.x syntax
```

### ❌ Pitfall 5: Forgetting zodResolver

**Wrong**:
```typescript
const form = useForm({
  defaultValues: { ... },
})
// No validation!
```

**Correct**:
```typescript
const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { ... },
})
```

### ❌ Pitfall 6: Not Initializing All Fields

**Wrong**:
```typescript
const form = useForm({
  resolver: zodResolver(formSchema),
})
// defaultValues: undefined
```

**Correct**:
```typescript
const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: '',
    email: '',
    age: 0,
  },
})
```

### ❌ Pitfall 7: Manual preventDefault

**Wrong**:
```typescript
const onSubmit = async (e, data) => {
  e.preventDefault() // Already handled by React Hook Form
}

<form onSubmit={(e) => onSubmit(e, form.getValues())}>
```

**Correct**:
```typescript
const onSubmit = async (data: FormData) => {
  // No e.preventDefault needed
}

<form onSubmit={form.handleSubmit(onSubmit)}>
```

### ❌ Pitfall 8: Inline Schema Definition Without Type

**Wrong**:
```typescript
const form = useForm({
  resolver: zodResolver(z.object({ name: z.string() })),
})
// Can't infer type for onSubmit
```

**Correct**:
```typescript
const formSchema = z.object({ name: z.string() })
type FormData = z.infer<typeof formSchema>

const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
})
```

### ❌ Pitfall 9: Not Handling Optional Fields in Schema

**Wrong**:
```typescript
const schema = z.object({
  description: z.string(), // Required
})
```

**Correct**:
```typescript
const schema = z.object({
  description: z.string().optional().nullable(),
  // or use descriptionSchema from patterns.ts
})
```

### ❌ Pitfall 10: Using isLoading Instead of isSubmitting

**Wrong**:
```typescript
const [isLoading, setIsLoading] = useState(false)

<LoadingButton isLoading={isLoading}>Submit</LoadingButton>
```

**Correct**:
```typescript
const { isSubmitting } = form.formState

<LoadingButton isLoading={isSubmitting}>Submit</LoadingButton>
```

---

## Quick Migration Template

Copy this template for quick migrations:

```typescript
// BEFORE
const [field1, setField1] = useState('')
const [field2, setField2] = useState('')
const [errors, setErrors] = useState({})
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async (e) => {
  e.preventDefault()
  // validation
  // submit
}

// AFTER
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { LoadingButton } from '@/components/forms'
import { field1Schema, field2Schema } from '@/lib/forms/patterns'

const formSchema = z.object({
  field1: field1Schema,
  field2: field2Schema,
})

type FormData = z.infer<typeof formSchema>

const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    field1: '',
    field2: '',
  },
})

const { isSubmitting } = form.formState

const onSubmit = async (data: FormData) => {
  // submit (validation already done)
}

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="field1"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Field 1</FormLabel>
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
```

---

## Resources

- **Comprehensive Guide**: `docs/FORMS_GUIDE.md`
- **Quick Reference**: `docs/FORMS_REFERENCE.md`
- **Validation Schemas**: `src/lib/forms/patterns.ts`
- **Form Components**: `src/components/forms/`
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
