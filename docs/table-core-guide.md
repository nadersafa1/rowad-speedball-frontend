# Table Core - Entity Table Guide

This guide shows you how to create a new entity table using the `table-core` system in less than 30 minutes.

## Overview

The `table-core` system provides a reusable, type-safe foundation for building data tables with common features like:

- Row click navigation with keyboard support
- Row selection with bulk actions
- Search and filtering
- Sorting and pagination
- Column visibility toggle
- CSV/Excel export
- Loading skeletons and error states
- Responsive design

## Quick Start

Follow these steps to create a new entity table:

### Step 1: Create Table Configuration

Create a configuration file for your entity table in `/config/tables/`.

**File:** `/config/tables/[entity].config.ts`

```typescript
import { TableConfig } from '@/lib/table-core'
import { YourEntity, SortOrder } from '@/types'

export interface YourEntityTableFilters extends Record<string, unknown> {
  q?: string
  // Add your custom filters here
  status?: string
  category?: string
}

export const yourEntityTableConfig: TableConfig<
  YourEntity,
  YourEntityTableFilters
> = {
  entity: 'entity',
  entityPlural: 'entities',
  routing: {
    basePath: '/entities',
    detailPath: (id: string) => `/entities/${id}`,
  },
  features: {
    navigation: true, // Enable row click navigation
    search: true, // Enable global search
    filters: true, // Enable column filters
    sorting: true, // Enable column sorting
    pagination: true, // Enable pagination
    selection: false, // Enable row selection
    export: false, // Enable CSV export
    columnVisibility: true, // Enable column visibility toggle
  },
  defaultSort: {
    sortBy: 'name',
    sortOrder: SortOrder.ASC,
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
}
```

### Step 2: Create Column Definitions

Create column definitions using the table-core helpers in `/config/tables/columns/`.

**File:** `/config/tables/columns/[entity]-columns.tsx`

```typescript
import { ColumnDef } from '@tanstack/react-table'
import { YourEntity, SortOrder } from '@/types'
import {
  createSortableHeader,
  createTextColumn,
  createDateColumn,
  createBadgeColumn,
} from '@/lib/table-core'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CreateColumnsOptions {
  canEdit: boolean
  canDelete: boolean
  onEdit: (entity: YourEntity) => void
  onDelete: (entity: YourEntity) => void
  sortBy?: string
  sortOrder?: SortOrder
  onSort?: (columnId: string) => void
}

export function createYourEntityColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: CreateColumnsOptions): ColumnDef<YourEntity>[] {
  const baseColumns: ColumnDef<YourEntity>[] = [
    // Text column with sorting
    createTextColumn<YourEntity>('name', 'Name', (row) => row.name, {
      sortable: true,
      sortBy,
      sortOrder,
      onSort,
      className: 'font-medium',
    }),

    // Date column
    createDateColumn<YourEntity>(
      'createdAt',
      'Created',
      (row) => row.createdAt,
      {
        sortable: true,
        sortBy,
        sortOrder,
        onSort,
        format: 'MMM dd, yyyy',
      }
    ),

    // Badge column with variant mapping
    createBadgeColumn<YourEntity>('status', 'Status', (row) => row.status, {
      sortable: true,
      sortBy,
      sortOrder,
      onSort,
      variantMap: {
        active: 'default',
        inactive: 'secondary',
        pending: 'outline',
      },
    }),

    // Custom column with full control
    {
      accessorKey: 'customField',
      id: 'customField',
      header: () =>
        createSortableHeader(
          'Custom',
          'customField',
          sortBy,
          sortOrder,
          onSort
        ),
      cell: ({ row }) => {
        const value = row.getValue('customField') as string
        return <div className='text-sm'>{value}</div>
      },
    },
  ]

  // Add actions column if user has permissions
  if (canEdit || canDelete) {
    baseColumns.push({
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const entity = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(entity)
                  }}
                >
                  <Pencil className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(entity)
                  }}
                  className='text-destructive focus:text-destructive'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    })
  }

  return baseColumns
}
```

