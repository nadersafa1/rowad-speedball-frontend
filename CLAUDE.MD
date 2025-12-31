# CLAUDE.MD - Rowad Speedball Management Platform

## Project Overview

This is a full-stack web application for managing Speedball sports teams, tournaments, and training. Speedball is a racquetball-like sport with competitive tournaments and skill assessments.

## Tech Stack

- **Frontend**: Next.js 15 (React 19) with TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: better-auth with Google OAuth
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
│   ├── ui/                 # 47 Radix UI + custom components
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
├── store/                  # Zustand state management (14 stores)
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
- Federation-level management
- User invitations with email

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

Available permission hooks:
- `usePlayerPermissions`
- `useEventPermissions`
- `useCoachPermissions`
- `useMatchPermissions`
- `useTestPermissions`
- `useTrainingSessionPermissions`
- And more...

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

### Table System
- `table-core-guide.md` - Table system documentation
- `PLAYERS_TABLE_IMPLEMENTATION.md` - Implementation example

### Authentication & Setup
- `GOOGLE_AUTH_IMPLEMENTATION.md` - OAuth setup
- `ENV_SETUP.md` - Environment configuration

### Implementation Notes
- `PHASE_1_UTILITIES.md` - Tournament utilities
- `IMPLEMENTATION_COMPLETE.md` - Phase completion notes
- `CHANGELOG_PHASE1.md` - Change tracking

## Recent Development Focus

1. **Forms standardization** - All 26 forms now use React Hook Form + Zod
   - Created shared validation schemas (`src/lib/forms/patterns.ts`)
   - Created reusable form components (LoadingButton, FormError, CharacterCounter)
   - Comprehensive documentation for form development
2. **Backend authorization helpers** - Centralized authorization checks
3. **Frontend permission hooks** - usePlayerPermissions, useEventPermissions, etc.
4. **Component migration** - Using permission hooks throughout
5. **Table-Core system** - Reusable data table abstraction (v1.3.29)

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

## Important Notes

- Always check authorization on both frontend (UI) and backend (API)
- Use the table-core system for new entity tables
- Follow the single-responsibility principle for stores
- Use Zod for all validation
- Prefer feature-based organization over type-based
- Keep tournament logic in utility functions
- Use the API client for all HTTP requests
- Test bracket generation thoroughly (complex edge cases)
