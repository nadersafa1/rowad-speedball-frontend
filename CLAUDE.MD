# CLAUDE.MD - Rowad Speedball Management Platform

## Project Overview

This is a full-stack web application for managing Speedball sports teams, tournaments, and training. Speedball is a racquetball-like sport with competitive tournaments and skill assessments.

## Tech Stack

- **Frontend**: Next.js 16.1 (React 19.2) with TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM 0.45
- **Authentication**: better-auth 1.4 with Google OAuth
- **State Management**: Zustand
- **UI**: Radix UI components + Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Data Tables**: TanStack React Table v8
- **Real-time**: Socket.IO
- **Image Management**: Cloudinary

## Architecture Overview

```
src/
├── app/                     # Next.js App Router (pages & API routes)
│   ├── api/v1/             # RESTful API endpoints
│   ├── auth/               # Authentication pages
│   ├── admin/              # System admin interface
│   └── [features]/         # Feature pages (players, coaches, events, etc.)
├── components/             # React components (organized by feature)
│   ├── ui/                 # 45+ Radix UI + custom components
│   ├── forms/              # Reusable form components
│   │   ├── loading-button.tsx
│   │   ├── form-error.tsx
│   │   └── character-counter.tsx
│   ├── shared/             # Reusable feature components
│   └── [feature]/          # Feature-specific components
├── lib/                    # Core business logic
│   ├── authorization/      # RBAC permission helpers
│   ├── table-core/         # Reusable table system
│   ├── forms/              # Shared form validation schemas
│   │   └── patterns.ts     # Centralized Zod schemas
│   ├── services/           # Business logic (brackets, groups, matches)
│   ├── utils/              # Tournament algorithms, formatting
│   ├── validations/        # Zod schemas
│   ├── auth.ts             # better-auth config
│   ├── db.ts               # Database connection
│   └── api-client.ts       # HTTP client
├── store/                  # Zustand state management (19 stores)
├── hooks/                  # React hooks (authorization, features)
├── db/                     # Database schema & seeder
├── types/                  # TypeScript types & Zod schemas
├── config/                 # Configuration (table-core configs)
└── actions/                # Server actions
```

## Key Features

### 1. Player Management
- CRUD operations for player profiles
- Age groups: mini, U-09, U-11, U-13, U-15, U-17, U-19, U-21, Seniors
- Player notes (performance, medical, behavioral, general)
- Search, filter, sort, pagination, export (CSV)

### 2. Events & Tournaments
- Event types: super-solo, speed-solo, juniors-solo, singles, doubles, relay, team
- Tournament formats: groups, single-elimination, double-elimination, groups-knockout, test
- Player registration with position scoring (Right, Left, Forehand, Backhand)
- Heat-based test events (8+ players per heat)
- Third-place match support

### 3. Match Management
- Single and double-elimination bracket generation
- Modified double-elimination support
- Set/score tracking (best-of odd numbers: 1, 3, 5, 7)
- Real-time bracket visualization
- Match scheduling and results

### 4. Training Sessions
- Schedule and manage training sessions
- Track attendance with bulk operations
- Associated events

### 5. Assessments/Tests
- Player skill testing
- Track left/right hand and forehand/backhand scores
- Multiple score types
- Public/private visibility

### 6. Organizations & Multi-tenancy
- Multi-tenant support (club/organization management)
- Federation-level management with dedicated admin interface
- Federation club/player request management
- User invitations with email

### 7. Ranking & Points System
- Points schemas for different event types
- Placement tiers (WINNER, FINALIST, SF, QF, etc.)
- Points schema entries mapping tiers to point values
- Dynamic point calculation based on event results
- Support for championship vs. regular event point systems

## Authentication & Authorization

### Roles (RBAC)
```
super_admin          # System administrator
federation-admin     # Federation administrator
federation-editor    # Federation content editor
organization owner   # Full organization control
admin               # Organization administrator
coach               # Coach (limited permissions)
player              # Player (read-only)
member              # Basic member access
```

### Authorization Pattern

**Frontend** (in components):
```typescript
import { usePlayerPermissions } from '@/hooks/authorization/usePlayerPermissions';

const { canCreate, canEdit, canDelete } = usePlayerPermissions();

if (canCreate) {
  // Show create button
}
```

**Backend** (in API routes):
```typescript
import { checkPlayerCreateAuthorization } from '@/lib/authorization';

const authError = await checkPlayerCreateAuthorization(request);
if (authError) return authError;
```