### Step 3: Create Table Component

Create your table component in `/app/[entity]/components/`.

**File:** `/app/[entity]/components/[entity]-table.tsx`

```typescript
'use client'

import * as React from 'react'
import { YourEntity, SortOrder } from '@/types'
import {
  BaseDataTable,
  TableControls,
  TableFilter,
  TablePagination,
  PaginationConfig,
  useTableSorting,
  useTableExport,
  useTableHandlers,
} from '@/lib/table-core'
import { yourEntityTableConfig } from '@/config/tables/[entity].config'
import { createYourEntityColumns } from '@/config/tables/columns/[entity]-columns'
import { useYourEntityPermissions } from '@/hooks/authorization/use-[entity]-permissions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useReactTable,
  getCoreRowModel,
  VisibilityState,
} from '@tanstack/react-table'

export interface YourEntityTableProps {
  entities: YourEntity[]
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange?: (search: string) => void
  searchValue?: string
  // Add custom filter props
  status?: string
  onStatusChange?: (status: string) => void
  sortBy?: string
  sortOrder?: SortOrder
  onSortingChange?: (sortBy?: string, sortOrder?: SortOrder) => void
  isLoading?: boolean
  onRefetch?: () => void
}

export default function YourEntityTable({
  entities,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  status,
  onStatusChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: YourEntityTableProps) {
  const { canUpdate, canDelete } = useYourEntityPermissions(null)

  // Use table handlers hook for edit/delete dialogs
  const {
    editingItem,
    editDialogOpen,
    handleEdit,
    handleEditSuccess,
    handleEditCancel,
    setEditDialogOpen,
    deletingItem,
    deleteDialogOpen,
    isDeleting,
    handleDelete,
    handleDeleteConfirm,
    handleDeleteCancel,
    setDeleteDialogOpen,
  } = useTableHandlers<YourEntity>({
    onRefetch,
    // Add deleteItem if using store-based deletion
    // deleteItem: deleteEntity,
  })

  // Column visibility state - hide optional columns by default
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      createdAt: false,
      updatedAt: false,
      // Add other optional columns here
    })

  // Use table sorting hook
  const { handleSort } = useTableSorting<YourEntity, string>({
    sortBy,
    sortOrder,
    onSortingChange: (newSortBy?: string, newSortOrder?: SortOrder) => {
      onSortingChange?.(newSortBy, newSortOrder)
    },
  })

  // Export hook
  const { handleExport, isExporting } = useTableExport<YourEntity>({
    data: entities,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At' },
    ],
    filename: 'entities',
    enabled: yourEntityTableConfig.features.export,
  })

  // Create columns
  const columns = React.useMemo(
    () =>
      createYourEntityColumns({
        canEdit: canUpdate,
        canDelete,
        onEdit: handleEdit,
        onDelete: handleDelete,
        sortBy,
        sortOrder,
        onSort: handleSort,
      }),
    [
      canUpdate,
      canDelete,
      handleEdit,
      handleDelete,
      sortBy,
      sortOrder,
      handleSort,
    ]
  )

  // Initialize table for column visibility control
  const table = useReactTable({
    data: entities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  })

  // Column label mapping helper
  const getColumnLabel = React.useCallback((columnId: string) => {
    const labels: Record<string, string> = {
      name: 'Name',
      status: 'Status',
      createdAt: 'Created',
      updatedAt: 'Updated',
    }
    return labels[columnId] || columnId
  }, [])

  // Filter reset handler
  const handleResetFilters = React.useCallback(() => {
    onSearchChange?.('')
    onStatusChange?.('all')
  }, [onSearchChange, onStatusChange])

  return (
    <div className='w-full space-y-4'>
      {/* Controls */}
      <TableControls<YourEntity>
        searchValue={searchValue}
        onSearchChange={onSearchChange || (() => {})}
        searchPlaceholder='Search entities...'
        table={table}
        getColumnLabel={getColumnLabel}
        exportEnabled={yourEntityTableConfig.features.export}
        onExport={handleExport}
        isExporting={isExporting}
        onResetFilters={handleResetFilters}
        showResetButton={true}
        filters={
          <TableFilter
            label='Status'
            htmlFor='status'
            className='w-full md:w-[200px]'
          >
            <Select
              name='status'
              value={status}
              onValueChange={(value) => onStatusChange?.(value)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select a Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
              </SelectContent>
            </Select>
          </TableFilter>
        }
      />

      {/* Table */}
      <BaseDataTable
        data={entities}
        columns={columns}
        pagination={pagination}
        isLoading={isLoading}
        enableNavigation={yourEntityTableConfig.features.navigation}
        emptyMessage='No entities found.'
        routingBasePath={yourEntityTableConfig.routing.basePath}
        routingDetailPath={yourEntityTableConfig.routing.detailPath}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        enableRowSelection={yourEntityTableConfig.features.selection}
      />

      {/* Pagination */}
      <TablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={yourEntityTableConfig.pageSizeOptions}
        showPageSizeSelector={true}
        showPageNumbers={true}
      />

      {/* Edit Entity Dialog */}
      <YourEntityEditDialog
        entity={editingItem}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        onCancel={handleEditCancel}
      />

      {/* Delete Entity Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{deletingItem?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
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

### Step 4: Use the Table in Your Page

Use the table component in your page.

**File:** `/app/[entity]/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import YourEntityTable from './components/[entity]-table'
import { useYourEntities } from './hooks/use-[entity]'

