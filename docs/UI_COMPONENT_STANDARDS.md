# UI Component Standards

**Last Updated**: January 2026

This guide establishes standards for UI components, Tailwind CSS usage, layout patterns, and state visualization in the Rowad Speedball platform.

## Table of Contents
- [Radix UI Component Usage](#radix-ui-component-usage)
- [Tailwind CSS Conventions](#tailwind-css-conventions)
- [Layout Patterns](#layout-patterns)
- [State UI Patterns](#state-ui-patterns)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)

---

## Radix UI Component Usage

The application uses Radix UI primitives with custom styling. All Radix components are wrapped in `src/components/ui/`.

### Dialog Pattern

**Location**: `src/components/ui/dialog.tsx`

**Standard Usage**:
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text
      </DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

**Form Dialog Pattern**:
```typescript
<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>Create Player</DialogTitle>
  </DialogHeader>
  <PlayerForm onSuccess={() => setOpen(false)} />
</DialogContent>
```

**Size Variants**:
- Small: `sm:max-w-[400px]`
- Default: `sm:max-w-[600px]`
- Large: `sm:max-w-[800px]`
- Extra Large: `sm:max-w-[1000px]`

**Scrollable Content**:
```typescript
className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
```

### Select/Dropdown Pattern

**Location**: `src/components/ui/select.tsx`

**Standard Usage**:
```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**With Form Field**:
```typescript
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

### Button Pattern

**Location**: `src/components/ui/button.tsx`

**Variants**:
```typescript
// Primary action (default)
<Button>Primary Action</Button>

// Secondary action
<Button variant="outline">Secondary</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Ghost (minimal)
<Button variant="ghost">Cancel</Button>

// Link style
<Button variant="link">Learn More</Button>
```

**Sizes**:
```typescript
<Button size="sm">Small</Button>      // Height: 36px
<Button size="default">Default</Button> // Height: 40px
<Button size="lg">Large</Button>       // Height: 44px
<Button size="icon">🔍</Button>       // Square: 40x40px
```

**With Icon**:
```typescript
import { Plus } from 'lucide-react'

<Button className="gap-2">
  <Plus className="h-4 w-4" />
  Create Player
</Button>
```

### Card Pattern

**Location**: `src/components/ui/card.tsx`

**Standard Usage**:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

**Common Patterns**:
```typescript
// Error state card
<Card className="border-destructive">
  <CardContent>
    <p className="text-destructive">Error message</p>
  </CardContent>
</Card>

// Content section card
<Card>
  <CardContent className="p-6">
    {/* Main content */}
  </CardContent>
</Card>

// Stats card
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium">Total Players</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">1,234</div>
  </CardContent>
</Card>
```

### Badge Pattern

**Location**: `src/components/ui/badge.tsx`

**Variants**:
```typescript
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

**Common Usage**:
```typescript
// Status badges
<Badge variant="outline" className="text-green-600 border-green-600">
  Active
</Badge>

<Badge variant="outline" className="text-red-600 border-red-600">
  Inactive
</Badge>

// Count badges
<Badge variant="secondary">{count}</Badge>
```

### Alert Dialog Pattern

**Location**: `src/components/ui/alert-dialog.tsx`

**Standard Confirmation Pattern**:
```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the player.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-destructive">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Tailwind CSS Conventions

### Spacing Scale

**Container Padding** (Responsive):
```typescript
className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8"
```

**Standard Spacing**:
- `gap-2` (8px) - Tight spacing (icons + text)
- `gap-4` (16px) - Default spacing (form fields, card sections)
- `gap-6` (24px) - Loose spacing (major sections)
- `gap-8` (32px) - Section separation

**Padding**:
- `p-2` - Tight (8px)
- `p-4` - Default (16px)
- `p-6` - Comfortable (24px)
- `p-8` - Spacious (32px)

**Margin**:
- `mt-2`, `mb-2` - Tight vertical spacing
- `mt-4`, `mb-4` - Default vertical spacing
- `mt-6`, `mb-6` - Section spacing

### Responsive Breakpoints

**Breakpoint Values**:
- `sm:` - 640px and up (tablets)
- `md:` - 768px and up (small laptops)
- `lg:` - 1024px and up (desktops)
- `xl:` - 1280px and up (large desktops)
- `2xl:` - 1536px and up (extra large)

**Mobile-First Pattern**:
```typescript
// Base (mobile): Small padding, single column
// sm+: Medium padding, flexible layout
// md+: Larger padding, multi-column

className="px-2 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8"
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
```

**Common Responsive Patterns**:
```typescript
// Hide on mobile, show on desktop
className="hidden md:block"

// Full width on mobile, max width on desktop
className="w-full md:max-w-md"

// Stack on mobile, horizontal on desktop
className="flex flex-col sm:flex-row gap-4"

// Text size responsive
className="text-sm sm:text-base md:text-lg"
```

### Color Usage

**Semantic Colors** (from theme):
- `bg-background` - Page background
- `bg-card` - Card background
- `bg-muted` - Muted background (secondary sections)
- `bg-primary` - Primary brand color
- `bg-destructive` - Error/delete actions
- `bg-accent` - Accent highlights

**Text Colors**:
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `text-primary` - Primary brand text
- `text-destructive` - Error text

**Border Colors**:
- `border` - Default border
- `border-destructive` - Error border
- `border-primary` - Primary brand border

**Opacity Modifiers**:
```typescript
bg-destructive/10    // 10% opacity background
border-destructive/20 // 20% opacity border
text-muted-foreground/70 // 70% opacity text
```

### Typography Classes

**Text Sizes**:
```typescript
text-xs     // 12px - Small labels, captions
text-sm     // 14px - Secondary text, form labels
text-base   // 16px - Body text (default)
text-lg     // 18px - Emphasized text
text-xl     // 20px - Subheadings
text-2xl    // 24px - Headings
text-3xl    // 30px - Large headings
text-4xl    // 36px - Page titles
```

**Font Weights**:
```typescript
font-normal    // 400 - Body text
font-medium    // 500 - Emphasized text
font-semibold  // 600 - Subheadings
font-bold      // 700 - Headings
```

**Line Heights**:
```typescript
leading-none      // 1
leading-tight     // 1.25
leading-normal    // 1.5 (default)
leading-relaxed   // 1.625
```

**Standard Typography Patterns**:
```typescript
// Page title
className="text-3xl font-bold"

// Section heading
className="text-2xl font-semibold"

// Subsection heading
className="text-xl font-semibold"

// Body text
className="text-base text-muted-foreground"

// Small label
className="text-sm font-medium"

// Caption
className="text-xs text-muted-foreground"
```

---

## Layout Patterns

### Page Layout Structure

**Standard Page Pattern**:
```typescript
// src/app/[feature]/page.tsx
<div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8">
  {/* Page Header */}
  <PageHeader
    icon={FeatureIcon}
    title="Feature Name"
    description="Feature description"
    actionDialogs={[...]}
  />

  {/* Stats Section (optional) */}
  <FeatureStats stats={stats} />

  {/* Main Content Card */}
  <Card>
    <CardContent className="p-6">
      {/* Feature content (table, list, etc.) */}
    </CardContent>
  </Card>
</div>
```

**Reference**: `src/app/players/page.tsx:60-100`

### PageHeader Component

**Location**: `src/components/ui/page-header.tsx`

**Usage**:
```typescript
import { PageHeader } from '@/components/ui'
import { Volleyball } from 'lucide-react'

<PageHeader
  icon={Volleyball}
  title="Players"
  description="Browse and manage all registered players"
  actionDialogs={[
    {
      open: dialogOpen,
      onOpenChange: setDialogOpen,
      trigger: <Button>Create Player</Button>,
      content: <PlayerForm onSuccess={() => setDialogOpen(false)} />,
    },
  ]}
/>
```

### Card Usage for Content Sections

**Main Content Card**:
```typescript
<Card>
  <CardContent className="p-6">
    {/* Table, form, or other content */}
  </CardContent>
</Card>
```

**Multiple Content Sections**:
```typescript
<div className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>Section 1</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Section 1 content */}
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Section 2</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Section 2 content */}
    </CardContent>
  </Card>
</div>
```

### Grid vs Flexbox Layout

**When to Use Grid**:
```typescript
// Equal-width columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

// Stats cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <StatsCard title="Total" value={100} />
  <StatsCard title="Active" value={85} />
  <StatsCard title="Inactive" value={15} />
  <StatsCard title="New" value={5} />
</div>
```

**When to Use Flexbox**:
```typescript
// Navigation/toolbar with justify-between
<div className="flex items-center justify-between mb-4">
  <h2 className="text-xl font-semibold">Title</h2>
  <Button>Action</Button>
</div>

// Icon + text combinations
<div className="flex items-center gap-2">
  <Icon className="h-4 w-4" />
  <span>Label</span>
</div>

// Form button groups
<div className="flex items-center gap-2 justify-end">
  <Button variant="outline">Cancel</Button>
  <Button>Submit</Button>
</div>
```

---

## State UI Patterns

### Loading States

**Full-Page Loading**:

**Location**: `src/components/ui/loading.tsx`

```typescript
import Loading from '@/components/ui/loading'

if (isLoading) {
  return <Loading />
}
```

**Component**: Displays centered spinner on full viewport.

**Inline Loading (Forms)**:

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

**Reference**: `src/components/forms/loading-button.tsx`

**Skeleton Loading** (for data tables):

```typescript
import { Skeleton } from '@/components/ui/skeleton'

<div className="space-y-2">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
</div>
```

### Error States

**Page-Level Error**:

```typescript
if (error) {
  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8">
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={clearError} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Reference**: `src/app/players/page.tsx:45-58`

**Form-Level Error**:

**Location**: `src/components/forms/form-error.tsx`

```typescript
import { FormError } from '@/components/forms/form-error'

const [error, setError] = useState<string | null>(null)

<FormError error={error} />
```

**Component Features**:
- AlertCircle icon
- Red destructive color scheme
- `role="alert"` for accessibility
- Only renders when error exists

**Reference**: `src/components/forms/form-error.tsx`

### Empty States

**Location**: `src/components/ui/empty-state.tsx`

```typescript
import EmptyState from '@/components/ui/empty-state'
import { Users } from 'lucide-react'

{players.length === 0 && !isLoading && (
  <EmptyState
    icon={Users}
    title="No players found"
    description="Get started by creating your first player"
  />
)}
```

**Component Features**:
- Card wrapper
- Large icon (12x12)
- Title and description
- Muted colors for non-critical state

**Reference**: `src/components/ui/empty-state.tsx`

### Unauthorized State

**Location**: `src/components/ui/unauthorized.tsx`

```typescript
import { Unauthorized } from '@/components/ui/unauthorized'

if (!isAuthenticated) {
  return <Unauthorized />
}
```

**Usage Pattern** (in protected pages):
```typescript
const { isAuthenticated, isLoading } = useRoles()

if (isLoading) return <Loading />
if (!isAuthenticated) return <Unauthorized />

return <ProtectedContent />
```

---

## Responsive Design

### Mobile-First Approach

**Always start with mobile styles, then add larger breakpoint styles**:

```typescript
// ✅ Good: Mobile-first
className="text-sm sm:text-base md:text-lg"

// ❌ Bad: Desktop-first
className="text-lg md:text-base sm:text-sm"
```

### Responsive Spacing

**Container Spacing** (Consistent across all pages):
```typescript
className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8"
```

**Card Padding**:
```typescript
// Mobile: Tight padding
// Desktop: Comfortable padding
className="p-4 sm:p-6"
```

### Responsive Grids

**Auto-responsive Grid**:
```typescript
// 1 column on mobile, 2 on tablet, 3 on desktop
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

// 1 column on mobile, 2 on tablet, 4 on desktop (stats)
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
```

### Touch Target Sizes

**Minimum Touch Target**: 44x44px (WCAG AAA)

**Button Sizes**:
```typescript
<Button size="sm">Label</Button>     // 36px height (mobile ok for secondary)
<Button size="default">Label</Button> // 40px height (recommended minimum)
<Button size="lg">Label</Button>      // 44px height (best for primary mobile actions)
```

**Icon Buttons**:
```typescript
// Minimum 40x40px
<Button size="icon">
  <Icon className="h-4 w-4" />
</Button>
```

### Responsive Tables

**Hide columns on mobile**:
```typescript
// Table cell
<TableCell className="hidden md:table-cell">
  {value}
</TableCell>
```

**Stack on mobile**:
```typescript
// Use table-core system which handles responsive design automatically
// OR implement card view for mobile, table for desktop
```

### Responsive Typography

**Standard Responsive Text Sizes**:
```typescript
// Page titles
className="text-2xl sm:text-3xl md:text-4xl font-bold"

// Section headings
className="text-xl sm:text-2xl font-semibold"

// Body text (usually doesn't need responsive sizing)
className="text-base"
```

---

## Accessibility

### Semantic HTML

**Use semantic elements**:
```typescript
// ✅ Good
<nav>...</nav>
<main>...</main>
<header>...</header>
<section>...</section>

// ❌ Bad
<div className="nav">...</div>
<div className="main">...</div>
```

### ARIA Labels

**Form Errors** (automatically handled):
```typescript
<FormError error={error} /> // Has role="alert"
```

**Icon Buttons** (always include aria-label):
```typescript
<Button size="icon" aria-label="Delete player">
  <Trash className="h-4 w-4" />
</Button>
```

**Loading States**:
```typescript
<LoadingButton isLoading={true}>
  {/* Loader2 icon has aria-hidden="true" by default */}
  Saving...
</LoadingButton>
```

### Keyboard Navigation

**All interactive elements must be keyboard accessible**:
- Buttons: `Enter` and `Space` (handled by default)
- Links: `Enter` (handled by default)
- Dialogs: `Esc` to close (Radix UI handles this)
- Forms: `Tab` navigation between fields

**Focus States** (automatically styled by Tailwind):
```typescript
// All interactive elements should show focus ring
className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
```

### Color Contrast

**Minimum Contrast Ratios** (WCAG AA):
- Normal text: 4.5:1
- Large text (18px+): 3:1

**Use semantic colors** (automatically meet contrast requirements):
- `text-foreground` on `bg-background`
- `text-destructive` on `bg-destructive/10`
- `text-muted-foreground` for secondary text

### Screen Reader Support

**Radix UI components** include built-in screen reader support:
- Dialog: Announces title and description
- Select: Announces options
- Checkbox: Announces checked state
- Form fields: Labels properly associated

**Always include labels**:
```typescript
// ✅ Good
<FormLabel>Player Name</FormLabel>
<FormControl>
  <Input {...field} />
</FormControl>

// ❌ Bad (no label)
<Input placeholder="Player Name" {...field} />
```

---

## Quick Reference

### Standard Page Layout
```typescript
<div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8">
  <PageHeader icon={Icon} title="Title" description="Description" />
  <Card>
    <CardContent className="p-6">
      {/* Content */}
    </CardContent>
  </Card>
</div>
```

### Standard Form Dialog
```typescript
<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>Form Title</DialogTitle>
  </DialogHeader>
  <Form {...form}>
    {/* Form fields */}
    <FormError error={error} />
    <LoadingButton isLoading={isSubmitting}>Submit</LoadingButton>
  </Form>
</DialogContent>
```

### Standard Error State
```typescript
<Card className="border-destructive">
  <CardContent className="p-6">
    <p className="text-destructive">Error: {error}</p>
    <Button onClick={retry} className="mt-4">Try Again</Button>
  </CardContent>
</Card>
```

### Standard Empty State
```typescript
<EmptyState
  icon={Icon}
  title="No items found"
  description="Get started by creating your first item"
/>
```

---

## Related Documentation

- **Component Standards**: See [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md) - Component structure, organization, patterns
- **Forms Guide**: See [`FORMS_GUIDE.md`](./FORMS_GUIDE.md) - Form development patterns
- **State Management**: See [`STATE_MANAGEMENT_STANDARDS.md`](./STATE_MANAGEMENT_STANDARDS.md) - Zustand store patterns
- **Naming Conventions**: See [`NAMING_CONVENTIONS.md`](./NAMING_CONVENTIONS.md) - Comprehensive naming standards

---

## Reference Implementations

**Page Layout**: `src/app/players/page.tsx`
**Form Components**: `src/components/players/player-form.tsx`
**Loading States**: `src/components/ui/loading.tsx`, `src/components/forms/loading-button.tsx`
**Error States**: `src/components/forms/form-error.tsx`
**Empty States**: `src/components/ui/empty-state.tsx`
**All UI Components**: `src/components/ui/`