Available permission hooks (17 total):
- `usePlayerPermissions`
- `useEventPermissions`
- `useCoachPermissions`
- `useMatchPermissions`
- `useTestPermissions`
- `useTrainingSessionPermissions`
- `useChampionshipPermissions`
- `useFederationPermissions`
- `useFederationClubRequestPermissions`
- `useGroupPermissions`
- `useOrganizationPermissions`
- `usePlayerNotePermissions`
- `usePointsSchemaPermissions`
- `useRegistrationPermissions`
- `useResultPermissions`
- `useSetPermissions`
- `useUserPermissions`

### Specialized Context Hooks (NEW)

In addition to entity-specific permission hooks, three specialized hooks provide direct access to role and context data:

**`useRoles`** - Role checking and authentication status:
```typescript
import { useRoles } from '@/hooks/authorization/use-roles';

const {
  isSystemAdmin,
  isFederationAdmin,
  isFederationEditor,
  isOwner,
  isAdmin,
  isCoach,
  isPlayer,
  isAuthenticated,
  isLoading
} = useRoles();
```

**`useOrganization`** - Organization context data:
```typescript
import { useOrganization } from '@/hooks/authorization/use-organization';

const {
  organization,
  organizationId,
  isOwner,
  isAdmin,
  isLoading
} = useOrganization();
```

**`useFederation`** - Federation context data:
```typescript
import { useFederation } from '@/hooks/authorization/use-federation';

const {
  federationId,
  isFederationAdmin,
  isFederationEditor,
  isSystemAdmin,
  isLoading
} = useFederation();
```

**When to use each:**
- Use `useRoles()` for simple role checks in page components
- Use `useOrganization()` when you need organization data or ID
- Use `useFederation()` for federation-level features
- Use `use[Entity]Permissions()` for entity-specific permission checks
- Avoid using `useOrganizationContext()` directly in page components

## Table-Core System (NEW)

Reusable data table abstraction for entity management.

**Location**: `src/lib/table-core/`

**Configuration Example** (`src/config/tables/playersTableConfig.ts`):
```typescript
export const playersTableConfig: TableConfig<Player> = {
  entity: 'player',
  columns: [...],
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
    createPath: '/players/new',
    editPath: (id) => `/players/${id}`,
  },
};
```

**Documentation**: See `/docs/table-core-guide.md`

## Database Schema (Key Tables)

### Core
- `user` - System users with federation role support
- `organization` - Clubs/teams
- `member` - User-organization relationships
- `session` - User sessions
- `invitation` - Organization invitations
- `federation_club_requests` - Club requests to join federation
- `federation_player_requests` - Player requests for federation management

### Players & Coaches
- `players` - Player profiles (name, DOB, gender, preferred hand, team level)
- `player_notes` - Notes on players

### Events & Matches
- `events` - Tournament/event definitions
- `registrations` - Player/team registrations
- `registration_players` - Many-to-many with position scores (JSONB)
- `groups` - Event groups
- `matches` - Match records
- `sets` - Set/game scores

### Training & Testing
- `training_sessions` - Training session definitions
- `training_session_attendance` - Attendance tracking
- `tests` - Skill test definitions
- `test_results` - Player test scores

### Championships
- `championships` - Championship organizations

### Ranking System
- `placement_tiers` - Placement tiers (WINNER, FINALIST, SF, QF, etc.)
- `points_schemas` - Named point systems for events
- `points_schema_entries` - Maps placement tiers to point values within schemas

## Development Standards & Documentation

### Core Standards (Always Follow)

Before writing any code, consult the relevant standards documentation:

1. **Authorization & Access Control**
   - **Read**: `/docs/AUTHORIZATION_RULES.md` - Complete entity authorization matrix
   - **Read**: `/docs/AUTHORIZATION_HOOKS_REFACTOR.md` - Specialized hook usage patterns
   - **Use**: Specialized hooks (`useRoles()`, `useOrganization()`, `useFederation()`)
   - **Pattern**: Backend auth helpers + frontend permission hooks

2. **Forms Development**
   - **Read**: `/docs/FORMS_GUIDE.md` - Comprehensive form development guide
   - **Read**: `/docs/FORMS_REFERENCE.md` - Quick validation schema reference
   - **Use**: React Hook Form + Zod validation
   - **Use**: `<FormError>`, `<LoadingButton>`, shared validation schemas from `@/lib/forms/patterns.ts`

3. **Error Handling**
   - **Read**: `/docs/IMPLEMENTATION_STANDARDS.md` - Error handling patterns
   - **Use**: `handleApiError()` in all API routes with error IDs and severity levels
   - **Pattern**: Structured logging ready for production monitoring (Sentry, DataDog, CloudWatch)