export default function EntitiesPage() {
  const [filters, setFilters] = useState({
    q: '',
    status: 'all',
    page: 1,
    limit: 25,
  })

  const { entities, isLoading, error, pagination, handlePageChange, refetch } =
    useYourEntities(filters)

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Entities</h1>

      <YourEntityTable
        entities={entities}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={(pageSize) => {
          setFilters({ ...filters, limit: pageSize, page: 1 })
        }}
        onSearchChange={(search) => {
          setFilters({ ...filters, q: search, page: 1 })
        }}
        searchValue={filters.q}
        status={filters.status}
        onStatusChange={(status) => {
          setFilters({ ...filters, status, page: 1 })
        }}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortingChange={(sortBy, sortOrder) => {
          setFilters({
            ...filters,
            sortBy: sortBy as YourEntityTableFilters['sortBy'],
            sortOrder,
            page: 1,
          })
        }}
        isLoading={isLoading}
        onRefetch={refetch}
      />
    </div>
  )
}
```

## Column Helper Functions

The table-core system provides several helper functions for creating columns:

### createTextColumn

Creates a text column with optional sorting.

```typescript
createTextColumn<TData>('columnId', 'Header Label', (row) => row.field, {
  sortable: true,
  sortBy,
  sortOrder,
  onSort,
  className: 'font-medium',
  fallback: 'N/A',
})
```

### createDateColumn

Creates a date column with formatting.

```typescript
createDateColumn<TData>('createdAt', 'Created', (row) => row.createdAt, {
  sortable: true,
  sortBy,
  sortOrder,
  onSort,
  format: 'MMM dd, yyyy', // date-fns format
})
```

### createBadgeColumn

Creates a badge column with variant mapping.

```typescript
createBadgeColumn<TData>('status', 'Status', (row) => row.status, {
  sortable: true,
  sortBy,
  sortOrder,
  onSort,
  variantMap: {
    active: 'default',
    inactive: 'secondary',
  },
  labelMap: {
    active: 'Active',
    inactive: 'Inactive',
  },
})
```

### createNumberColumn

Creates a number column with formatting.

```typescript
createNumberColumn<TData>('amount', 'Amount', (row) => row.amount, {
  format: 'currency', // 'decimal' | 'integer' | 'currency' | 'percentage'
  decimals: 2,
  currency: 'USD',
  sortable: true,
})
```

### createBooleanColumn

Creates a boolean column with badges.

```typescript
createBooleanColumn<TData>('isActive', 'Active', (row) => row.isActive, {
  trueLabel: 'Yes',
  falseLabel: 'No',
  trueBadge: 'default',
  falseBadge: 'secondary',
})
```

### createLinkColumn

Creates a clickable link column.

```typescript
createLinkColumn<TData>(
  'email',
  'Email',
  (row) => row.email,
  (row) => `mailto:${row.email}`
)
```

### createAvatarColumn

Creates an avatar column with image and optional text.

```typescript
createAvatarColumn<TData>('avatar', 'Player', {
  imageAccessorFn: (row) => row.avatarUrl,
  textAccessorFn: (row) => row.name,
  fallbackText: (row) => row.name.charAt(0).toUpperCase(),
  size: 'md', // 'sm' | 'md' | 'lg'
  shape: 'circle', // 'circle' | 'square'
  sortable: true,
  sortBy,
  sortOrder,
  onSort,
})
```

### createSortableHeader

Creates a sortable header with arrow icon.

```typescript
createSortableHeader('Name', 'name', sortBy, sortOrder, onSort)
```

## Export (CSV/Excel)

The table-core system includes built-in export functionality for both CSV and Excel formats.

### Using useTableExport Hook

**ALWAYS** use the `useTableExport` hook for export functionality. It handles loading states and provides a consistent API.

```typescript
import { useTableExport } from '@/lib/table-core'

