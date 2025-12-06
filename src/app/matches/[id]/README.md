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
| Updates    | Real-time       | Manual refresh     |
| Resilience | Requires socket | Works offline      |
| Location   | /matches/[id]   | Events page dialog |

## Shared Utilities

Match helper functions are in `/lib/utils/match.ts` and can be used by both
the socket page and REST dialog components.
