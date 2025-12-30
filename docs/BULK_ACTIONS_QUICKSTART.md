# Bulk Actions Quick Start

A step-by-step guide to add bulk actions to your table in 5 minutes.

## Quick Setup Checklist

- [ ] Enable row selection in table config
- [ ] Add selection column
- [ ] Add row selection state
- [ ] Define bulk actions
- [ ] Add BulkActionsToolbar
- [ ] Implement action handlers
- [ ] Add confirmation dialogs

---

## Step 1: Enable Row Selection (30 seconds)

**File**: `src/config/tables/your-entity.config.ts`

```typescript
export const yourEntityTableConfig: TableConfig<YourEntity> = {
  features: {
    selection: true,  // ← Add this
    // ... other features
  },
}
```

---

## Step 2: Add Selection Column (1 minute)

**File**: `src/config/tables/columns/your-entity-columns.tsx`

```typescript
import { createSelectionColumn } from '@/lib/table-core'

export function createYourEntityColumns({
  enableSelection = false,  // ← Add this param
  // ... other options
}: CreateColumnsOptions): ColumnDef<YourEntity>[] {
  const baseColumns: ColumnDef<YourEntity>[] = []

  // ← Add this block
  if (enableSelection) {
    baseColumns.push(createSelectionColumn<YourEntity>())
  }

  // ... rest of columns
  return baseColumns
}
```

---

## Step 3: Add Row Selection State (1 minute)

**File**: `src/app/your-entity/components/your-entity-table.tsx`

```typescript
import { RowSelectionState } from '@tanstack/react-table'
import { getSelectedItems, BulkActionsToolbar } from '@/lib/table-core'

export default function YourEntityTable({ entities, ... }) {
  // ← Add these states
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const selectedItems = React.useMemo(
    () => getSelectedItems(entities, rowSelection),
    [entities, rowSelection]
  )

  const handleClearSelection = React.useCallback(() => {
    setRowSelection({})
  }, [])

  // ... rest of component
}
```

---

## Step 4: Pass to BaseDataTable (30 seconds)

```typescript
<BaseDataTable
  enableRowSelection={yourEntityTableConfig.features.selection}  // ← Add
  rowSelection={rowSelection}                                     // ← Add
  onRowSelectionChange={setRowSelection}                         // ← Add
  // ... other props
/>
```

---

## Step 5: Define Bulk Actions (1 minute)

```typescript
const bulkActions = React.useMemo(() => {
  const actions = []

  // Add delete action
  if (canDelete) {
    actions.push({
      label: `Delete ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}`,
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: handleBulkDelete,
    })
  }

  // Add more actions as needed
  // actions.push({ ... })

  return actions
}, [canDelete, selectedItems.length, handleBulkDelete])
```

---

## Step 6: Add BulkActionsToolbar (30 seconds)

```typescript
return (
  <div className="space-y-4">
    {/* ← Add this block */}
    {selectedItems.length > 0 && (
      <BulkActionsToolbar
        selectedCount={selectedItems.length}
        onClearSelection={handleClearSelection}
        actions={bulkActions}
      />
    )}

    {/* Your table */}
    <BaseDataTable ... />
  </div>
)
```

---

## Step 7: Implement Bulk Delete Handler (2 minutes)

```typescript
// States
const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)
const [isBulkDeleting, setIsBulkDeleting] = React.useState(false)

// Open dialog
const handleBulkDelete = React.useCallback(() => {
  if (selectedItems.length === 0) return
  setBulkDeleteDialogOpen(true)
}, [selectedItems])

// Confirm delete
const handleConfirmBulkDelete = React.useCallback(async () => {
  setIsBulkDeleting(true)
  try {
    await Promise.all(selectedItems.map(item => deleteEntity(item.id)))
    setBulkDeleteDialogOpen(false)
    handleClearSelection()
    onRefetch?.()
  } catch (error) {
    console.error('Bulk delete failed:', error)
  } finally {
    setIsBulkDeleting(false)
  }
}, [selectedItems, deleteEntity, handleClearSelection, onRefetch])
```

---

## Step 8: Add Confirmation Dialog (1 minute)

```typescript
<AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        Delete {selectedItems.length} Item{selectedItems.length !== 1 ? 's' : ''}?
      </AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleConfirmBulkDelete}
        disabled={isBulkDeleting}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isBulkDeleting ? 'Deleting...' : 'Delete'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Complete Example

Here's a minimal working example:

```typescript
'use client'

import * as React from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import {
  BaseDataTable,
  BulkActionsToolbar,
  getSelectedItems,
} from '@/lib/table-core'
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

export default function YourEntityTable({ entities, ... }) {
  // Row selection
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const selectedItems = React.useMemo(
    () => getSelectedItems(entities, rowSelection),
    [entities, rowSelection]
  )

  // Bulk delete
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleClearSelection = React.useCallback(() => {
    setRowSelection({})
  }, [])

  const handleBulkDelete = React.useCallback(() => {
    setBulkDeleteOpen(true)
  }, [])

  const handleConfirmDelete = React.useCallback(async () => {
    setIsDeleting(true)
    try {
      await Promise.all(selectedItems.map(item => deleteEntity(item.id)))
      setBulkDeleteOpen(false)
      handleClearSelection()
      onRefetch?.()
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedItems, deleteEntity, handleClearSelection, onRefetch])

  const bulkActions = React.useMemo(() => [{
    label: `Delete ${selectedItems.length}`,
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive' as const,
    onClick: handleBulkDelete,
  }], [selectedItems.length, handleBulkDelete])

  return (
    <div className="space-y-4">
      {selectedItems.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedItems.length}
          onClearSelection={handleClearSelection}
          actions={bulkActions}
        />
      )}

      <BaseDataTable
        data={entities}
        columns={columns}
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        {...otherProps}
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.length} Items?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

---

## Common Bulk Actions

### Export Selected

```typescript
const handleBulkExport = React.useCallback(() => {
  exportToCSV(
    selectedItems,
    [{ key: 'name', label: 'Name' }, ...],
    `selected-${Date.now()}.csv`
  )
}, [selectedItems])
```

### Update Status

```typescript
const handleBulkUpdateStatus = React.useCallback(async (newStatus: string) => {
  await Promise.all(
    selectedItems.map(item => updateEntity(item.id, { status: newStatus }))
  )
  handleClearSelection()
  onRefetch()
}, [selectedItems])
```

### Archive/Unarchive

```typescript
const handleBulkArchive = React.useCallback(async () => {
  await Promise.all(
    selectedItems.map(item => archiveEntity(item.id))
  )
  handleClearSelection()
  onRefetch()
}, [selectedItems])
```

---

## Next Steps

- Read the full [Bulk Actions Guide](./BULK_ACTIONS_GUIDE.md) for advanced patterns
- See the [Players Table implementation](../src/app/players/components/players-table-refactored.tsx) for a complete example
- Learn about [Table Core](./table-core-guide.md) for more table features

---

## Troubleshooting

**Selections not working?**
- Check `enableRowSelection` is `true` on `BaseDataTable`
- Verify selection column is added to columns array
- Ensure `rowSelection` state is passed correctly

**Actions not showing?**
- Verify conditional rendering: `{selectedItems.length > 0 && ...}`
- Check that actions array is not empty
- Ensure BulkActionsToolbar is rendered before the table

**Performance issues?**
- Use `React.useMemo` for actions and selected items
- Use `React.useCallback` for handlers
- Consider debouncing if handling large datasets
