# Players Table Implementation Documentation

## Overview

The players table is a fully-featured data table with **server-side filtering, sorting, and pagination**. This document provides a complete guide for replicating this pattern in your application.

## Architecture

### Server-Side Features

- **Filtering**: Search (name), gender, age group, preferred hand
- **Sorting**: Multiple fields (name, dateOfBirth, createdAt, updatedAt, gender, preferredHand) with asc/desc
- **Pagination**: Page-based with configurable limit (1-100)

### Client-Side Architecture

- **State Management**: Zustand store (`players-store.ts`)
- **Data Fetching**: Custom hook (`use-players.ts`)
- **Component Structure**: Modular, separated concerns
- **Type Safety**: Zod schemas for validation

## File Structure

```
src/
├── app/
│   ├── api/v1/players/
│   │   └── route.ts                    # API endpoint (GET, POST)
│   └── players/
│       ├── page.tsx                     # Main page component
│       ├── hooks/
│       │   └── use-players.ts          # Data fetching hook
│       ├── types/
│       │   ├── playere-filters.type.ts  # Filter types
│       │   └── enums/                  # Gender, AgeGroup enums
│       └── components/
│           ├── players-table.tsx        # Main table component
│           ├── players-table-controls.tsx
│           ├── players-table-pagination.tsx
│           ├── players-table-handlers.tsx
│           ├── players-table-types.tsx
│           └── ... (other table components)
├── store/
│   └── players-store.ts                # Zustand store
├── types/api/
│   ├── players.schemas.ts              # Zod schemas
│   └── pagination.ts                   # Pagination types
└── lib/
    └── api-client.ts                   # API client
```

## Implementation Guide

### Step 1: API Route (`/api/v1/players/route.ts`)

The API route handles all server-side operations:

**Key Responsibilities:**
- Parse and validate query parameters with Zod schema
- Build database conditions for filters
- Apply sorting with Drizzle ORM
- Calculate pagination offset
- Return paginated response

**Example Implementation:**

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const parseResult = playersQuerySchema.safeParse(queryParams);

  if (!parseResult.success) {
    return Response.json(z.treeifyError(parseResult.error), { status: 400 });
  }

  const { q, gender, ageGroup, sortBy, sortOrder, page, limit } = parseResult.data;
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  // Build filter conditions
  if (q) {
    conditions.push(ilike(schema.players.name, `%${q}%`));
  }
  if (gender && gender !== "all") {
    conditions.push(eq(schema.players.gender, gender));
  }
  // ... more filters

  // Apply conditions
  const combinedCondition = conditions.length > 0
    ? conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition)
    : undefined;

  // Count query
  let countQuery = db.select({ count: count() }).from(schema.players);
  if (combinedCondition) {
    countQuery = countQuery.where(combinedCondition) as any;
  }

  // Data query
  let dataQuery = db.select().from(schema.players);
  if (combinedCondition) {
    dataQuery = dataQuery.where(combinedCondition) as any;
  }

  // Apply sorting
  if (sortBy) {
    const sortField = schema.players[sortBy];
    const order = sortOrder === "asc" ? asc(sortField) : desc(sortField);
    dataQuery = dataQuery.orderBy(order) as any;
  }

  // Execute queries
  const [countResult, dataResult] = await Promise.all([
    countQuery,
    dataQuery.limit(limit).offset(offset),
  ]);

  const totalItems = countResult[0].count;
  const paginatedResponse = createPaginatedResponse(
    dataResult,
    page,
    limit,
    totalItems
  );

  return Response.json(paginatedResponse);
}
```

### Step 2: Zod Schemas (`types/api/players.schemas.ts`)

Define validation schemas for all query parameters:

```typescript
export const playersQuerySchema = z
  .object({
    q: z.string().trim().max(20).optional(),
    gender: z.enum(["male", "female", "all"]).optional(),
    ageGroup: z.enum(["mini", "U-09", "U-11", ..., "all"]).optional(),
    preferredHand: z.enum(["left", "right", "both"]).optional(),
    sortBy: z.enum(["name", "dateOfBirth", "createdAt", ...]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    page: z.string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val >= 1, "Page must be greater than 0"),
    limit: z.string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100"),
  })
  .strict();