4. **UI & Components**
   - **Read**: `/docs/UI_COMPONENT_STANDARDS.md` - Radix UI + Tailwind patterns
   - **Read**: `/docs/COMPONENT_STANDARDS.md` - Component organization & structure
   - **Use**: Standard layout patterns (Container → PageHeader → Card → Content)
   - **Use**: Loading/error/empty state components (`<Loading />`, `<FormError>`, `<EmptyState>`)

5. **State Management**
   - **Read**: `/docs/STATE_MANAGEMENT_STANDARDS.md` - Zustand store patterns
   - **Use**: Single-responsibility stores with standard structure
   - **Pattern**: Standard async action pattern (set loading → try/catch → update state)
   - **Don't**: Use stores for form state, filters, or temporary UI state

6. **Naming Conventions**
   - **Read**: `/docs/NAMING_CONVENTIONS.md` - Complete naming standards
   - **Files**: kebab-case.tsx for components, kebab-case-store.ts for stores
   - **Components**: PascalCase (PlayerForm, EventCard)
   - **Variables**: camelCase (playerName, isLoading)
   - **Constants**: SCREAMING_SNAKE_CASE (MAX_NAME_LENGTH)
   - **Functions**: camelCase with action verb (calculateAge, handleSubmit)

7. **Data Tables**
   - **Read**: `/docs/table-core-guide.md` - Table system documentation
   - **New tables**: Always use table-core system (1 config file vs 7 files)
   - **Existing tables**: Migrate opportunistically when making changes
   - **Pattern**: Declarative config with built-in features (search, filters, sorting, export)

8. **API Development**
   - **Read**: `/docs/IMPLEMENTATION_STANDARDS.md` - API patterns & standards
   - **Use**: Zod validation with safeParse, organization context, standardized responses
   - **Pattern**: PaginatedResponse for lists, error responses with tracking IDs
   - **Use**: `resolveOrganizationId()` helper to reduce duplicate code

### Quick Reference

**Before Writing Code**:
1. Identify which standard applies (authorization, forms, UI, state, etc.)
2. Read the relevant standards documentation
3. Review a reference implementation in existing code
4. Follow the established patterns

**Reference Implementations** (Real code examples):
- **Forms**: `src/components/players/player-form.tsx`
- **API Routes**: `src/app/api/v1/players/route.ts`
- **Page Layout**: `src/app/players/page.tsx`
- **Store**: `src/store/players-store.ts`
- **Table Config**: `src/config/tables/playersTableConfig.ts`
- **Authorization**: `src/lib/authorization/` + `src/hooks/authorization/`

### Standards Documentation Map

```
Authorization:
├── AUTHORIZATION_RULES.md          ← Entity permissions matrix
├── AUTHORIZATION_HOOKS_REFACTOR.md ← Specialized hooks guide
└── PUBLIC_VS_AUTHENTICATED_ACCESS.md ← Access control

Forms:
├── FORMS_GUIDE.md                  ← Comprehensive guide
├── FORMS_REFERENCE.md              ← Quick reference
└── FORMS_CHECKLIST.md              ← Development checklist

UI & Components:
├── UI_COMPONENT_STANDARDS.md       ← Radix UI + Tailwind patterns
├── COMPONENT_STANDARDS.md          ← Component organization
└── NAMING_CONVENTIONS.md           ← File, component, variable naming

Backend:
├── IMPLEMENTATION_STANDARDS.md     ← Error handling, API patterns, migrations
└── table-core-guide.md             ← Data tables

State & Algorithms:
├── STATE_MANAGEMENT_STANDARDS.md   ← Zustand store patterns
└── TOURNAMENT_ALGORITHMS.md        ← Bracket generation
```

### When Implementing New Features

Follow this checklist for new entity features:

1. **Database**: Create schema in `src/db/schema.ts`
2. **Types**: Create Zod schemas in `src/types/api/[entity].schemas.ts`
3. **API**: Create route in `src/app/api/v1/[entity]/route.ts`
   - Use `handleApiError()` for error handling
   - Use `resolveOrganizationId()` for org context
   - Return `PaginatedResponse` for lists
4. **Store**: Create Zustand store in `src/store/[entity]-store.ts`
   - Follow standard state shape (items, pagination, isLoading, error)
   - Use standard async action pattern
5. **Authorization**:
   - Backend: Create helpers in `src/lib/authorization/`
   - Frontend: Create hook in `src/hooks/authorization/`
