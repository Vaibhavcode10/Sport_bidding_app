# Live Auction System - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Auction Lifecycle](#auction-lifecycle)
4. [Bidding Rules](#bidding-rules)
5. [Data Architecture](#data-architecture)
6. [API Reference](#api-reference)
7. [Frontend Components](#frontend-components)
8. [File Structure](#file-structure)
9. [How to Use](#how-to-use)
10. [Technical Details](#technical-details)

---

## System Overview

The Sports Auction/Bidding App is a full-stack web application for conducting live player auctions across multiple sports (Cricket, Football, Basketball, Baseball, Volleyball).

### Key Principles
- **Single Live Auction**: Only ONE auction can be live at any time (global lock)
- **Auctioneer Control**: Only the auctioneer can mutate auction state
- **Real-time Updates**: 1-second polling for live state synchronization
- **Crash Recovery**: In-memory state with periodic JSON snapshots
- **Clean Separation**: Teams don't log in; Auctioneer is neutral

### Tech Stack
```
Frontend: React 18 + TypeScript + Vite + Tailwind CSS
Backend:  Node.js + Express.js
Storage:  JSON files (no database)
State:    React Context API
```

---

## User Roles & Permissions

### 1. ADMIN
The system administrator who sets up auctions.

| Permission | Description |
|------------|-------------|
| ✅ Create auctions | Configure auction per sport |
| ✅ Select players for pool | Choose which players to auction |
| ✅ Configure bid slabs | Set increment rules |
| ✅ Assign auctioneer | Pick ONE auctioneer per auction |
| ✅ View live auction | Read-only spectator mode |
| ❌ Cannot bid | No bidding capability |
| ❌ Cannot click SOLD | No auction control |
| ❌ Cannot modify live auction | Locked once started |

**Dashboard**: `/dashboard`
**Live Viewer**: `/dashboard/live`

---

### 2. AUCTIONEER (Critical Role)
The ONLY actor who controls the live auction. **Neutral controller - NOT a team representative.**

| Permission | Description |
|------------|-------------|
| ✅ Start auction | Begin the live session |
| ✅ Select player | Choose next player to auction |
| ✅ Confirm bids | Click team button to register bid |
| ✅ Enter jump bids | Input custom higher amounts |
| ✅ Pause/Resume | Temporarily halt bidding |
| ✅ Mark SOLD | Finalize player sale |
| ✅ Mark UNSOLD | No bids received |
| ✅ End session | Complete the auction |
| ❌ Cannot be tied to team | Must remain neutral |
| ❌ Cannot manually set price | System calculates |
| ❌ Cannot modify rules mid-auction | Locked at start |

**Dashboard**: `/auctioneer/dashboard`
**Live Control**: `/auctioneer/live`

---

### 3. PLAYER
Individual players registered in the system.

| Permission | Description |
|------------|-------------|
| ✅ Login/Register | Standard authentication |
| ✅ Edit profile | Update personal info |
| ✅ View auction status | See if being auctioned |
| ✅ View final result | See sale price/team |
| ✅ View bid history | Full read-only history |
| ❌ Cannot bid | Not a bidder |
| ❌ Cannot influence auction | Spectator only |

**Dashboard**: `/player/dashboard`
**Live Viewer**: `/player/dashboard/live`

---

### 4. TEAMS/FRANCHISES
**Teams NEVER log in.** They exist only as data entities.
The auctioneer acts on their behalf based on physical paddle raises.

---

## Auction Lifecycle

### State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                     AUCTION SESSION                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [No Session]                                               │
│        │                                                     │
│        ▼ (Auctioneer starts session)                        │
│   ┌─────────┐                                                │
│   │  IDLE   │ ◄─────────────────────────────────────┐       │
│   └────┬────┘                                        │       │
│        │ (Select player)                             │       │
│        ▼                                             │       │
│   ┌─────────┐                                        │       │
│   │  READY  │                                        │       │
│   └────┬────┘                                        │       │
│        │ (Start bidding)                             │       │
│        ▼                                             │       │
│   ┌─────────┐     ┌─────────┐                        │       │
│   │  LIVE   │◄───►│ PAUSED  │                        │       │
│   └────┬────┘     └─────────┘                        │       │
│        │                                             │       │
│        │ (SOLD or UNSOLD)                            │       │
│        ▼                                             │       │
│   ┌─────────┐                                        │       │
│   │  SOLD   │────────────────────────────────────────┘       │
│   └─────────┘     (Next player or end session)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### State Descriptions

| State | Description | Who Can Transition |
|-------|-------------|-------------------|
| **IDLE** | No player being auctioned | Auctioneer selects player |
| **READY** | Player selected, waiting | Auctioneer starts bidding |
| **LIVE** | Bidding in progress | Auctioneer confirms bids |
| **PAUSED** | Temporarily halted | Auctioneer resumes |
| **SOLD** | Player sold to team | Auto-returns to IDLE |
| **COMPLETED** | Session ended | N/A |

---

## Bidding Rules

### Slab-Based Increments

Bid increments vary based on current price:

| Price Range | Increment | Example Valid Bids |
|-------------|-----------|-------------------|
| ₹0 - ₹10 Cr | ₹0.25 Cr | 2.00, 2.25, 2.50, 2.75, 3.00 |
| ₹10 - ₹20 Cr | ₹0.50 Cr | 10.50, 11.00, 11.50, 12.00 |
| ₹20+ Cr | ₹1.0 Cr | 20.00, 21.00, 22.00, 23.00 |

### Clean Value Enforcement

```
✅ VALID:   20.00, 20.50, 21.00
❌ INVALID: 20.25, 20.75 (not aligned with 0.50 increment at >10 Cr)
```

### Jump Bids

- Entered ONLY by auctioneer
- Must be > current bid
- Must align with slab increment
- Becomes the new current bid
- Next regular bid follows slab rules

**Example:**
```
Current bid: ₹5.00 Cr
Jump bid: ₹8.00 Cr ✅ (valid, aligns with 0.25 Cr increment)
Jump bid: ₹8.10 Cr ❌ (invalid, doesn't align)
Next regular bid: ₹8.25 Cr
```

### Consecutive Bidding Rule

```
✅ Team A bids → Team A bids again (2 consecutive = OK)
❌ Team A bids → Team A bids → Team A bids (3 consecutive = BLOCKED)
```

The system automatically tracks and enforces this rule.

### Auction End Conditions

An auction ends when:
1. **20-second timer expires** with no new bids, OR
2. **Auctioneer clicks SOLD**

Rules:
- SOLD action immediately finalizes
- No undo after SOLD
- Player marked as SOLD/UNSOLD in database
- Team purse updated automatically

---

## Data Architecture

### Temp Auction Ledger (Core)

The ledger is the **SINGLE SOURCE OF TRUTH** during live auction:

```typescript
interface TempAuctionLedger {
  auctionId: string;
  sport: string;
  playerId: string;
  playerName: string;
  basePrice: number;          // Starting price
  currentBid: number;         // Current highest bid
  highestBidder: {
    teamId: string;
    teamName: string;
  } | null;
  bidHistory: BidEntry[];     // Complete bid trail
  lastBidTimestamp: string | null;
  consecutiveBidCount: {      // teamId -> count (0-2)
    [teamId: string]: number;
  };
  state: LiveAuctionState;    // IDLE|READY|LIVE|PAUSED|SOLD
  timerStartedAt: string | null;
  timerDuration: number;      // Default: 20 seconds
  bidSlabs: BidSlab[];        // Configurable slabs
  createdAt: string;
  updatedAt: string;
}
```

### Bid Entry

```typescript
interface BidEntry {
  id: string;
  teamId: string;
  teamName: string;
  bidAmount: number;
  timestamp: string;          // ISO 8601
  isJumpBid: boolean;
}
```

### Live Auction Session

```typescript
interface LiveAuctionSession {
  id: string;
  sport: string;
  name: string;
  auctioneerId: string;
  auctioneerName: string;
  teamIds: string[];          // Participating teams
  playerPool: string[];       // Players to auction
  completedPlayerIds: string[]; // Already auctioned
  currentLedger: TempAuctionLedger | null;
  bidSlabs: BidSlab[];
  timerDuration: number;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}
```

### Persistence Strategy

```
DURING LIVE AUCTION:
├── In-memory state (fast access)
├── Periodic JSON snapshot (crash recovery)
└── File: data/live-auction-session.json

ON SOLD/UNSOLD:
├── Permanent write to data/auction-history.json
├── Update data/{sport}/players.json (status, soldPrice, teamId)
└── Update data/{sport}/franchises.json (playerIds, purseRemaining)
```

---

## API Reference

### Base URL
```
http://localhost:4000/api/live-auction
```

### Read Endpoints (All Users)

#### GET /state
Get current live auction state.

```bash
curl http://localhost:4000/api/live-auction/state
```

**Response:**
```json
{
  "success": true,
  "session": { ... },
  "ledger": { ... },
  "teams": [ ... ],
  "currentPlayer": { ... },
  "hasActiveAuction": true
}
```

#### GET /history/:playerId
Get bid history for a player.

```bash
curl http://localhost:4000/api/live-auction/history/cr_p1
```

#### GET /bid-info
Get next valid bid information.

```bash
curl http://localhost:4000/api/live-auction/bid-info
```

---

### Mutation Endpoints (Auctioneer Only)

All mutation endpoints require:
```json
{
  "userRole": "auctioneer",
  "auctioneerId": "<auctioneer_id>"
}
```

#### POST /start
Start a new auction session.

```bash
curl -X POST http://localhost:4000/api/live-auction/start \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "auctioneer",
    "auctioneerId": "c_a1",
    "auctionId": "live_123",
    "sport": "cricket",
    "name": "IPL 2026 Auction",
    "auctioneerName": "Rajesh Kumar",
    "teamIds": ["cr_f1", "cr_f2"],
    "playerPool": ["cr_p1", "cr_p2", "cr_p3"]
  }'
```

#### POST /select-player
Select a player to auction.

```bash
curl -X POST http://localhost:4000/api/live-auction/select-player \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "auctioneer",
    "auctioneerId": "c_a1",
    "playerId": "cr_p1",
    "playerName": "Virat Kohli",
    "basePrice": 2.0
  }'
```

#### POST /start-bidding
Start the bidding timer.

```bash
curl -X POST http://localhost:4000/api/live-auction/start-bidding \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "auctioneer",
    "auctioneerId": "c_a1"
  }'
```

#### POST /bid
Confirm a team's bid (system calculates price).

```bash
curl -X POST http://localhost:4000/api/live-auction/bid \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "auctioneer",
    "auctioneerId": "c_a1",
    "teamId": "cr_f1",
    "teamName": "Mumbai Mystics"
  }'
```

#### POST /jump-bid
Submit a jump bid.

```bash
curl -X POST http://localhost:4000/api/live-auction/jump-bid \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "auctioneer",
    "auctioneerId": "c_a1",
    "teamId": "cr_f2",
    "teamName": "Delhi Dragons",
    "jumpAmount": 5.0
  }'
```

#### POST /pause
Pause bidding.

#### POST /resume
Resume bidding.

#### POST /sold
Mark player as SOLD.

#### POST /unsold
Mark player as UNSOLD.

#### POST /end
End the auction session.

---

## Frontend Components

### Context Provider

**File:** `context/LiveAuctionContext.tsx`

Provides global auction state to all components:

```tsx
import { useLiveAuction } from './context/LiveAuctionContext';

const MyComponent = () => {
  const {
    // State
    session,           // Current session
    ledger,            // Current player ledger
    teams,             // Participating teams
    currentPlayer,     // Player being auctioned
    hasActiveAuction,  // Is auction live?
    timeRemaining,     // Countdown timer
    
    // Computed
    nextValidBid,      // Auto-calculated next bid
    canTeamBid,        // Check consecutive rule
    
    // Actions (Auctioneer only)
    startSession,
    selectPlayer,
    startBidding,
    confirmBid,
    submitJumpBid,
    pauseBidding,
    resumeBidding,
    markSold,
    markUnsold,
    endSession,
    
    // Read actions
    refreshState,
    getPlayerHistory
  } = useLiveAuction();
};
```

### Auctioneer Live Dashboard

**File:** `pages/dashboard/AuctioneerLiveDashboard.tsx`
**Route:** `/auctioneer/live`

Features:
- Session setup (select teams & players)
- Player selection panel
- Team bid buttons with consecutive count indicator
- Jump bid input
- Current bid display with timer
- Pause/Resume controls
- SOLD/UNSOLD buttons
- Real-time bid history

### Live Auction Viewer

**File:** `pages/dashboard/LiveAuctionViewer.tsx`
**Routes:** `/live-auction`, `/dashboard/live`, `/player/dashboard/live`

Features:
- Read-only view of live auction
- Current player display
- Real-time bid updates
- Timer countdown
- Bid history
- Team standings
- Auction progress tracker

---

## File Structure

```
Sport_bidding_app/
├── server/
│   ├── index.js                    # Express server setup
│   ├── fileStore.js                # JSON file utilities
│   ├── liveAuctionEngine.js        # Core auction logic ⭐
│   └── routes/
│       ├── liveAuction.js          # Live auction API ⭐
│       ├── auctions.js             # Auction management
│       ├── auctioneers.js          # Auctioneer auth
│       ├── players.js              # Player CRUD
│       ├── teams.js                # Team CRUD
│       └── auth.js                 # Authentication
│
├── context/
│   ├── AuthContext.tsx             # User authentication
│   ├── BiddingRequestContext.tsx   # Bid requests
│   └── LiveAuctionContext.tsx      # Live auction state ⭐
│
├── pages/
│   └── dashboard/
│       ├── AuctioneerLiveDashboard.tsx  # Auctioneer control ⭐
│       ├── LiveAuctionViewer.tsx        # Viewer component ⭐
│       ├── AuctioneerDashboardLayout.tsx
│       ├── DashboardLayout.tsx
│       └── PlayerDashboardLayout.tsx
│
├── data/
│   ├── live-auction-session.json   # Crash recovery snapshot
│   ├── auction-history.json        # Completed auctions
│   ├── users.json                  # Admin/Player accounts
│   └── {sport}/
│       ├── players.json
│       ├── franchises.json
│       ├── auctioneers.json
│       └── auctions.json
│
├── types.ts                        # TypeScript interfaces ⭐
├── App.tsx                         # Route definitions
└── API_REFERENCE.md                # API documentation
```

---

## How to Use

### 1. Start the Application

```bash
# Terminal 1: Start backend
cd Sport_bidding_app
node server/index.js
# Output: Backend server running at http://localhost:4000
#         🎯 Live Auction Engine ready

# Terminal 2: Start frontend
npm run dev
# Output: VITE ready at http://localhost:3000
```

### 2. Login as Auctioneer

1. Go to `http://localhost:3000/login`
2. Select role: **Auctioneer**
3. Select sport: e.g., **Cricket**
4. Enter credentials:
   - Username: `rajesh_kumar`
   - Password: `password123`
5. Click Login

### 3. Start a Live Auction

1. Navigate to **Live Auction** in sidebar (or `/auctioneer/live`)
2. Click **Start New Auction**
3. Configure:
   - Auction Name: "IPL 2026 Mini Auction"
   - Select Teams: Check desired franchises
   - Select Players: Check players for pool
4. Click **Start Auction**

### 4. Conduct the Auction

1. **Select Player**: Click a player from the left panel
2. **Start Bidding**: Click the green START BIDDING button
3. **Accept Bids**: Click team buttons as they raise paddles
   - System auto-calculates next valid bid
   - Team buttons show consecutive bid count (1/2 or 2/2)
4. **Jump Bid**: Use jump bid section for custom amounts
5. **Pause/Resume**: Use PAUSE button to halt temporarily
6. **Finalize**: Click SOLD (if bids) or UNSOLD (no bids)
7. **Repeat**: Continue with next player

### 5. View as Spectator

- **Admin**: Go to `/dashboard/live`
- **Player**: Go to `/player/dashboard/live`
- **Public**: Go to `/live-auction`

All viewers see read-only real-time updates.

---

## Technical Details

### Polling vs WebSockets

Current implementation uses **1-second polling** for simplicity:

```tsx
// In LiveAuctionContext.tsx
useEffect(() => {
  const pollInterval = setInterval(refreshState, 1000);
  return () => clearInterval(pollInterval);
}, []);
```

For production, consider upgrading to WebSockets for true real-time.

### Timer Logic

The timer is managed client-side based on `timerStartedAt`:

```tsx
if (ledger.state === 'LIVE' && ledger.timerStartedAt) {
  const elapsed = (Date.now() - new Date(ledger.timerStartedAt).getTime()) / 1000;
  const remaining = Math.max(0, ledger.timerDuration - elapsed);
  setTimeRemaining(Math.ceil(remaining));
}
```

Timer resets on every new bid.

### Crash Recovery

On server restart:
```javascript
// In liveAuctionEngine.js
async initialize() {
  await loadPersistedSession();
  // Restores currentSession and currentLedger from JSON
}
```

### Authorization Pattern

All mutation endpoints validate:
```javascript
const requireAuctioneer = (req, res, next) => {
  if (req.body.userRole !== 'auctioneer') {
    return res.status(403).json({ 
      error: 'Only auctioneers can perform this action.' 
    });
  }
  // Verify auctioneerId matches session
  next();
};
```

### Bid Validation

```javascript
function isValidBidAmount(amount, slabs) {
  const increment = getIncrementForPrice(amount, slabs);
  const remainder = amount % increment;
  return remainder < 0.0001 || Math.abs(remainder - increment) < 0.0001;
}

function canTeamBid(teamId, ledger) {
  const consecutiveCount = ledger.consecutiveBidCount[teamId] || 0;
  return consecutiveCount < 2;
}
```

---

## Error Handling

Common error responses:

```json
{ "success": false, "error": "Only auctioneers can perform this action." }
{ "success": false, "error": "Another live auction is already in progress." }
{ "success": false, "error": "Team cannot bid more than 2 times consecutively." }
{ "success": false, "error": "Jump bid amount must align with slab increment." }
{ "success": false, "error": "No bids received. Use Mark Unsold instead." }
{ "success": false, "error": "Cannot end session while bidding is in progress." }
```

---

## Quick Reference Card

### Auctioneer Workflow
```
1. Start Session → Select Teams & Players
2. Select Player → Click player card
3. Start Bidding → Green button
4. Confirm Bids → Click team buttons
5. (Optional) Jump Bid → Enter amount
6. (Optional) Pause → Yellow button
7. Finalize → SOLD or UNSOLD
8. Repeat or End Session
```

### Bid Slabs
```
≤ 10 Cr  → +0.25 Cr
≤ 20 Cr  → +0.50 Cr
> 20 Cr  → +1.00 Cr
```

### State Flow
```
IDLE → READY → LIVE ↔ PAUSED → SOLD → IDLE
```

### Routes
```
/auctioneer/live     - Auctioneer control panel
/dashboard/live      - Admin viewer
/player/dashboard/live - Player viewer
/live-auction        - Public viewer
```

---

## Changelog

### v2.0.0 (January 2026)
- ✅ Complete live auction engine
- ✅ Slab-based bidding increments
- ✅ Consecutive bid rule enforcement
- ✅ Jump bid support
- ✅ Auctioneer role separation (neutral)
- ✅ Real-time viewer for all roles
- ✅ Crash recovery with JSON persistence
- ✅ Comprehensive API authorization

---

*Last updated: January 28, 2026*