```

### Step 3: Zustand Store (`store/players-store.ts`)

Create a Zustand store for state management:

```typescript
interface PlayersState {
  players: Player[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  fetchPlayers: (filters?: PlayersFilters) => Promise<void>;
  clearError: () => void;
}

export const usePlayersStore = create<PlayersState>((set) => ({
  players: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },

  fetchPlayers: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = {
        q: filters.q,
        gender: filters.gender,
        ageGroup: filters.ageGroup,
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      const response = await apiClient.getPlayers(params) as PaginatedResponse<Player>;

      set({
        players: response.data,
        pagination: {
          page: response.page,
          limit: response.limit,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch players",
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
```

### Step 4: Custom Hook (`hooks/use-players.ts`)

Create a hook that uses the store and triggers fetches:

```typescript
export const usePlayers = (filters: PlayersFilters) => {
  const { players, isLoading, error, pagination, fetchPlayers, clearError } =
    usePlayersStore();

  useEffect(() => {
    fetchPlayers(filters);
  }, [filters, fetchPlayers]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchPlayers({ ...filters, page });
    },
    [filters, fetchPlayers]
  );

  const refetch = useCallback(() => {
    fetchPlayers(filters);
  }, [filters, fetchPlayers]);

  return {
    players,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  };
};
```

### Step 5: Page Component (`page.tsx`)

Manage filter state and coordinate components:

```typescript
const PlayersPage = () => {
  const [filters, setFilters] = useState<PlayersFilters>({
    q: "",
    gender: Gender.ALL,
    ageGroup: AgeGroup.ALL,
    page: 1,
    limit: 25,
  });

  const {
    players,
    isLoading,
    error,
    pagination,
    handlePageChange,
    refetch,
  } = usePlayers(filters);

  return (
    <div className="container mx-auto px-4 py-8">
      <PlayersTable
        players={players}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={(pageSize) => {
          setFilters({ ...filters, limit: pageSize, page: 1 });
        }}
        onSearchChange={(search) => {
          setFilters({ ...filters, q: search, page: 1 });
        }}
        searchValue={filters.q}
        gender={filters.gender}
        ageGroup={filters.ageGroup}
        onGenderChange={(gender) => {
          setFilters({ ...filters, gender, page: 1 });
        }}
        onAgeGroupChange={(ageGroup) => {
          setFilters({ ...filters, ageGroup, page: 1 });
        }}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortingChange={(sortBy, sortOrder) => {
          setFilters({
            ...filters,
            sortBy: sortBy as PlayersFilters["sortBy"],
            sortOrder,
            page: 1,
          });
        }}
        isLoading={isLoading}
        onRefetch={refetch}
      />
    </div>
  );
};
```

### Step 6: Table Component (`players-table.tsx`)

Main table component that orchestrates all parts:

```typescript
const PlayersTable = ({
  players,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = "",
  gender,
  ageGroup,
  onGenderChange,
  onAgeGroupChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: PlayersTableProps) => {
  const { handleEdit, handleDelete, handleSort } = usePlayersTableHandlers({
    onRefetch,
    onSortingChange,
    sortBy,
    sortOrder,
  });

  const columns = React.useMemo(
    () => createColumns(isAdmin, handleEdit, handleDelete, sortBy, sortOrder, handleSort),
    [isAdmin, handleEdit, handleDelete, sortBy, sortOrder, handleSort]
  );

  const { table } = usePlayersTable({ players, columns, totalPages: pagination.totalPages });

  return (
    <div className="w-full space-y-4">
      <PlayersTableControls
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        gender={gender}
        ageGroup={ageGroup}
        onGenderChange={onGenderChange}
        onAgeGroupChange={onAgeGroupChange}
      />
      <div className="rounded-md border">
        <Table>
          <PlayersTableHeader table={table} />
          <PlayersTableBody
            table={table}
            columnsCount={columns.length}
            isLoading={isLoading}
            searchQuery={searchValue}
          />
        </Table>
      </div>
      <PlayersTablePagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
      />
    </div>
  );
};
```

### Step 7: API Client (`lib/api-client.ts`)

Add method to API client:

```typescript
async getPlayers(params?: {
  q?: string;
  gender?: string;
  ageGroup?: string;
  preferredHand?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.gender) searchParams.set("gender", params.gender);
  if (params?.ageGroup) searchParams.set("ageGroup", params.ageGroup);
  if (params?.preferredHand) searchParams.set("preferredHand", params.preferredHand);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return this.request(`/players${query ? `?${query}` : ""}`);
}
```

## Key Patterns

### 1. Filter State Management

- **Local state in page component**: Filters are managed locally in the page component
- **Reset page on filter change**: When any filter changes, reset to page 1
- **Sync with API**: Filters are passed to the hook which triggers API calls

### 2. Server-Side Processing

- **All filtering at database level**: No client-side filtering
- **Database-level sorting**: Sorting happens in SQL queries
- **Efficient pagination**: Only fetch the current page's data

### 3. Type Safety

- **Zod schemas**: Validate all API inputs
- **TypeScript types**: Inferred from Zod schemas
- **Strict validation**: Catch errors early

### 4. Separation of Concerns

- **Store**: State management (Zustand)
- **Hook**: Data fetching logic
- **Components**: UI rendering
- **API Route**: Business logic and database queries

### 5. Error Handling

- **Try/catch in store**: Handle API errors gracefully
- **Error state in UI**: Display errors to users
- **Clear error action**: Allow users to dismiss errors

## API Contract

### GET /api/v1/players

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | - | Search query for name (max 20 chars) |
| `gender` | enum | No | - | "male" \| "female" \| "all" |
| `ageGroup` | enum | No | - | "mini" \| "U-09" \| "U-11" \| "U-13" \| "U-15" \| "U-17" \| "U-19" \| "U-21" \| "Seniors" \| "all" |
| `preferredHand` | enum | No | - | "left" \| "right" \| "both" |
| `sortBy` | enum | No | - | "name" \| "dateOfBirth" \| "createdAt" \| "updatedAt" \| "gender" \| "preferredHand" |
| `sortOrder` | enum | No | "desc" | "asc" \| "desc" |
| `page` | number | No | 1 | Page number (min: 1) |
| `limit` | number | No | 10 | Items per page (min: 1, max: 100) |

**Response:**

```typescript
{
  data: Player[],
  page: number,
  limit: number,
  totalItems: number,
  totalPages: number
}
```

**Example Request:**

```
GET /api/v1/players?q=john&gender=male&ageGroup=U-15&sortBy=name&sortOrder=asc&page=1&limit=25
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "dateOfBirth": "2010-05-15",
      "gender": "male",
      "preferredHand": "right",
      "age": 14,
      "ageGroup": "U-15",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "page": 1,
  "limit": 25,
  "totalItems": 150,
  "totalPages": 6
}
```

## File Structure Optimization

### Current State

The players table has **16 component files** (~1,007 lines total). Many files are very small (20-46 lines), which creates unnecessary navigation overhead.

### Recommended Consolidation

Reduce from 16 files to **7 files** while maintaining modularity:

1. **`players-table.tsx`** — Main component (merge header, body, edit dialog)
2. **`players-table-controls.tsx`** — Keep separate (158 lines)
3. **`players-table-pagination.tsx`** — Keep separate (106 lines)
4. **`players-table-types.tsx`** — Keep separate (types only)
5. **`players-table-columns.tsx`** — Merge: base columns, hidden columns, cell renderers, sortable header, utils
6. **`players-table-hooks.tsx`** — Merge: handlers + hooks
7. **`players-table-actions.tsx`** — Keep separate (84 lines)

**Benefits:**

- Reduces file count by 56% (16 → 7)
- Maintains separation of concerns
- Keeps types separate as preferred
- All files stay under 100 lines
- Easier to navigate and understand

**Files to Consolidate:**

- `players-table-header.tsx` (29 lines) → merge into `players-table.tsx`
- `players-table-body.tsx` (72 lines) → merge into `players-table.tsx`
- `players-table-edit-dialog.tsx` (28 lines) → merge into `players-table.tsx`
- `players-table-base-columns.tsx` (77 lines) → merge into `players-table-columns.tsx`
- `players-table-hidden-columns.tsx` (57 lines) → merge into `players-table-columns.tsx`
- `players-table-cell-renderers.tsx` (33 lines) → merge into `players-table-columns.tsx`
- `players-table-sortable-header.tsx` (46 lines) → merge into `players-table-columns.tsx`
- `players-table-utils.tsx` (20 lines) → merge into `players-table-columns.tsx`
- `players-table-handlers.tsx` (80 lines) → merge into `players-table-hooks.tsx`
- `players-table-hooks.tsx` (43 lines) → merge handlers into this file

## Replication Checklist

Use this checklist when implementing a new table with server-side filtering, sorting, and pagination:

### Backend

- [ ] Create API route with GET handler
- [ ] Define Zod query schema with all filter/sort/pagination params
- [ ] Implement database filtering logic for each filter
- [ ] Implement database sorting logic (handle all sortable fields)
- [ ] Implement pagination (offset/limit calculation)
- [ ] Add proper error handling
- [ ] Return paginated response using `createPaginatedResponse`

### Frontend - State Management

- [ ] Create Zustand store with state (data, loading, error, pagination)
- [ ] Implement `fetchData` action that calls API with filters
- [ ] Handle loading and error states in store

### Frontend - Data Fetching

- [ ] Create custom hook (e.g., `use-{resource}.ts`)
- [ ] Use store's fetch function in useEffect
- [ ] Return data, pagination, handlers
- [ ] Trigger refetch on filter changes

### Frontend - Types

- [ ] Create filter types file (e.g., `{resource}-filters.type.ts`)
- [ ] Create enums for filter options (if needed)
- [ ] Export all types

### Frontend - Components

- [ ] Create page component with filter state management
- [ ] Create main table component
- [ ] Create controls component (search, filters)
- [ ] Create pagination component
- [ ] Create types file for table props
- [ ] Create columns file (consolidated structure recommended)
- [ ] Create hooks file (consolidated: handlers + table setup)

### Frontend - API Client

- [ ] Add `get{Resource}` method to API client
- [ ] Handle all query parameters properly
- [ ] Build URLSearchParams correctly

### Testing

- [ ] Test all filter combinations
- [ ] Test sorting on all fields (asc/desc)
- [ ] Test pagination (first page, last page, edge cases)
- [ ] Test filter reset on page change
- [ ] Test error handling
- [ ] Test loading states

## Common Pitfalls

1. **Forgetting to reset page on filter change**: Always set `page: 1` when filters change
2. **Client-side filtering**: Make sure all filtering happens server-side
3. **Missing error handling**: Always handle API errors gracefully
4. **Not validating inputs**: Use Zod schemas to validate all inputs
5. **Inefficient queries**: Use database indexes for filtered/sorted columns
6. **Not handling empty states**: Show appropriate messages when no data is found

## Performance Considerations

1. **Database Indexes**: Add indexes on frequently filtered/sorted columns
2. **Query Optimization**: Use `Promise.all` for count and data queries
3. **Pagination Limits**: Enforce reasonable limits (e.g., max 100 items per page)
4. **Debouncing**: Consider debouncing search inputs to reduce API calls
5. **Caching**: Consider caching frequently accessed data

## Next Steps

After implementing the basic table:

1. Add column visibility toggles
2. Add export functionality
3. Add bulk actions
4. Add advanced filters
5. Add saved filter presets
6. Add keyboard shortcuts

