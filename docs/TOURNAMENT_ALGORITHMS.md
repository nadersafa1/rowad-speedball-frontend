# Tournament Algorithm Documentation

This document explains the complex tournament bracket generation algorithms used in the Rowad Speedball platform.

## Table of Contents
- [Overview](#overview)
- [Single Elimination](#single-elimination)
- [Double Elimination](#double-elimination)
- [Modified Double Elimination](#modified-double-elimination)
- [Round Robin (Groups)](#round-robin-groups)
- [Seeding](#seeding)
- [BYE Management](#bye-management)

---

## Overview

The platform supports multiple tournament formats:

1. **Single Elimination** - Standard knockout bracket
2. **Double Elimination** - Full double elimination with winners and losers brackets
3. **Modified Double Elimination** - Reduced losers bracket (starts at semifinals or quarterfinals)
4. **Round Robin (Groups)** - Group stage with all teams playing each other
5. **Groups + Knockout** - Combination of round robin followed by elimination

**Implementation Location**: `src/lib/utils/`

---

## Single Elimination

### Overview
Standard knockout tournament where each loss eliminates a team.

### Algorithm (`single-elimination.ts`)

#### Key Concepts

**1. Power of 2 Requirement**
- Bracket must have 2^n slots (4, 8, 16, 32, 64, etc.)
- If participants < nearest power of 2, BYEs are added
- Example: 13 participants → 16-slot bracket (3 BYEs)

**2. Bracket Structure**
```
Round 1 (8 teams)
├─ Match 1: Team 1 vs Team 8
├─ Match 2: Team 4 vs Team 5
├─ Match 3: Team 2 vs Team 7
└─ Match 4: Team 3 vs Team 6

Round 2 (Semifinals - 4 teams)
├─ Match 5: Winner(M1) vs Winner(M2)
└─ Match 6: Winner(M3) vs Winner(M4)

Round 3 (Finals - 2 teams)
└─ Match 7: Winner(M5) vs Winner(M6)
```

#### Generation Steps

**Step 1: Calculate Bracket Size**
```typescript
const bracketSize = Math.pow(2, Math.ceil(Math.log2(numParticipants)))
// Examples:
// 5-8 participants → 8 slots
// 9-16 participants → 16 slots
// 17-32 participants → 32 slots
```

**Step 2: Determine BYE Placement**
```typescript
const numByes = bracketSize - numParticipants
// BYEs are distributed evenly across top and bottom of bracket
// Top seed plays last seed, second seed plays second-to-last, etc.
```

**Step 3: Standard Seeding Pattern**
```
For 8-team bracket:
Match 1: Seed 1 vs Seed 8
Match 2: Seed 4 vs Seed 5
Match 3: Seed 2 vs Seed 7
Match 4: Seed 3 vs Seed 6

Pattern ensures:
- Top seeds don't meet until later rounds
- Strongest teams are separated
- Fair progression path
```

**Step 4: Create Match Tree**
```typescript
interface Match {
  id: string
  round: number
  matchNumber: number
  registration1Id: string | null  // null = BYE
  registration2Id: string | null  // null = BYE
  winnerTo: string | null         // Next match ID
  winnerToSlot: number | null     // Which slot (1 or 2)
}
```

#### BYE Handling

**Automatic Advancement**:
- If registration1Id is null → registration2Id advances automatically
- If registration2Id is null → registration1Id advances automatically
- BYE matches are marked as `played: true` immediately

**BYE Distribution Strategy**:
```typescript
// Top-heavy distribution
// Example: 5 teams, 8-slot bracket (3 BYEs)
Match 1: Team 1 vs BYE     → Team 1 advances
Match 2: Team 4 vs Team 5  → Winner plays
Match 3: Team 2 vs BYE     → Team 2 advances
Match 4: Team 3 vs BYE     → Team 3 advances
```

#### Third Place Match

**Optional Feature**: Enabled by `hasThirdPlaceMatch` flag

```
Semifinals:
  Match A: Team 1 vs Team 2 → Winner to Finals
  Match B: Team 3 vs Team 4 → Winner to Finals

Finals:
  Match C: Winner(A) vs Winner(B)

Third Place:
  Match D: Loser(A) vs Loser(B)
```

**Implementation**: Created as a separate match linked to both semifinal matches.

---

## Double Elimination

### Overview
Each team gets two losses before elimination. Winners bracket for undefeated teams, losers bracket for teams with one loss.

### Algorithm (`double-elimination.ts`)

#### Bracket Structure

```
Winners Bracket (top half):
  Round 1 → Round 2 → Round 3 → Winners Final

Losers Bracket (bottom half):
  Round 1 → Round 2 → Round 3 → Losers Final → Grand Final
  ↑        ↑        ↑
  From WR1  From WR2  From WR3

Grand Final:
  Winner(Winners Final) vs Winner(Losers Final)
  If losers bracket winner wins → Play grand final rematch
```

#### Key Concepts

**1. Losers Bracket Feeding**
- Teams that lose in winners bracket drop to losers bracket
- Drop position is calculated to maintain fair progression
- Higher seeds in losers bracket get better placement

**2. Round Calculation**
```typescript
// Winners bracket rounds
const winnersRounds = Math.ceil(Math.log2(bracketSize))

// Losers bracket has nearly double the rounds
const losersRounds = (winnersRounds * 2) - 1

// Example: 8 teams
// Winners rounds: 3 (QF, SF, F)
// Losers rounds: 5 (LR1, LR2, LR3, LR4, LF)
```

**3. Drop Pattern**
```
Winners Round 1 losers → Losers Round 1 (direct drop)
Winners Round 2 losers → Losers Round 3 (skip LR1-2)
Winners Round 3 losers → Losers Round 5 (skip LR1-4)

Pattern: Losers dropped from WRn enter LR(2n-1)
```

#### Generation Steps

**Step 1: Generate Winners Bracket**
- Create standard single-elimination bracket
- Track all matches and progression

**Step 2: Generate Losers Bracket**
- Calculate losers bracket size (same as winners initial)
- Create initial losers matches from WR1 droppers
- Create subsequent rounds with both:
  - Losers bracket progression
  - Winners bracket droppers

**Step 3: Link Brackets**
```typescript
// Winners Round 1
Match WR1-1: T1 vs T8
  → Winner to WR2-1
  → Loser to LR1-1

// Losers Round 1
Match LR1-1: Loser(WR1-1) vs Loser(WR1-4)
  → Winner to LR2-1

// Losers Round 2 (receives both LR1 winners and WR2 losers)
Match LR2-1: Winner(LR1-1) vs Loser(WR2-1)
  → Winner to LR3-1
```

**Step 4: Grand Final Logic**
- Winner of Winners Final waits in Grand Final
- Winner of Losers Final must beat them TWICE
- First GF loss → Grand Final Rematch (GFR)
- GFR winner is champion

#### Seeding in Double Elimination

```typescript
// Standard seeding for 8 teams
Winners Bracket:
  WR1-1: Seed 1 vs Seed 8
  WR1-2: Seed 4 vs Seed 5
  WR1-3: Seed 2 vs Seed 7
  WR1-4: Seed 3 vs Seed 6

Losers Bracket (initial):
  LR1-1: Loser(WR1-1) vs Loser(WR1-4)  // Seeds 1/8 vs 3/6
  LR1-2: Loser(WR1-2) vs Loser(WR1-3)  // Seeds 4/5 vs 2/7

Maintains competitive balance in losers bracket
```

---

## Modified Double Elimination

### Overview
Reduced double elimination where losers bracket starts at semifinals or quarterfinals instead of round 1.

### Algorithm (`modified-double-elimination.ts`)

#### Configuration

```typescript
losersStartRoundsBeforeFinal: number | null

Examples:
- null = Full double elimination (losers bracket from round 1)
- 1 = Losers bracket starts at semifinals (2 teams)
- 2 = Losers bracket starts at quarterfinals (4 teams)
```

#### Why Modified?

**Advantages**:
- Shorter tournament duration
- Reduces number of matches
- Still gives second chance to strong teams

**Use Cases**:
- Large tournaments with time constraints
- Consolation bracket for top finishers only
- Hybrid approach: Early rounds are win-or-go-home

#### Example: 16-Team Modified (Start at QF)

```
Winners Bracket (all 16 teams):
  Round 1: 16 → 8 teams (8 matches)
  Round 2: 8 → 4 teams (4 matches, LOSERS DROP HERE)
  Round 3: 4 → 2 teams (2 matches, LOSERS DROP HERE)
  Winners Final: 2 → 1 team

Losers Bracket (only teams from QF onwards):
  LR1: 4 losers from Round 2 (2 matches)
  LR2: 2 winners + 2 losers from Round 3 (2 matches)
  Losers Final: 2 → 1 team

Grand Final:
  Winner(Winners Final) vs Winner(Losers Final)
```

#### Generation Algorithm

**Step 1: Determine Losers Bracket Entry Point**
```typescript
const winnersRounds = Math.ceil(Math.log2(bracketSize))
const losersStartRound = winnersRounds - losersStartRoundsBeforeFinal

// Example: 16 teams (4 rounds total)
// losersStartRoundsBeforeFinal = 2
// losersStartRound = 4 - 2 = 2 (round 2 / quarterfinals)
```

**Step 2: Generate Winners Bracket (Full)**
- All teams enter winners bracket
- Standard single-elimination structure
- Track which rounds feed losers bracket

**Step 3: Generate Losers Bracket (Partial)**
- Only create losers matches for designated rounds
- First losers round receives droppers from `losersStartRound`
- Subsequent rounds work like standard double elimination

**Step 4: Handle Early Round Losers**
```typescript
// Teams that lose before losersStartRound are eliminated immediately
// No second chance for these teams
```

---

## Round Robin (Groups)

### Overview
Every team plays every other team in their group exactly once.

### Algorithm

#### Match Generation

**Formula**:
```typescript
const numTeams = teamsInGroup.length
const numMatches = (numTeams * (numTeams - 1)) / 2

// Example: 4 teams
// Matches = (4 * 3) / 2 = 6
```

**Generation**:
```typescript
// For teams [A, B, C, D]:
Matches:
  1. A vs B
  2. A vs C
  3. A vs D
  4. B vs C
  5. B vs D
  6. C vs D
```

#### Scheduling Algorithm (Round-Robin)

For even number of teams, use **circle method**:

```
Round 1:  1-8  2-7  3-6  4-5
Round 2:  1-7  8-6  2-5  3-4
Round 3:  1-6  7-5  8-4  2-3
Round 4:  1-5  6-4  7-3  8-2
Round 5:  1-4  5-3  6-2  7-8
Round 6:  1-3  4-2  5-8  6-7
Round 7:  1-2  3-8  4-7  5-6
```

**How it works**:
1. Fix team 1 in position
2. Rotate all other teams clockwise
3. Each round produces n/2 matches

For odd number of teams:
- Add a "dummy" team (BYE)
- Apply even-number algorithm
- Team paired with dummy gets a BYE that round

#### Points Calculation

```typescript
Win: 3 points (configurable via pointsPerWin)
Loss: 0 points (configurable via pointsPerLoss)
Draw: 1 point (if draws are enabled)
```

#### Tie-Breaking Rules

When teams have equal points:
1. **Head-to-head record** (if played each other)
2. **Goal/set difference** (sets won - sets lost)
3. **Goals/points scored** (total sets won)
4. **Random draw** (if still tied)

---

## Seeding

### Standard Seeding

**Purpose**: Ensure strongest teams don't meet until later rounds

**Pattern** (for powers of 2):
```
Slot 1 → Seed 1
Slot 2 → Seed n
Slot 3 → Seed n/2
Slot 4 → Seed n/2 + 1
...

8-team bracket:
1 vs 8
4 vs 5
2 vs 7
3 vs 6
```

### Seeding Algorithm

```typescript
function generateSeeding(numSlots: number): number[] {
  const seeds = [1]

  for (let i = 1; i < Math.log2(numSlots) + 1; i++) {
    const newSeeds = []
    const maxSeed = Math.pow(2, i)

    for (const seed of seeds) {
      newSeeds.push(seed)
      newSeeds.push(maxSeed + 1 - seed)
    }

    seeds = newSeeds
  }

  return seeds
}

// Result for 8 slots: [1, 8, 4, 5, 2, 7, 3, 6]
```

### Group Seeding

When distributing seeded teams into groups:

```typescript
// Serpentine distribution
// 16 teams into 4 groups:

Group A: Seeds 1, 8, 9, 16
Group B: Seeds 2, 7, 10, 15
Group C: Seeds 3, 6, 11, 14
Group D: Seeds 4, 5, 12, 13

Pattern: Snake through groups for each "tier" of seeds
```

---

## BYE Management

### BYE Calculation

```typescript
const bracketSize = nextPowerOf2(numParticipants)
const numByes = bracketSize - numParticipants
```

### BYE Distribution Strategies

**Strategy 1: Top-Heavy** (Default)
- Give BYEs to highest seeds
- Example: Seeds 1, 2, 3 get BYEs if 3 BYEs needed

**Strategy 2: Spread**
- Distribute BYEs evenly across bracket
- Maintains balance between top and bottom half

**Strategy 3: Alternating**
- Alternate BYEs between top and bottom
- Best for visual balance in bracket

### BYE in Database

```typescript
interface Match {
  registration1Id: string | null  // null = BYE in slot 1
  registration2Id: string | null  // null = BYE in slot 2
}

// BYE match is auto-won
if (registration1Id === null) {
  winnerId = registration2Id
  played = true
}
```

---

## Edge Cases & Special Scenarios

### 1. Odd Number of Teams
- Round robin: Use BYE rotation
- Elimination: Add BYEs to reach power of 2

### 2. Three Teams
```
Round Robin:
  A vs B
  A vs C
  B vs C

Winner: Most points (tie-breaking as needed)
```

### 3. Two Teams
```
Simple Finals:
  Best of N sets
  No bracket needed
```

### 4. Modified DE with Small Tournaments
```
8 teams, losersStartRoundsBeforeFinal = 1:
- Only 2 teams get second chance (from semifinals)
- Very limited losers bracket
```

---

## Testing Recommendations

### Unit Tests Should Cover

1. **Bracket Size Calculations**
   - Powers of 2 detection
   - BYE counting
   - Round counting

2. **Seeding Patterns**
   - Correct opponent matching
   - BYE distribution
   - Seed separation

3. **Match Linking**
   - Correct winnerTo references
   - Proper slot assignment
   - Losers bracket drops (DE)

4. **Edge Cases**
   - 2 teams
   - 3 teams
   - Odd numbers
   - Large brackets (64+)

5. **Third Place Match**
   - Correct loser routing
   - Proper final match references

---

## Performance Considerations

### Match Count Formulas

**Single Elimination**:
```
Total matches = n - 1 (where n = participants)
Example: 16 teams = 15 matches
With 3rd place: 16 matches
```

**Double Elimination**:
```
Total matches = 2n - 2 (minimum)
Total matches = 2n - 1 (with GFR)
Example: 16 teams = 30-31 matches
```

**Round Robin**:
```
Total matches per group = n(n-1)/2
Example: 4 teams per group = 6 matches
4 groups of 4 = 24 matches
```

---

## References

- Single Elimination: `src/lib/utils/single-elimination.ts`
- Double Elimination: `src/lib/utils/double-elimination.ts`
- Modified DE: `src/lib/utils/modified-double-elimination.ts`
- Round Robin: `src/lib/services/groups-service.ts`
- Tests: `src/lib/utils/__tests__/`
