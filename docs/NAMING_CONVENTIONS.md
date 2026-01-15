# Naming Conventions

**Last Updated**: January 2026

This guide establishes naming standards for files, variables, functions, components, types, and API routes in the Rowad Speedball platform.

## Table of Contents
- [File Naming](#file-naming)
- [Variable Naming](#variable-naming)
- [Function Naming](#function-naming)
- [Component Naming](#component-naming)
- [Type and Interface Naming](#type-and-interface-naming)
- [API Route Naming](#api-route-naming)
- [Database Naming](#database-naming)
- [Quick Reference Table](#quick-reference-table)

---

## File Naming

### Components

**Pattern**: `kebab-case.tsx`

```
✅ Good:
- player-form.tsx
- event-card.tsx
- date-of-birth-picker.tsx
- training-session-table.tsx
- loading-button.tsx

❌ Bad:
- PlayerForm.tsx         (PascalCase)
- player_form.tsx        (snake_case)
- playerForm.tsx         (camelCase)
```

**Why kebab-case?**
- URL-friendly (matches Next.js routing)
- Clear word separation
- Consistent across project

### Pages

**Pattern**: `kebab-case/page.tsx` or `kebab-case/[id]/page.tsx`

```
✅ Good:
- app/players/page.tsx
- app/training-sessions/page.tsx
- app/players/[id]/page.tsx
- app/admin/federation/page.tsx

❌ Bad:
- app/Players/page.tsx
- app/training_sessions/page.tsx
```

**Route Segments**: Always kebab-case
```
app/
├── players/
├── coaches/
├── training-sessions/    ✅ Kebab-case for multi-word
├── events/
└── admin/
    └── federation-clubs/
```

### Stores

**Pattern**: `[entity]-store.ts` (kebab-case with `-store` suffix)

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
- store-players.ts        (wrong order)
```

### Utilities

**Pattern**: `kebab-case.ts` (descriptive name + purpose)

```
✅ Good:
- tournament-utils.ts
- formatters.ts
- date-utils.ts
- bracket-generator.ts
- api-error-handler.ts

❌ Bad:
- utils.ts               (too generic)
- TournamentUtils.ts
- tournament_utils.ts
```

### Type Files

**Pattern**: `[entity].schemas.ts` for Zod schemas

```
✅ Good:
- players.schemas.ts
- coaches.schemas.ts
- events.schemas.ts
- training-sessions.schemas.ts

❌ Bad:
- players.types.ts       (use .schemas for Zod)
- PlayersSchemas.ts
- player.schemas.ts      (singular)
```

### Hooks

**Pattern**: `use-[feature].ts` or `use[Entity][Action].ts` (camelCase with `use-` prefix in filename)

```
✅ Good:
- use-players.ts
- use-debounce.ts
- use-organization-context.ts
- usePlayerPermissions.ts  (✅ Also acceptable)

Note: Both kebab-case and camelCase acceptable for hook files.
Hook export must be camelCase: useFeature
```

### Configuration Files

**Pattern**: `kebab-case.ts` or `[entity].config.ts`

```
✅ Good:
- players.config.ts
- coaches.config.ts
- next.config.js
- tailwind.config.ts
- tsconfig.json

❌ Bad:
- PlayersConfig.ts
- config-players.ts
```

---

## Variable Naming

### General Variables

**Pattern**: `camelCase` (descriptive, avoid abbreviations)

```typescript
// ✅ Good
const playerName = 'John Doe'
const totalCount = 100
const isAuthenticated = true
const hasPermission = false
const selectedPlayer = player
const filteredPlayers = players.filter(...)

// ❌ Bad
const player_name = 'John Doe'      // snake_case
const PlayerName = 'John Doe'       // PascalCase
const cnt = 100                     // abbreviation
const x = true                      // not descriptive
const temp = player                 // vague
```

### Constants

**Pattern**: `SCREAMING_SNAKE_CASE` (for true constants)

```typescript
// ✅ Good
const API_BASE_URL = '/api/v1'
const MAX_NAME_LENGTH = 255
const DEFAULT_PAGE_SIZE = 10
const MIN_AGE = 2
const SESSION_TIMEOUT = 3600000

// ❌ Bad
const apiBaseUrl = '/api/v1'        // not constant style
const maxNameLength = 255           // not constant style
```

**When to use SCREAMING_SNAKE_CASE**:
- Values that never change
- Configuration values
- Magic numbers extracted to constants
- Enum-like values

**When NOT to use**:
```typescript
// ❌ Don't use for function results
const TODAY = new Date()            // Bad (computed)
const USER_COUNT = players.length   // Bad (computed)

// ✅ Use camelCase for computed values
const today = new Date()
const userCount = players.length
```

### Boolean Variables

**Pattern**: `is[State]`, `has[State]`, `can[Action]`, `should[Action]`

```typescript
// ✅ Good
const isLoading = true
const isAuthenticated = false
const hasPermission = true
const canEdit = false
const shouldRefresh = true
const isSystemAdmin = user.role === 'system-admin'

// ❌ Bad
const loading = true                // not clear it's boolean
const authenticated = false         // not clear it's boolean
const permission = true             // vague
const edit = false                  // vague
```

### Arrays and Collections

**Pattern**: Plural noun (descriptive collection name)

```typescript
// ✅ Good
const players = [...]
const coaches = [...]
const events = [...]
const selectedPlayers = [...]
const filteredEvents = [...]

// ❌ Bad
const playerList = [...]            // unnecessary "List" suffix
const playerArray = [...]           // unnecessary "Array" suffix
const player = [...]                // should be plural for array
```

### Objects

**Pattern**: Singular noun (what it represents)

```typescript
// ✅ Good
const player = { name: 'John', age: 25 }
const config = { theme: 'dark' }
const filters = { q: '', page: 1 }  // Exception: "filters" is the concept

// ❌ Bad
const playerObject = { ... }        // unnecessary "Object" suffix
const playerData = { ... }          // unnecessary "Data" suffix
```

---

## Function Naming

### General Functions

**Pattern**: `camelCase` with action verb

```typescript
// ✅ Good
function calculateAge(dateOfBirth: Date): number
function formatDate(date: Date): string
function validatePlayer(player: Player): boolean
function generateBracket(players: Player[]): Bracket

// ❌ Bad
function age(dateOfBirth: Date)              // no verb
function CalculateAge(dateOfBirth: Date)     // PascalCase
function calc_age(dateOfBirth: Date)         // snake_case
```

**Common Action Verbs**:
- `get` - Retrieve data (synchronous)
- `fetch` - Retrieve data (asynchronous)
- `create` - Create new entity
- `update` - Modify existing entity
- `delete` - Remove entity
- `validate` - Check validity
- `calculate` - Compute value
- `format` - Transform presentation
- `parse` - Convert format
- `generate` - Create from rules
- `handle` - Respond to event
- `toggle` - Switch state
- `filter` - Reduce collection
- `sort` - Order collection

### Event Handlers

**Pattern**: `handle[Event]` or `on[Event]`

```typescript
// ✅ Good - Component handlers (handle prefix)
const handleSubmit = (e: FormEvent) => { ... }
const handleDelete = (id: string) => { ... }
const handlePageChange = (page: number) => { ... }
const handlePlayerSelect = (player: Player) => { ... }

// ✅ Good - Props/callbacks (on prefix)
interface ComponentProps {
  onSave?: () => void
  onCancel?: () => void
  onChange?: (value: string) => void
}

// ❌ Bad
const submitHandler = (e: FormEvent) => { ... }
const deletePlayer = (id: string) => { ... }    // OK for store action, not for event handler
const pageChanged = (page: number) => { ... }
```

**Pattern Guide**:
- `handle[Event]` - For internal component handlers
- `on[Event]` - For prop callbacks

### Boolean Functions

**Pattern**: `is[State]`, `has[State]`, `can[Action]`, `should[Action]`

```typescript
// ✅ Good
function isAdmin(user: User): boolean
function hasPermission(user: User, permission: string): boolean
function canEdit(user: User, entity: Entity): boolean
function shouldRefresh(lastUpdate: Date): boolean

// ❌ Bad
function admin(user: User)                  // not clear it returns boolean
function checkPermission(user: User)        // vague
function editable(user: User)               // adjective, not verb
```

### Async Functions

**Pattern**: Prefix with `fetch` or use async context

```typescript
// ✅ Good
async function fetchPlayers(): Promise<Player[]>
async function createPlayer(data: PlayerData): Promise<Player>
async function loadUserData(): Promise<void>

// ❌ Bad
async function getPlayers()                 // use "fetch" for async
async function player()                     // no verb
```

**Exception**: `get` is OK for synchronous data retrieval
```typescript
function getOrganizationContext(): Context  // ✅ Synchronous
async function fetchPlayers(): Promise<...> // ✅ Asynchronous
```

---

## Component Naming

### Component Definition

**Pattern**: `PascalCase` (always)

```typescript
// ✅ Good
export const PlayerForm = ({ ... }) => { ... }
export const EventCard = ({ ... }) => { ... }
export const DateOfBirthPicker = ({ ... }) => { ... }

// ❌ Bad
export const playerForm = ({ ... }) => { ... }      // camelCase
export const player_form = ({ ... }) => { ... }     // snake_case
```

### Component Types by Suffix

**Forms**: `[Entity]Form`
```typescript
PlayerForm
CoachForm
EventForm
TrainingSessionForm
```

**Dialogs**: `[Entity]Dialog` or `[Action]Dialog`
```typescript
PlayerDialog
CreatePlayerDialog
DeleteConfirmDialog
EventDetailsDialog
```

**Cards**: `[Entity]Card`
```typescript
PlayerCard
EventCard
StatsCard
CoachCard
```

**Tables**: `[Entity]Table` or `[Entity]List`
```typescript
PlayersTable
EventsList
CoachesTable
```

**Pickers/Selectors**: `[Entity]Picker`, `[Entity]Selector`, `[Entity]Combobox`
```typescript
DateOfBirthPicker
CoachSelector
ClubCombobox
OrganizationPicker
```

**Stats/Display**: `[Entity]Stats`, `[Entity]Display`
```typescript
PlayersStats
EventStats
PlayerDisplay
DashboardStats
```

### Descriptive and Specific

```typescript
// ✅ Good: Specific
PlayerForm              // Clear: form for players
EventRegistrationForm   // Clear: form for event registration
CoachAssignmentDialog   // Clear: dialog for assigning coaches

// ❌ Bad: Generic
Form                    // Too generic
Dialog                  // Too generic
Table                   // Too generic
Component               // Way too generic
```

---

## Type and Interface Naming

### Interfaces vs Types

**Use `interface` for object shapes** (preferred):
```typescript
// ✅ Good
interface PlayerFormProps {
  player?: Player
  onSuccess?: () => void
}

interface User {
  id: string
  name: string
  email: string
}

// ❌ Bad (use interface instead)
type PlayerFormProps = {
  player?: Player
  onSuccess?: () => void
}
```

**Use `type` for**:
- Unions: `type Status = 'active' | 'inactive'`
- Intersections: `type Extended = Base & Additional`
- Mapped types: `type Readonly<T> = { readonly [P in keyof T]: T[P] }`
- Type aliases: `type ID = string | number`

### Interface Naming

**Pattern**: `PascalCase` (descriptive noun)

```typescript
// ✅ Good
interface Player {
  id: string
  name: string
}

interface User {
  id: string
  email: string
}

interface Event {
  id: string
  title: string
}

// ❌ Bad
interface IPlayer                   // No "I" prefix
interface player                    // camelCase
interface PlayerInterface           // Redundant suffix
```

### Props Interface Naming

**Pattern**: `[Component]Props`

```typescript
// ✅ Good
interface PlayerFormProps {
  player?: Player
  onSuccess?: () => void
}

interface EventCardProps {
  event: Event
  onClick?: () => void
}

// ❌ Bad
interface PlayerFormProperties       // Too long
interface PlayerFormPropTypes        // Confusing with React prop-types
interface IPlayerFormProps           // No "I" prefix
```

### State Interface Naming

**Pattern**: `[Entity]State` (for store state)

```typescript
// ✅ Good
interface PlayersState {
  players: Player[]
  isLoading: boolean
  error: string | null
}

interface CoachesState {
  coaches: Coach[]
  selectedCoach: Coach | null
}

// ❌ Bad
interface PlayerStore                // Use "State" not "Store"
interface PlayersStoreState          // Redundant
```

### Zod Schema Naming

**Pattern**: `[entity][Action]Schema` (camelCase)

```typescript
// ✅ Good
const playerCreateSchema = z.object({ ... })
const playerUpdateSchema = z.object({ ... })
const playerQuerySchema = z.object({ ... })
const eventCreateSchema = z.object({ ... })

// ❌ Bad
const PlayerCreateSchema = z.object({ ... })  // PascalCase
const createPlayerSchema = z.object({ ... })  // Wrong order
const playerSchema = z.object({ ... })        // Not specific enough
```

### Type Aliases

**Pattern**: `PascalCase` (descriptive)

```typescript
// ✅ Good
type UserRole = 'admin' | 'coach' | 'player'
type Gender = 'male' | 'female'
type EventType = 'singles' | 'doubles' | 'team'
type ID = string

// ❌ Bad
type role = 'admin' | 'coach'              // camelCase
type USER_ROLE = 'admin' | 'coach'         // SCREAMING_SNAKE_CASE
```

---

## API Route Naming

### REST Conventions

**Pattern**: `/api/v1/[entities]` (plural, kebab-case)

```
✅ Good:
/api/v1/players
/api/v1/coaches
/api/v1/events
/api/v1/training-sessions      ✅ Kebab-case for multi-word
/api/v1/points-schemas
/api/v1/federation-clubs

❌ Bad:
/api/v1/player                 (singular)
/api/v1/Player                 (PascalCase)
/api/v1/training_sessions      (snake_case)
/api/v1/trainingSessions       (camelCase)
```

### Resource Paths

**Collections**: Plural
```
GET    /api/v1/players
POST   /api/v1/players
```

**Individual Resources**: Plural + ID
```
GET    /api/v1/players/[id]
PATCH  /api/v1/players/[id]
DELETE /api/v1/players/[id]
```

### Nested Resources

**Pattern**: `[parent]/[id]/[children]`

```
✅ Good:
/api/v1/events/[id]/registrations
/api/v1/training-sessions/[id]/attendance
/api/v1/players/[id]/test-results

❌ Bad:
/api/v1/event/[id]/registration      (singular)
/api/v1/events/[id]/Registration     (PascalCase)
```

### Route File Names

**Pattern**: `route.ts` (always)

```
src/app/api/v1/
├── players/
│   ├── route.ts                     ✅ Collection endpoints
│   └── [id]/
│       └── route.ts                 ✅ Individual resource endpoints
├── coaches/
│   └── route.ts
└── training-sessions/
    └── route.ts
```

---

## Database Naming

### Table Names

**Pattern**: `snake_case` (plural)

```sql
✅ Good:
players
coaches
events
training_sessions          -- Snake_case for multi-word
training_session_coaches
test_results

❌ Bad:
player                     -- Singular
Player                     -- PascalCase
trainingSession            -- camelCase
training-sessions          -- Kebab-case
```

### Column Names

**Pattern**: `snake_case`

```sql
✅ Good:
id
name
name_rtl
date_of_birth
created_at
organization_id           -- Foreign key: table_id pattern

❌ Bad:
dateOfBirth               -- camelCase
DateOfBirth               -- PascalCase
date-of-birth             -- Kebab-case
organizationId            -- camelCase FK
```

### Foreign Keys

**Pattern**: `[referenced_table]_id` (singular)

```sql
✅ Good:
organization_id           -- References organizations(id)
user_id                   -- References users(id)
player_id                 -- References players(id)
event_id                  -- References events(id)

❌ Bad:
organization              -- Missing _id suffix
organizationId            -- camelCase
org_id                    -- Abbreviated
```

### Junction Tables

**Pattern**: `[table1]_[table2]` (alphabetical order, both plural)

```sql
✅ Good:
player_events
coach_training_sessions
event_registrations

❌ Bad:
events_players            -- Wrong order (should be alphabetical)
PlayerEvents              -- PascalCase
player_event              -- Singular
```

---

## Quick Reference Table

| Type | Convention | Example | File Example |
|------|-----------|---------|--------------|
| **File: Component** | kebab-case.tsx | player-form.tsx | player-form.tsx |
| **File: Page** | kebab-case/page.tsx | players/page.tsx | players/page.tsx |
| **File: Store** | kebab-case-store.ts | players-store.ts | players-store.ts |
| **File: Util** | kebab-case.ts | tournament-utils.ts | tournament-utils.ts |
| **File: Type** | kebab-case.schemas.ts | players.schemas.ts | players.schemas.ts |
| **File: Hook** | use-kebab-case.ts | use-players.ts | use-players.ts |
| **Variable** | camelCase | playerName, isLoading | - |
| **Constant** | SCREAMING_SNAKE_CASE | MAX_NAME_LENGTH | - |
| **Function** | camelCase + verb | calculateAge | - |
| **Event Handler** | handle[Event] | handleSubmit | - |
| **Boolean Fn** | is/has/can/should | isAdmin, canEdit | - |
| **Component** | PascalCase | PlayerForm | - |
| **Interface** | PascalCase | PlayerFormProps | - |
| **Type Alias** | PascalCase | UserRole | - |
| **Zod Schema** | camelCase + Schema | playerCreateSchema | - |
| **API Route** | /kebab-case | /api/v1/players | - |
| **DB Table** | snake_case (plural) | players, events | - |
| **DB Column** | snake_case | date_of_birth | - |
| **DB FK** | table_id | organization_id | - |

---

## Related Documentation

- **Component Standards**: See `/docs/COMPONENT_STANDARDS.md`
- **State Management**: See `/docs/STATE_MANAGEMENT_STANDARDS.md`
- **API Development**: See `/docs/IMPLEMENTATION_STANDARDS.md`

---

## Enforcement

### TypeScript/ESLint Rules

**Consider adding**:
```json
{
  "@typescript-eslint/naming-convention": [
    "error",
    {
      "selector": "interface",
      "format": ["PascalCase"]
    },
    {
      "selector": "variable",
      "format": ["camelCase", "UPPER_CASE"]
    },
    {
      "selector": "function",
      "format": ["camelCase"]
    }
  ]
}
```

### Code Review Checklist

- [ ] Component files in kebab-case
- [ ] Component names in PascalCase
- [ ] Variables in camelCase
- [ ] Constants in SCREAMING_SNAKE_CASE
- [ ] Functions start with verbs
- [ ] Event handlers start with "handle"
- [ ] Boolean variables/functions use is/has/can
- [ ] Interfaces in PascalCase with descriptive names
- [ ] API routes in kebab-case, plural
- [ ] Database names in snake_case

---

## Reference Implementations

Browse the codebase for consistent naming examples:
- **Components**: `src/components/players/`, `src/components/ui/`
- **Stores**: `src/store/`
- **Types**: `src/types/api/`
- **API Routes**: `src/app/api/v1/`
- **Database**: `src/db/schema.ts`