6. **Table**: Create config in `src/config/tables/[entity].config.ts`
   - Use table-core system
   - Configure features (search, filters, sorting, export)
7. **Components**: Create in `src/components/[entity]/`
   - Form: Use `<FormError>`, `<LoadingButton>`, shared validation schemas
   - Card: Follow standard card pattern
8. **Pages**: Create in `src/app/[entity]/`
   - Use standard layout (Container → PageHeader → Card → Content)
   - Use specialized authorization hooks (useRoles, useOrganization)

## Common Patterns & Conventions

### 1. API Client Pattern
```typescript
import { apiClient } from '@/lib/api-client';

const response = await apiClient.get('/api/v1/players');
const player = await apiClient.post('/api/v1/players', { name: 'John' });
```

### 2. Zustand Store Pattern
```typescript
// Single-responsibility stores
import { usePlayersStore } from '@/store/players-store';

const { players, fetchPlayers, createPlayer } = usePlayersStore();
```

### 3. API Route Pattern
```typescript
export async function GET(request: NextRequest) {
  // 1. Get organization context
  const context = await getOrganizationContext();

  // 2. Parse query params with Zod
  const params = parseQueryParams(request);

  // 3. Build conditions & query database
  const players = await db.query.players.findMany({ ... });

  // 4. Return paginated response
  return NextResponse.json({ data: players, pagination });
}

export async function POST(request: NextRequest) {
  // 1. Get context & check authorization
  const authError = await checkPlayerCreateAuthorization(request);
  if (authError) return authError;

  // 2. Parse & validate body
  const body = await request.json();
  const validated = playerSchema.parse(body);

  // 3. Create in database
  const player = await db.insert(players).values(validated);

  // 4. Return response
  return NextResponse.json(player, { status: 201 });
}
```

### 4. Organization Context System
```typescript
const context = await getOrganizationContext();
// Returns: role, permissions, federation info, authentication status
// Cached in better-auth cookie cache (1 minute)
```

