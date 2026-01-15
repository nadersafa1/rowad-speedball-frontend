# State Management Standards

**Last Updated**: January 2026

This guide establishes standards for Zustand store creation, organization, and usage patterns in the Rowad Speedball platform.

## Table of Contents
- [Zustand Store Structure](#zustand-store-structure)
- [Store Organization](#store-organization)
- [Async Action Pattern](#async-action-pattern)
- [Error Handling in Stores](#error-handling-in-stores)
- [Pagination in Stores](#pagination-in-stores)
- [When NOT to Use Stores](#when-not-to-use-stores)
- [Testing Store Logic](#testing-store-logic)

---

## Zustand Store Structure

### Standard State Shape

All entity stores follow this consistent structure:

```typescript
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { Entity, PaginatedResponse } from '@/types'

interface EntityState {
  // Data
  entities: Entity[]
  selectedEntity: Entity | null

  // Loading & Error states
  isLoading: boolean
  error: string | null

  // Pagination metadata
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  // Stats (optional - not all entities have stats)
  stats: EntityStats | null

  // Actions
  fetchEntities: (filters?: EntityFilters) => Promise<void>
  fetchEntity: (id: string) => Promise<void>
  createEntity: (data: CreateEntityData) => Promise<void>
  updateEntity: (id: string, data: UpdateEntityData) => Promise<void>
  deleteEntity: (id: string) => Promise<void>

  // Utility actions
  clearError: () => void
  clearSelectedEntity: () => void
}

export const useEntityStore = create<EntityState>((set, get) => ({
  // Initial state
  entities: [],
  selectedEntity: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },
  stats: null,

  // Action implementations
  fetchEntities: async (filters = {}) => {
    // Implementation
  },

  // ... other actions
}))
```

**Reference**: `src/store/players-store.ts:9-30`

### State Naming Conventions

**Arrays**: Plural entity name
```typescript
players: Player[]
coaches: Coach[]
events: Event[]
```

**Single Item**: `selected[Entity]` (singular)
```typescript
selectedPlayer: Player | null
selectedCoach: Coach | null
selectedEvent: Event | null
```

**Boolean Flags**: `is[State]` or `has[State]`
```typescript
isLoading: boolean
isCreating: boolean
hasMore: boolean
```

**Error State**: `error` (string | null)
```typescript
error: string | null
```

---

## Store Organization

### File Naming

**Pattern**: `[entity]-store.ts` (kebab-case)

```
✅ Good:
- players-store.ts
- coaches-store.ts
- training-sessions-store.ts
- points-schemas-store.ts

❌ Bad:
- PlayersStore.ts
- players_store.ts
- playersStore.ts
- store-players.ts
```

### Store Export Naming

**Pattern**: `use[Entity]Store` (PascalCase with "use" prefix)

```typescript
// File: players-store.ts
export const usePlayersStore = create<PlayersState>((set, get) => ({ ... }))

// File: coaches-store.ts
export const useCoachesStore = create<CoachesState>((set, get) => ({ ... }))

// File: training-sessions-store.ts
export const useTrainingSessionsStore = create<TrainingSessionsState>((set, get) => ({ ... }))
```

### Single Responsibility Principle

**One store per entity** (one-to-one mapping):

```
✅ Good:
- players-store.ts → usePlayersStore
- coaches-store.ts → useCoachesStore
- events-store.ts → useEventsStore

❌ Bad:
- sports-store.ts containing players, coaches, and events
- app-store.ts containing everything
```

**Each store manages**:
- One primary entity type
- CRUD operations for that entity
- Related metadata (pagination, stats)
- Loading/error states for that entity

**Don't**:
- Mix multiple entities in one store
- Create "god stores" that do everything
- Share state between unrelated entities

### Store Location

**All stores in**: `src/store/`

```
src/store/
├── players-store.ts
├── coaches-store.ts
├── events-store.ts
├── training-sessions-store.ts
├── tests-store.ts
├── matches-store.ts
├── users-store.ts
└── ... (24 total stores)
```

---

## Async Action Pattern

### Standard Async Action Structure

**All async actions follow this pattern**:

```typescript
actionName: async (params) => {
  // 1. Set loading state and clear previous errors
  set({ isLoading: true, error: null })

  try {
    // 2. Make API call
    const response = await apiClient.method(params)

    // 3. Update state with successful response
    set({
      data: response.data,
      pagination: response, // If paginated
      isLoading: false,
    })
  } catch (error) {
    // 4. Handle error
    set({
      error: error instanceof Error ? error.message : 'Failed to perform action',
      isLoading: false,
    })
  }
}
```

**Reference**: `src/store/players-store.ts:45-81`

### Fetch Many (List) Pattern

```typescript
fetchEntities: async (filters = {}) => {
  set({ isLoading: true, error: null })

  try {
    const params = {
      q: filters.q,
      category: filters.category,
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }

    const response = await apiClient.getEntities(params) as PaginatedResponse<Entity>

    set({
      entities: response.data,
      pagination: {
        page: response.page,
        limit: response.limit,
        totalItems: response.totalItems,
        totalPages: response.totalPages,
      },
      stats: response.stats || null, // If stats are included
      isLoading: false,
    })
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : 'Failed to fetch entities',
      isLoading: false,
    })
  }
}
```

### Fetch One (Detail) Pattern

```typescript
fetchEntity: async (id: string) => {
  set({ isLoading: true, error: null })

  try {
    const entity = await apiClient.getEntity(id)
    set({ selectedEntity: entity, isLoading: false })
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : 'Failed to fetch entity',
      isLoading: false,
    })
  }
}
```

**Reference**: `src/store/players-store.ts:83-95`

### Create Pattern

```typescript
createEntity: async (data: CreateEntityData) => {
  set({ isLoading: true, error: null })

  try {
    // Transform data if needed (e.g., date formatting)
    const formattedData = {
      ...data,
      dateField: data.dateField instanceof Date
        ? formatDateForAPI(data.dateField)
        : data.dateField,
    }

    const newEntity = await apiClient.createEntity(formattedData)

    // Add to existing list (optimistic update)
    set((state) => ({
      entities: [...state.entities, newEntity],
      isLoading: false,
    }))
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : 'Failed to create entity',
      isLoading: false,
    })
    // Re-throw so component can handle (e.g., keep dialog open)
    throw error
  }
}
```

**Key Points**:
1. Transform data before sending to API (dates, etc.)
2. Add new entity to list for optimistic update
3. **Re-throw error** so component can handle it

**Reference**: `src/store/players-store.ts:97-121`

### Update Pattern

```typescript
updateEntity: async (id: string, data: UpdateEntityData) => {
  set({ isLoading: true, error: null })

  try {
    // Transform data if needed
    const formattedData = {
      ...data,
      ...(data.dateField && {
        dateField: data.dateField instanceof Date
          ? formatDateForAPI(data.dateField)
          : data.dateField,
      }),
    }

    const updatedEntity = await apiClient.updateEntity(id, formattedData)

    // Update in list and selectedEntity if applicable
    set((state) => ({
      entities: state.entities.map((e) =>
        e.id === id ? updatedEntity : e
      ),
      selectedEntity: state.selectedEntity?.id === id
        ? updatedEntity
        : state.selectedEntity,
      isLoading: false,
    }))
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : 'Failed to update entity',
      isLoading: false,
    })
    throw error
  }
}
```

**Key Points**:
1. Update both list and selectedEntity
2. Use `map` for immutable update
3. Re-throw error for component handling

**Reference**: `src/store/players-store.ts:123-150`

### Delete Pattern

```typescript
deleteEntity: async (id: string) => {
  set({ isLoading: true, error: null })

  try {
    await apiClient.deleteEntity(id)

    // Remove from list
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
      selectedEntity: state.selectedEntity?.id === id
        ? null
        : state.selectedEntity,
      isLoading: false,
    }))
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : 'Failed to delete entity',
      isLoading: false,
    })
    throw error
  }
}
```

**Key Points**:
1. Remove from list using `filter`
2. Clear selectedEntity if it was deleted
3. Re-throw error for component handling

---

## Error Handling in Stores

### Store Error State

**Errors stored in state**:
```typescript
interface EntityState {
  error: string | null
  // ...
}
```

### Error Setting Pattern

**In catch blocks**:
```typescript
catch (error) {
  set({
    error: error instanceof Error ? error.message : 'Failed to perform action',
    isLoading: false,
  })
}
```

**Always**:
1. Check if `error instanceof Error` before accessing `.message`
2. Provide fallback message
3. Set `isLoading: false`

### Clear Error Action

**Every store provides**:
```typescript
clearError: () => {
  set({ error: null })
}
```

**Usage in components**:
```typescript
const { error, clearError } = useEntityStore()

useEffect(() => {
  // Clear error when component unmounts or on success
  return () => clearError()
}, [clearError])
```

### Throwing Errors from Mutations

**Mutation actions (create/update/delete) should throw errors**:

```typescript
createEntity: async (data) => {
  set({ isLoading: true, error: null })
  try {
    const newEntity = await apiClient.createEntity(data)
    set((state) => ({ entities: [...state.entities, newEntity], isLoading: false }))
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : 'Failed to create',
      isLoading: false,
    })
    throw error // Re-throw for component to handle
  }
}
```

**Why?** Components need to know if mutation succeeded to:
- Keep dialog open on error
- Show success toast on success
- Reset form state

**Component usage**:
```typescript
const onSubmit = async (data) => {
  try {
    await createEntity(data)
    toast.success('Created successfully')
    onClose()
  } catch (err) {
    // Error already in store state, just keep dialog open
    // Optional: set local form error state
  }
}
```

---

## Pagination in Stores

### Pagination State

**Standard structure**:
```typescript
interface EntityState {
  pagination: {
    page: number        // Current page (1-indexed)
    limit: number       // Items per page
    totalItems: number  // Total items in dataset
    totalPages: number  // Total pages (calculated by API)
  }
}
```

### Initial Pagination State

```typescript
export const useEntityStore = create<EntityState>((set, get) => ({
  pagination: {
    page: 1,
    limit: 10, // Or 25 for some entities
    totalItems: 0,
    totalPages: 0,
  },
  // ...
}))
```

### Updating Pagination on Fetch

```typescript
fetchEntities: async (filters = {}) => {
  set({ isLoading: true, error: null })

  try {
    const response = await apiClient.getEntities(params) as PaginatedResponse<Entity>

    set({
      entities: response.data,
      pagination: {
        page: response.page,
        limit: response.limit,
        totalItems: response.totalItems,
        totalPages: response.totalPages,
      },
      isLoading: false,
    })
  } catch (error) {
    // ...
  }
}
```

### Page State Management

**❌ Don't manage page state in store**:
```typescript
// Bad: Page state in store
interface EntityState {
  currentPage: number
  setPage: (page: number) => void
}
```

**✅ Manage page state in component**:
```typescript
// Good: Page state in component
const [filters, setFilters] = useState({
  page: 1,
  limit: 25,
  // ... other filters
})

const { entities, pagination } = useEntityStore()

useEffect(() => {
  fetchEntities(filters)
}, [filters, fetchEntities])

const handlePageChange = (newPage: number) => {
  setFilters({ ...filters, page: newPage })
}
```

**Why?** Page state is UI state, not domain state.

---

## When NOT to Use Stores

### Local Form State

**❌ Don't use store for form state**:
```typescript
// Bad
interface PlayerState {
  formData: PlayerFormData
  setFormField: (field: string, value: any) => void
}
```

**✅ Use React Hook Form**:
```typescript
// Good
const form = useForm<PlayerFormData>({
  resolver: zodResolver(schema),
})
```

### Filter State

**❌ Don't store filters in store**:
```typescript
// Bad
interface PlayersState {
  filters: PlayersFilters
  setFilter: (key: string, value: any) => void
}
```

**✅ Use component state**:
```typescript
// Good
const [filters, setFilters] = useState<PlayersFilters>({
  q: '',
  gender: 'all',
  page: 1,
})
```

**Why?** Filters are UI state, specific to a component/page.

### Temporary UI State

**❌ Don't use store for**:
- Modal open/closed state
- Dropdown expanded state
- Active tab index
- Hover states
- Focus states

**✅ Use component state** (`useState`, `useReducer`)

### Derived/Computed State

**❌ Don't store computed values**:
```typescript
// Bad
interface PlayersState {
  players: Player[]
  playerCount: number
  averageAge: number
}
```

**✅ Compute on demand**:
```typescript
// Good
const { players } = usePlayersStore()
const playerCount = players.length
const averageAge = players.reduce((sum, p) => sum + p.age, 0) / players.length

// Or use useMemo for expensive computations
const averageAge = useMemo(() => {
  return players.reduce((sum, p) => sum + p.age, 0) / players.length
}, [players])
```

---

## Testing Store Logic

### Unit Testing Stores (Future)

**When testing standards are created**, stores should be tested with:

1. **Initial state verification**
2. **Async action success paths**
3. **Async action error paths**
4. **State updates after mutations**
5. **Error clearing**

**Example test structure** (to be implemented):
```typescript
describe('usePlayersStore', () => {
  it('should fetch players successfully', async () => {
    // Setup mock
    // Call fetchPlayers
    // Assert state updates
  })

  it('should handle fetch error', async () => {
    // Setup error mock
    // Call fetchPlayers
    // Assert error state
  })

  it('should create player and add to list', async () => {
    // Setup mock
    // Call createPlayer
    // Assert player added to list
  })
})
```

**Note**: See `/docs/TESTING_STANDARDS.md` (to be created) for full testing patterns.

---

## Advanced Patterns

### Stats Extraction with Type Guards

**When API returns stats** (optional):

```typescript
import type { PaginatedResponse, PlayersStats, CoachesStats } from '@/types'

// Type guard
function isPlayersStats(stats: any): stats is PlayersStats {
  return stats && 'maleCount' in stats
}

fetchPlayers: async (filters = {}) => {
  try {
    const response = await apiClient.getPlayers(params) as PaginatedResponse<Player> & { stats?: PlayersStats }

    set({
      players: response.data,
      pagination: { ... },
      stats: response.stats || null,
      isLoading: false,
    })
  } catch (error) {
    // ...
  }
}
```

**Reference**: `src/store/players-store.ts:61`

### Batch Operations

**For bulk actions** (e.g., bulk delete, bulk update):

```typescript
bulkDeleteEntities: async (ids: string[]) => {
  set({ isLoading: true, error: null })

  try {
    await Promise.all(ids.map(id => apiClient.deleteEntity(id)))

    set((state) => ({
      entities: state.entities.filter((e) => !ids.includes(e.id)),
      isLoading: false,
    }))
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : 'Failed to delete entities',
      isLoading: false,
    })
    throw error
  }
}
```

### Optimistic Updates

**For better UX**, update UI immediately, rollback on error:

```typescript
deleteEntity: async (id: string) => {
  // 1. Save current state
  const previousEntities = get().entities

  // 2. Optimistic update (immediate UI feedback)
  set((state) => ({
    entities: state.entities.filter((e) => e.id !== id),
  }))

  try {
    // 3. Make API call
    await apiClient.deleteEntity(id)
  } catch (error) {
    // 4. Rollback on error
    set({
      entities: previousEntities,
      error: error instanceof Error ? error.message : 'Failed to delete',
    })
    throw error
  }
}
```

**Use sparingly** - most operations don't need optimistic updates.

---

## Quick Reference

### Store File Template

```typescript
import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import type { Entity, PaginatedResponse } from '@/types'

interface EntityState {
  entities: Entity[]
  selectedEntity: Entity | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }

  fetchEntities: (filters?: Filters) => Promise<void>
  fetchEntity: (id: string) => Promise<void>
  createEntity: (data: CreateData) => Promise<void>
  updateEntity: (id: string, data: UpdateData) => Promise<void>
  deleteEntity: (id: string) => Promise<void>
  clearError: () => void
  clearSelectedEntity: () => void
}

export const useEntityStore = create<EntityState>((set, get) => ({
  entities: [],
  selectedEntity: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },

  fetchEntities: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.getEntities(filters)
      set({
        entities: response.data,
        pagination: response,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch',
        isLoading: false,
      })
    }
  },

  // ... other actions

  clearError: () => set({ error: null }),
  clearSelectedEntity: () => set({ selectedEntity: null }),
}))
```

### Store Usage in Components

```typescript
const EntityComponent = () => {
  const {
    entities,
    isLoading,
    error,
    pagination,
    fetchEntities,
    createEntity,
    clearError,
  } = useEntityStore()

  const [filters, setFilters] = useState({ page: 1, limit: 25 })

  useEffect(() => {
    fetchEntities(filters)
  }, [filters, fetchEntities])

  if (isLoading) return <Loading />
  if (error) return <Error message={error} onRetry={clearError} />

  return <EntityList entities={entities} />
}
```

---

## Related Documentation

- **Component Standards**: See `/docs/COMPONENT_STANDARDS.md`
- **API Development**: See `/docs/IMPLEMENTATION_STANDARDS.md`
- **Forms**: See `/docs/FORMS_GUIDE.md`
- **Testing**: See `/docs/TESTING_STANDARDS.md` (to be created)

---

## Reference Implementations

**Complete Store Example**: `src/store/players-store.ts`
**With Stats**: `src/store/coaches-store.ts`, `src/store/events-store.ts`
**Complex Stats**: `src/store/training-sessions-store.ts`
**All 24 Stores**: `src/store/`