// In your table component
const { handleExport, isExporting } = useTableExport<YourEntity>({
  data: entities,
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
  ],
  filename: 'entities',
  enabled: yourEntityTableConfig.features.export,
  format: 'csv', // or 'xlsx' for Excel export
})

// Pass to TableControls
<TableControls
  exportEnabled={yourEntityTableConfig.features.export}
  onExport={handleExport}
  isExporting={isExporting}
  // ... other props
/>
```

### Export Hook Options

```typescript
interface UseTableExportOptions<TData> {
  data: TData[]
  columns: { key: keyof TData; label: string }[]
  filename: string
  enabled?: boolean
  format?: 'csv' | 'xlsx' // Default: 'csv'
  selectedRows?: TData[] // Optional: Export only selected rows
}
```

**Features:**

- Automatically handles CSV/Excel formatting
- Downloads file directly to user's browser
- Supports nested object fields
- Handles null/undefined values gracefully
- Loading state management
- Optional: Export only selected rows
- Excel export with column width auto-sizing

## Filter Reset

When your table has multiple filters, **ALWAYS** implement a filter reset functionality.

### Implementation Pattern

```typescript
// In your table component
const handleResetFilters = React.useCallback(() => {
  onSearchChange?.('')
  onStatusChange?.(Status.ALL)
  onCategoryChange?.(undefined)
  onDateRangeChange?.(undefined)
  // Reset all filters to their default/empty state
}, [
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onDateRangeChange,
])

// Pass to TableControls
<TableControls
  onResetFilters={handleResetFilters}
  showResetButton={true}
  // ... other props
/>
```

The reset button will appear in the filters row when `showResetButton={true}` is set.

## Row Selection & Bulk Actions

The table-core system supports row selection with customizable bulk actions.

**📚 For complete bulk actions guide with examples, see:**

- **[Bulk Actions Guide](./BULK_ACTIONS_GUIDE.md)** - Comprehensive guide with patterns and examples
- **[Bulk Actions Quick Start](./BULK_ACTIONS_QUICKSTART.md)** - 5-minute setup guide

### Using useTableHandlers for Bulk Actions

For bulk delete operations, you can use the `useTableHandlers` hook:

```typescript
import { useTableHandlers } from '@/lib/table-core'

const {
  // ... other handlers
  handleBulkDeleteConfirm,
  handleBulkDeleteCancel,
  isBulkDeleting,
} = useTableHandlers<YourEntity>({
  deleteItem: deleteEntity, // Store-based deletion
  bulkDeleteItem: async (ids: string[]) => {
    // Custom bulk delete logic
    await Promise.all(ids.map((id) => deleteEntity(id)))
  },
  onRefetch,
})
```

### Enable Row Selection

1. **Enable in config:**

```typescript
export const yourEntityTableConfig: TableConfig<
  YourEntity,
  YourEntityTableFilters
