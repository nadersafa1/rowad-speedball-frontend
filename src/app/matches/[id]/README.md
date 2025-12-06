# Match Detail Page (Live Scoring)

This page provides real-time match scoring via WebSocket connection.

## Architecture

```
page.tsx                    # Main page component
├── _hooks/
│   ├── use-match-socket.ts # Orchestrates socket connection & events
│   ├── use-match-data.ts   # Manages match state & event handlers
│   └── use-match-actions.ts # Score updates, set management
├── _components/
│   ├── match-info.tsx      # Date picker & event details
│   ├── match-scoring.tsx   # Current set editor & add set
│   ├── winner-celebration.tsx
│   ├── loading-states.tsx
│   └── match-header.tsx
└── _utils/
    └── match-helpers.ts    # Re-exports from @/lib/utils/match
```

## Data Flow

1. **Connection**: `useSocket` (global) manages WebSocket connection
2. **Match Loading**: `useMatchSocket` requests match data via `GET_MATCH` event
3. **Real-time Updates**: Socket events update local state immediately
4. **Actions**: Score changes emit events that broadcast to all connected clients

## Backend Data Enrichment

Match data is enriched using a shared service (`@/lib/services/match-enrichment.service.ts`) that:
- Fetches sets (ordered by setNumber)
- Enriches registrations with player data
- Includes `bestOf` from event
- Includes group and event data
- Sets `isByeMatch` flag

This service is used by both:
- **REST API** (`/api/v1/matches/[id]`) - For dialog-based edits
- **Socket Backend** (`getMatch` handler) - For real-time updates

This ensures consistent data structure across all endpoints.

## Socket Events

### Client → Server

- `join-match` - Join match room for updates
- `leave-match` - Leave match room
- `get-match` - Request match data
- `create-set` - Create new set
- `update-set-score` - Update set scores
- `mark-set-played` - Mark set as completed
- `update-match` - Update match date/status

### Server → Client

- `match-data` - Full match data response
- `set-created` - New set was created
- `match-score-updated` - Score changed (includes `played` flag)
- `set-played` - Set marked complete (includes match completion info)
- `match-completed` - Match finished, winner determined
- `match-updated` - Match date/status changed

## vs REST Dialog (match-results-form.tsx)

| Feature    | Socket Page     | REST Dialog        |
| ---------- | --------------- | ------------------ |
| Use Case   | Live scoring    | Quick admin edits  |
| Updates    | Real-time       | Optimistic (store) |
| Resilience | Requires socket | Works offline      |
| Location   | /matches/[id]   | Events page dialog |
| State      | Local (socket)  | Zustand store      |

## Shared Utilities & Services

### Utilities (`/lib/utils/match.ts`)
Match helper functions used by both socket page and REST dialog:
- `formatRegistrationName` - Format player names for display
- `hasMajorityFromSets` - Check if majority reached
- `areAllSetsPlayed` - Check if all sets completed
- `calculateSetWins` - Calculate wins per registration

### Services (`/lib/services/match-enrichment.service.ts`)
Shared match enrichment service ensures consistent data structure:
- Used by REST API endpoints
- Used by Socket backend
- Single source of truth for match data enrichment

### State Management
- **Socket Page**: Uses local state managed by `useMatchData` hook
- **REST Dialog**: Uses Zustand store (`useMatchesStore`) as single source of truth
  - No local state duplication
  - Optimistic updates
  - Automatic sync after actions