### 5. TypeScript Path Aliases
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/types/*` → `./src/types/*`
- `@/store/*` → `./src/store/*`

### 6. Age Calculation
Season-based: July-December = new season

### 7. Position Scores
JSONB with keys: R (Right), L (Left), F (Forehand), B (Backhand)

### 8. Best-Of Matches
Must be odd numbers: 1, 3, 5, 7

### 9. Test Events
Support for heats (default 8 players per heat)

### 10. Points Schema System
- Points schemas are reusable across multiple events
- Placement tiers define tournament positions (WINNER, FINALIST, etc.)
- Points schema entries map tiers to point values
- Different schemas for different event types (championships vs. regular)
- Points are calculated dynamically based on event's assigned schema

## Tournament Algorithms

Located in: `src/lib/utils/`

- **Single-elimination**: generators, helpers, types
- **Double-elimination**: with seeding support
- **Modified double-elimination**: custom brackets
- **Round-robin**: for group stages
- **Test event heat management**

## Important Files

### Entry Points
- `src/app/page.tsx` - Home page
- `src/app/layout.tsx` - Root layout
- `src/lib/auth.ts` - Authentication config
- `src/lib/db.ts` - Database connection

### Key Utilities
- `src/lib/organization-helpers.ts` - Organization context & role management
- `src/lib/utils/tournament-utils.ts` - Tournament bracket logic
- `src/lib/utils/formatters.ts` - Formatting functions
- `src/lib/api-client.ts` - HTTP client

### Authorization
- `src/lib/authorization/index.ts` - Backend helpers
- `src/hooks/authorization/` - Frontend permission hooks

## Development Workflow

### Common Commands
```bash
# Development
npm run dev

# Database
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database

# Build
npm run build
npm run start
```

### Environment Variables
See `/docs/ENV_SETUP.md` for required environment variables:
- Database connection (PostgreSQL)
- better-auth secrets
- Google OAuth credentials
- Cloudinary config
- Socket.IO settings

## Documentation

Available guides in `/docs/`:

### Forms
- `FORMS_GUIDE.md` - Comprehensive form development guide
- `FORMS_REFERENCE.md` - Quick reference for validation schemas and components
- `FORMS_CHECKLIST.md` - Migration and development checklists

### Authorization & Security
- `AUTHORIZATION_HOOKS_REFACTOR.md` - Specialized authorization hooks refactoring
- `AUTHORIZATION_RULES.md` - Complete authorization rules and patterns
- `PUBLIC_VS_AUTHENTICATED_ACCESS.md` - Access control documentation

### Table System
- `table-core-guide.md` - Table system documentation
- `PLAYERS_TABLE_IMPLEMENTATION.md` - Implementation example

### Authentication & Setup
- `GOOGLE_AUTH_IMPLEMENTATION.md` - OAuth setup
- `ENV_SETUP.md` - Environment configuration

### Architecture & Standards
- `IMPLEMENTATION_STANDARDS.md` - Development standards and best practices
- `TOURNAMENT_ALGORITHMS.md` - Tournament bracket algorithms

## Recent Development Focus

1. **Next.js 16.1 Migration** - LATEST (Jan 2026)
   - Upgraded from Next.js 15.5.4 to 16.1.1
   - Updated React from 19.1.0 to 19.2.3
   - Updated React types to @types/react 19.2.8
   - Updated Drizzle ORM from 0.44.6 to 0.45.1
   - Updated better-auth from 1.3.29 to 1.4.12
   - Updated lucide-react, date-fns, and drizzle-kit
   - Fixed CSS @import ordering for Turbopack compatibility
   - All async Dynamic APIs already using correct patterns
   - Production build verified successful
   - Key benefits: Security fixes (CVE-2025-55182, CVE-2025-66478), Turbopack improvements

2. **Authorization Hooks Refactoring** (Jan 2026)
   - Created 3 specialized context hooks: `useRoles`, `useOrganization`, `useFederation`
   - Refactored 25+ page components to use specialized hooks instead of direct context access
   - Improved separation of concerns and testability
   - Better TypeScript inference and clearer component intent
   - See `/docs/AUTHORIZATION_HOOKS_REFACTOR.md` for details

3. **Federation Management System**
   - Federation player request management system
   - Federation club request handling
   - Dedicated federation admin interface
   - Role-based filtering for player queries

3. **Socket.IO Enhancement**
   - Enhanced type safety for socket event listeners
   - Improved connection status management
   - Better error handling for real-time features

4. **Ranking & Points System**
   - Points schemas for flexible point allocation across event types
   - Placement tiers system (WINNER, FINALIST, SF, QF, R16, etc.)
   - Points schema entries for tier-to-points mapping
   - Support for championship vs. regular event point systems
   - Admin UI for managing points schemas and tiers

5. **Forms Standardization**
   - All 26 forms use React Hook Form + Zod
   - Created shared validation schemas (`src/lib/forms/patterns.ts`)
   - Created reusable form components (LoadingButton, FormError, CharacterCounter)
   - Comprehensive documentation for form development

6. **Authorization System**
   - Backend authorization helpers with centralized checks
   - Frontend permission hooks (17 entity-specific + 3 context hooks)
   - Component migration to use permission hooks throughout

7. **Table-Core System**
   - Reusable data table abstraction (v1.3.29)
   - Combobox refactoring with BaseCombobox for improved functionality

## When Implementing New Features

1. **Create database schema** in `src/db/schema.ts`
2. **Create Zod schemas** in `src/types/api/[entity].schemas.ts`
3. **Create API routes** in `src/app/api/v1/[entity]/route.ts`
4. **Create Zustand store** in `src/store/[entity]-store.ts`
5. **Create authorization helpers** in `src/lib/authorization/`
6. **Create permission hook** in `src/hooks/authorization/`
7. **Create table config** in `src/config/tables/` (if needed)
8. **Create components** in `src/components/[entity]/`
9. **Create pages** in `src/app/[entity]/`

## Socket.IO & Real-time Features

The application uses Socket.IO for real-time updates.

**Key Features:**
- Type-safe socket event listeners
- Connection status management
- Error handling and reconnection logic
- Real-time bracket updates
- Live score updates

**Usage Pattern:**
```typescript
import { useSocket } from '@/hooks/use-socket'

const MyComponent = () => {
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    socket?.on('event-name', (data) => {
      // Handle event
    })

    return () => {
      socket?.off('event-name')
    }
  }, [socket])
}
```

## Important Notes

- Always check authorization on both frontend (UI) and backend (API)
- Use specialized authorization hooks (`useRoles`, `useOrganization`, `useFederation`) in page components
- Avoid using `useOrganizationContext()` directly in page components
- Use entity-specific permission hooks (`use[Entity]Permissions`) for permission checks
- Use the table-core system for new entity tables
- Follow the single-responsibility principle for stores
- Use Zod for all validation
- Prefer feature-based organization over type-based
- Keep tournament logic in utility functions
- Use the API client for all HTTP requests
- Test bracket generation thoroughly (complex edge cases)
- Ensure Socket.IO event listeners are properly typed and cleaned up