> = {
  // ... other config
  features: {
    selection: true, // Enable row selection
    // ... other features
  },
}
```

2. **Add selection column to your columns:**

```typescript
import { createSelectionColumn } from '@/lib/table-core'

export function createYourEntityColumns({
  // ... other options
  enableSelection = false,
}: CreateColumnsOptions): ColumnDef<YourEntity>[] {
  const baseColumns: ColumnDef<YourEntity>[] = []

  // Add selection column if enabled
  if (enableSelection) {
    baseColumns.push(createSelectionColumn<YourEntity>())
  }

  // Add your other columns...
  baseColumns
    .push
    // ... your columns
    ()

  return baseColumns
}
```

3. **Add row selection state in your component:**

```typescript
import { RowSelectionState } from '@tanstack/react-table'
import { BulkActionsToolbar, getSelectedItems } from '@/lib/table-core'

export default function YourEntityTable(props) {
  // Row selection state
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // Get selected items
  const selectedItems = React.useMemo(
    () => getSelectedItems(entities, rowSelection),
    [entities, rowSelection]
  )

  // Clear selection handler
  const handleClearSelection = React.useCallback(() => {
    setRowSelection({})
  }, [])

  // Bulk action handlers
  const handleBulkDelete = React.useCallback(() => {
    const ids = selectedItems.map((item) => item.id)
    // Call API to delete items
    handleClearSelection()
  }, [selectedItems, handleClearSelection])

  // Pass enableSelection to columns
  const columns = React.useMemo(
    () =>
      createYourEntityColumns({
        // ... other options
        enableSelection: yourEntityTableConfig.features.selection,
      }),
    [
      /* dependencies */
    ]
  )

  return (
    <div>
      {/* Bulk Actions Toolbar */}
      {selectedItems.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedItems.length}
          onClearSelection={handleClearSelection}
          actions={[
            {
              label: 'Delete Selected',
              icon: <Trash2 className='h-4 w-4' />,
              variant: 'destructive',
              onClick: handleBulkDelete,
            },
          ]}
        />
      )}

      {/* Table */}
      <BaseDataTable
        enableRowSelection={yourEntityTableConfig.features.selection}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        // ... other props
      />
    </div>
  )
}
```

### Utilities

- **`getSelectedItems(data, rowSelection)`**: Get selected items from data
- **`getSelectedRowIds(rowSelection)`**: Get selected row indices as strings
- **`createSelectionColumn<TData>()`**: Create a checkbox selection column

## Best Practices

1. **Type Safety**:

   - Always define your entity type and extend `BaseTableEntity` for proper type inference
   - **ALWAYS** use `SortOrder` enum (never string literals 'asc'/'desc')
   - Use proper generics for hooks: `useTableSorting<YourEntity, YourSortBy>`

2. **Required Hooks**:

   - **ALWAYS** use `useTableSorting` for sorting (never implement manual sorting)
   - **ALWAYS** use `useTableExport` for export functionality
   - **ALWAYS** use `useTableHandlers` for standard edit/delete dialogs

3. **Required Components**:

   - **ALWAYS** use `TableControls` component (never use deprecated `TableToolbar`)
   - **ALWAYS** wrap filters with `TableFilter` component
   - **ALWAYS** use `BaseDataTable` and `TablePagination` components

4. **Filters**:

   - Extend `Record<string, unknown>` for your filter interfaces
   - Implement filter reset when multiple filters exist
   - Use `TableFilter` wrapper for consistent styling

5. **Column Visibility**:

   - **ALWAYS** set default hidden columns in `columnVisibility` state
   - Hide optional/less important columns by default

6. **Permissions**: Use permission hooks to conditionally show/hide columns and actions.

7. **Reusability**: Use column helpers for common patterns, create custom columns when needed.

8. **Performance**: Use `React.useMemo` for column definitions to prevent unnecessary re-renders.

9. **Accessibility**: The table-core system handles ARIA labels, keyboard navigation, and focus management.

10. **Responsive**: The components are mobile-responsive by default.

## Reference Implementations

### Full-Featured Table: Players Table

The players table is a complete reference implementation with all features:

- **Config**: `src/config/tables/players.config.ts`
- **Columns**: `src/config/tables/columns/players-columns.tsx`
- **Component**: `src/app/players/components/players-table-refactored.tsx`

**Features demonstrated:**

- Multiple filters with reset
- Bulk actions with row selection
- Export functionality
- Column visibility
- Edit/delete dialogs using `useTableHandlers`
- Advanced filter components

### Simple Table: Users Table

The users table demonstrates a simpler implementation:

- **Config**: `src/config/tables/users.config.ts`
- **Columns**: `src/config/tables/columns/users-columns.tsx`
- **Component**: `src/app/admin/users/components/users-table.tsx`

**Features demonstrated:**

- Single filter
- Custom dialogs (not using `useTableHandlers`)
- Column visibility
- Export setup (disabled in config)

### When to Use Which Pattern

- **Use Players Table pattern** when you need:

  - Multiple filters
  - Bulk actions
  - Row selection
  - Standard edit/delete operations

- **Use Users Table pattern** when you need:
  - Simple filters
  - Custom dialogs (e.g., assign role, link user)
  - No bulk actions

---

## Migration Strategy

### Current State

The Rowad Speedball codebase currently has **two table systems**:

1. **Legacy System** (Multi-file fragmentation):

   - `[entity]-table.tsx` - Main component
   - `[entity]-columns.tsx` - Column definitions
   - `[entity]-controls.tsx` - Filters and search
   - `[entity]-handlers.tsx` - Event handlers
   - `[entity]-hooks.tsx` - Internal state management
   - `[entity]-body.tsx` - Table body rendering
   - `[entity]-header.tsx` - Table header
   - `[entity]-pagination.tsx` - Pagination controls
   - **7 files per table**

2. **New table-core System** (Single config file):
   - `[entity].config.ts` - All configuration in one place
   - **1 file per table**

### Migration Approach

**Opportunistic Migration** - No forced migration required.

#### For New Features

✅ **Always use table-core system**

- Faster development (1 config file vs 7 files)
- Built-in features (search, filters, sorting, export)
- Consistent behavior across all tables

#### For Existing Tables

🔄 **Migrate when making significant changes**

- If updating table layout or columns
- If adding new features (export, bulk actions)
- If fixing bugs that require extensive refactoring

⏸️ **Keep legacy system if**

- Table works perfectly as-is
- Only making minor bug fixes
- Table will be replaced/removed soon

### Benefits of Migration

**Developer Experience**:

- 7 files → 1 config file (86% reduction)
- Clear separation of concerns
- Type-safe column definitions
- Reusable column helpers

**Features**:

- Built-in CSV export
- Bulk selection and actions
- Advanced filtering
- Consistent sorting behavior
- Loading states handled automatically

**Maintenance**:

- Easier to understand (all config in one place)
- Less code to maintain
- Consistent patterns across tables
- Better TypeScript inference

**Performance**:

- Optimized rendering
- Memoized column definitions
- Efficient selection handling

### Migration Checklist

When migrating an existing table to table-core:

- [ ] **Create config file** in `src/config/tables/[entity].config.ts`
- [ ] **Define columns** using column helpers and custom columns
- [ ] **Configure features** (search, filters, sorting, pagination, export)
- [ ] **Set navigation paths** (create, edit, detail)
- [ ] **Add permission checks** (if entity has permissions)
- [ ] **Update page component** to use table-core
- [ ] **Test all functionality**:
  - [ ] Search works
  - [ ] Filters apply correctly
  - [ ] Sorting works for all sortable columns
  - [ ] Pagination navigates correctly
  - [ ] Export generates correct CSV
  - [ ] Row selection (if enabled)
  - [ ] Create/edit/delete actions work
  - [ ] Permission checks enforce correctly
- [ ] **Remove old table files** (7 files)
- [ ] **Update imports** in parent components
- [ ] **Test with different user roles**
- [ ] **Verify responsive behavior** (mobile, tablet, desktop)

### Step-by-Step Migration Guide

#### Step 1: Create Config File

Create `src/config/tables/[entity].config.ts`:

```typescript
import { TableConfig } from '@/lib/table-core/types'
import { Entity } from '@/types'
import { createStandardColumns } from '@/config/tables/columns/column-helpers'

export const entityTableConfig: TableConfig<Entity> = {
  entity: 'entity',

  columns: [
    ...createStandardColumns<Entity>(['name', 'createdAt', 'status']),
    // Add custom columns as needed
  ],

  features: {
    search: true,
    filters: true,
    sorting: true,
    pagination: true,
    selection: true,
    export: true,
    columnVisibility: true,
  },

  navigation: {
    createPath: '/entities/new',
    editPath: (id) => `/entities/${id}`,
  },
}
```

#### Step 2: Update Page Component

Replace old table with table-core:

```typescript
// OLD: 7 imports
import EntityTable from './components/entity-table'
import EntityColumns from './components/entity-columns'
import EntityControls from './components/entity-controls'
// ... 4 more imports

// NEW: 1 import
import { entityTableConfig } from '@/config/tables/entity.config'
import { BaseDataTable } from '@/lib/table-core/components/base-data-table'

const EntitiesPage = () => {
  const { entities, isLoading } = useEntitiesStore()

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <PageHeader title='Entities' />
      <Card>
        <CardContent className='p-6'>
          <BaseDataTable
            config={entityTableConfig}
            data={entities}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

#### Step 3: Remove Old Files

After verifying the new implementation works:

```bash
# Remove old table files
rm src/app/[entity]/components/entity-table.tsx
rm src/app/[entity]/components/entity-columns.tsx
rm src/app/[entity]/components/entity-controls.tsx
rm src/app/[entity]/components/entity-handlers.tsx
rm src/app/[entity]/components/entity-hooks.tsx
rm src/app/[entity]/components/entity-body.tsx
rm src/app/[entity]/components/entity-header.tsx
rm src/app/[entity]/components/entity-pagination.tsx
```

### Migration Progress Tracking

**Migrated Tables** (Using table-core):

- ✅ Players (full-featured reference implementation)
- ✅ Users (simple table reference implementation)

**Legacy Tables** (To be migrated opportunistically):

- Coaches
- Events
- Training Sessions
- Tests
- Matches
- And ~15 more entity tables

### Example Migration: Players Table

The players table has been migrated and serves as the reference implementation:

**Before Migration**:

- 7 separate files in `src/app/players/components/`
- ~1500 lines of code total
- Complex state management across files
- Inconsistent patterns

**After Migration**:

- 1 config file: `src/config/tables/playersTableConfig.ts`
- 1 columns file: `src/config/tables/columns/players-columns.tsx`
- ~300 lines of code total
- Clear, declarative configuration
- Consistent with table-core patterns

**Toggle Implementation**:
The players page currently has both implementations with a toggle for comparison:

```typescript
const [useNewTable, setUseNewTable] = useState(false)

{
  useNewTable ? (
    <PlayersTableRefactored /> // table-core
  ) : (
    <PlayersTable /> // legacy
  )
}
```

This allows side-by-side comparison during migration period.

### When Migration is Complete

Eventually, when all tables are migrated:

1. Remove toggle from players page
2. Delete all legacy table components
3. Update documentation to reference only table-core
4. Celebrate 🎉 (saved thousands of lines of code!)

### No Forced Migration

**Both systems are fully supported**:

- Legacy tables continue to work
- No breaking changes
- Migrate at your own pace
- Natural migration as tables are updated

**Key Principle**: Migrate when it makes sense, not because you must.

---

## Related Documentation

- **Component Standards**: See `/docs/COMPONENT_STANDARDS.md`
- **UI Standards**: See `/docs/UI_COMPONENT_STANDARDS.md`
- **State Management**: See `/docs/STATE_MANAGEMENT_STANDARDS.md`
- **Naming Conventions**: See `/docs/NAMING_CONVENTIONS.md`
