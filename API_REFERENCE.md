# API Reference - Auctioneer Authentication System

## Base URL
```
http://localhost:4000/api/auctioneers
```

## Endpoints

### 1. Login
**Endpoint:** `POST /login`

**Description:** Authenticate an auctioneer and retrieve their franchise data.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "sport": "string (required - one of: football, basketball, cricket, baseball, volleyball)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "auctioneer": {
    "id": "string",
    "username": "string",
    "email": "string",
    "name": "string",
    "phone": "string",
    "sport": "string",
    "franchiseId": "string",
    "profilePicture": "string"
  },
  "franchise": {
    "id": "string",
    "name": "string",
    "auctioneerId": "string",
    "sport": "string",
    "city": "string",
    "stadium": "string",
    "totalPurse": number,
    "purseRemaining": number,
    "playerCount": number,
    "wins": number,
    "losses": number
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid username/email or password"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Sport is required"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:4000/api/auctioneers/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "james_mitchell",
    "password": "password123",
    "sport": "football"
  }'
```

---

### 2. Get Auctioneer Details
**Endpoint:** `GET /details`

**Description:** Retrieve detailed information about a specific auctioneer.

**Query Parameters:**
- `auctioneerId` (required) - The ID of the auctioneer
- `sport` (required) - The sport category

**Success Response (200 OK):**
```json
{
  "success": true,
  "auctioneer": {
    "id": "string",
    "username": "string",
    "email": "string",
    "name": "string",
    "phone": "string",
    "sport": "string",
    "franchiseId": "string",
    "profilePicture": "string",
    "createdAt": "string",
    "active": boolean
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Auctioneer not found"
}
```

**Example cURL:**
```bash
curl -X GET "http://localhost:4000/api/auctioneers/details?auctioneerId=fb_a1&sport=football"
```

---

### 3. Create Franchise
**Endpoint:** `POST /franchise/create`

**Description:** Create a new franchise for an auctioneer. Prevents duplicate franchises.

**Request Body:**
```json
{
  "auctioneerId": "string (required)",
  "sport": "string (required)",
  "name": "string (required)",
  "city": "string (optional)",
  "stadium": "string (optional)",
  "capacity": number (optional),
  "auctioneerName": "string (optional)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Franchise created successfully",
  "franchise": {
    "id": "string",
    "name": "string",
    "auctioneerId": "string",
    "sport": "string",
    "city": "string",
    "stadium": "string",
    "totalPurse": number,
    "purseRemaining": number,
    "playerCount": number,
    "wins": number,
    "losses": number
  }
}
```

**Error Response (400 Bad Request) - Already has franchise:**
```json
{
  "success": false,
  "message": "Auctioneer already has a franchise"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:4000/api/auctioneers/franchise/create \
  -H "Content-Type: application/json" \
  -d '{
    "auctioneerId": "fb_a1",
    "sport": "football",
    "name": "New Franchise",
    "city": "New York",
    "stadium": "New Stadium",
    "capacity": 70000,
    "auctioneerName": "James Mitchell"
  }'
```

---

### 4. Update Franchise
**Endpoint:** `PUT /franchise/update`

**Description:** Update an existing franchise's details.

**Request Body:**
```json
{
  "franchiseId": "string (required)",
  "auctioneerId": "string (required)",
  "sport": "string (required)",
  "name": "string (optional)",
  "city": "string (optional)",
  "stadium": "string (optional)",
  "totalPurse": number (optional),
  "purseRemaining": number (optional)",
  "wins": number (optional)",
  "losses": number (optional)",
  "playerCount": number (optional)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Franchise updated successfully",
  "franchise": {
    "id": "string",
    "name": "string",
    "auctioneerId": "string",
    "sport": "string",
    "city": "string",
    "stadium": "string",
    "totalPurse": number,
    "purseRemaining": number,
    "playerCount": number,
    "wins": number,
    "losses": number
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Franchise not found"
}
```

**Example cURL:**
```bash
curl -X PUT http://localhost:4000/api/auctioneers/franchise/update \
  -H "Content-Type: application/json" \
  -d '{
    "franchiseId": "fb_f1",
    "auctioneerId": "fb_a1",
    "sport": "football",
    "name": "Thunder Hawks Updated",
    "city": "New York",
    "wins": 16,
    "losses": 4
  }'
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or missing required fields |
| 401 | Unauthorized - Invalid credentials |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Common Errors

### "Sport is required"
- **Cause:** The `sport` parameter is missing
- **Solution:** Include a valid sport (football, basketball, cricket, baseball, volleyball)

### "Username or email is required"
- **Cause:** Neither username nor email was provided
- **Solution:** Provide at least one of username or email

### "Password is required"
- **Cause:** The `password` field is missing
- **Solution:** Include the password in the request

### "Invalid username/email or password"
- **Cause:** The credentials don't match
- **Solution:** Verify username/email and password are correct

### "Auctioneer already has a franchise"
- **Cause:** Trying to create a franchise when one already exists
- **Solution:** Use the update endpoint instead

### "Franchise not found"
- **Cause:** The franchiseId is invalid or doesn't exist
- **Solution:** Verify the franchiseId is correct

---

## Testing with Postman

1. **Import the requests** using the examples above
2. **Set the following variables:**
   - Base URL: `http://localhost:4000/api/auctioneers`
3. **Test the login endpoint first**
4. **Use the returned franchiseId and auctioneerId for subsequent requests**

---

## Integration with Frontend

The frontend (`AuthContext.tsx`) handles API calls automatically:

```typescript
// Login
await login(username, password, 'auctioneer', sport);

// Result in context
const { user, franchise } = useAuth();
// user = auctioneer object
// franchise = franchise object or null

// Update franchise
const response = await fetch('http://localhost:4000/api/auctioneers/franchise/update', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    franchiseId: franchise.id,
    auctioneerId: user.id,
    sport: user.sport,
    ...updatedData
  })
});
```

---

## Notes

- All timestamps are in ISO 8601 format
- Currency is in Indian Rupees (₹)
- Sport values are case-sensitive: must be lowercase
- Auctioneer can only access their own franchise
- Passwords are not returned in responses
- Profile pictures are placeholder URLs (can be replaced with real URLs)
---

# Live Auction API Reference

## Base URL
```
http://localhost:4000/api/live-auction
```

## Overview

The Live Auction API provides real-time auction management capabilities with strict role-based access control:

- **Auctioneer (MUTATION)**: Can start/pause/resume auction, confirm bids, mark sold/unsold
- **Admin/Player/Public (READ)**: Can only view current auction state and history

### Authorization Rules
- All mutation endpoints require `userRole: 'auctioneer'` and valid `auctioneerId`
- Only ONE live auction can exist at any time (global lock)
- Auctioneer is a neutral controller (NOT tied to any team)

---

## Auction States

| State | Description |
|-------|-------------|
| `IDLE` | No player being auctioned |
| `READY` | Player selected, waiting to start |
| `LIVE` | Bidding in progress |
| `PAUSED` | Bidding temporarily paused |
| `SOLD` | Player sold, finalizing |
| `COMPLETED` | Auction session completed |

---

## Bidding Rules

### Slab-based Increments
| Price Range | Increment |
|-------------|-----------|
| ≤ 10.0 Cr | 0.25 Cr |
| 10.0 - 20.0 Cr | 0.50 Cr |
| > 20.0 Cr | 1.0 Cr |

### Valid Bid Values
- ✅ 20.00, 20.50, 21.00
- ❌ 20.25, 20.75 (invalid at >10 Cr slab)

### Consecutive Bidding Rule
- Same team may bid **twice** consecutively
- Same team may **NOT** bid three times in a row
- System enforces this automatically

---

## READ Endpoints (All Users)

### GET /state
Get current live auction state.

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "live_1706000000000",
    "sport": "cricket",
    "name": "IPL 2026 Auction",
    "auctioneerId": "c_a1",
    "auctioneerName": "Rajesh Kumar",
    "teamIds": ["cr_f1", "cr_f2"],
    "playerPool": ["cr_p1", "cr_p2"],
    "completedPlayerIds": [],
    "status": "ACTIVE"
  },
  "ledger": {
    "auctionId": "live_1706000000000",
    "playerId": "cr_p1",
    "playerName": "Virat Kohli",
    "basePrice": 2.0,
    "currentBid": 5.25,
    "highestBidder": {
      "teamId": "cr_f1",
      "teamName": "Mumbai Mystics"
    },
    "bidHistory": [...],
    "state": "LIVE",
    "timerStartedAt": "2026-01-28T10:00:00Z",
    "timerDuration": 20
  },
  "teams": [...],
  "currentPlayer": {...},
  "hasActiveAuction": true
}
```

### GET /history/:playerId
Get bid history for a specific player.

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "playerId": "cr_p1",
      "playerName": "Virat Kohli",
      "status": "SOLD",
      "finalPrice": 10.5,
      "winningTeam": {
        "teamId": "cr_f1",
        "teamName": "Mumbai Mystics"
      },
      "bidHistory": [...]
    }
  ]
}
```

### GET /bid-info
Get next valid bid information.

**Response:**
```json
{
  "success": true,
  "hasActiveBidding": true,
  "info": {
    "currentBid": 5.25,
    "nextBid": 5.50,
    "increment": 0.25
  }
}
```

---

## MUTATION Endpoints (Auctioneer Only)

### POST /start
Start a new live auction session.

**Request:**
```json
{
  "userRole": "auctioneer",
  "auctioneerId": "c_a1",
  "auctionId": "live_1706000000000",
  "sport": "cricket",
  "name": "IPL 2026 Auction",
  "auctioneerName": "Rajesh Kumar",
  "teamIds": ["cr_f1", "cr_f2", "cr_f3"],
  "playerPool": ["cr_p1", "cr_p2", "cr_p3"],
  "timerDuration": 20
}
```

**Response:**
```json
{
  "success": true,
  "session": {...}
}
```

### POST /select-player
Select a player to auction.

**Request:**
```json
{
  "userRole": "auctioneer",
  "auctioneerId": "c_a1",
  "playerId": "cr_p1",
  "playerName": "Virat Kohli",
  "basePrice": 2.0
}
```

### POST /start-bidding
Start bidding for selected player.

**Request:**
```json
{
  "userRole": "auctioneer",
  "auctioneerId": "c_a1"
}
```

### POST /bid
Confirm a team's bid (system calculates next valid price).

**Request:**
```json
{
  "userRole": "auctioneer",
  "auctioneerId": "c_a1",
  "teamId": "cr_f1",
  "teamName": "Mumbai Mystics"
}
```

**Response:**
```json
{
  "success": true,
  "ledger": {...},
  "bidEntry": {
    "id": "bid_1706000001",
    "teamId": "cr_f1",
    "teamName": "Mumbai Mystics",
    "bidAmount": 2.25,
    "timestamp": "2026-01-28T10:00:01Z",
    "isJumpBid": false
  },
  "nextValidBid": 2.50
}
```

### POST /jump-bid
Submit a jump bid (custom amount).

**Request:**
```json
{
  "userRole": "auctioneer",
  "auctioneerId": "c_a1",
  "teamId": "cr_f2",
  "teamName": "Delhi Dragons",
  "jumpAmount": 5.0
}
```

### POST /pause
Pause bidding.

### POST /resume
Resume bidding.

### POST /sold
Mark current player as SOLD.

**Response:**
```json
{
  "success": true,
  "result": {
    "playerId": "cr_p1",
    "playerName": "Virat Kohli",
    "status": "SOLD",
    "finalPrice": 10.5,
    "winningTeam": {
      "teamId": "cr_f1",
      "teamName": "Mumbai Mystics"
    },
    "bidHistory": [...],
    "totalBids": 15
  }
}
```

### POST /unsold
Mark current player as UNSOLD.

### POST /end
End the entire auction session.

---

## Error Responses

```json
{
  "success": false,
  "error": "Only auctioneers can perform this action."
}
```

```json
{
  "success": false,
  "error": "Team cannot bid more than 2 times consecutively."
}
```

```json
{
  "success": false,
  "error": "Another live auction is already in progress."
}
```

---

## Temp Auction Ledger Structure

The ledger is the **SINGLE SOURCE OF TRUTH** during live auction:

```json
{
  "auctionId": "string",
  "sport": "string",
  "playerId": "string",
  "playerName": "string",
  "basePrice": "number (in Cr)",
  "currentBid": "number (in Cr)",
  "highestBidder": {
    "teamId": "string",
    "teamName": "string"
  } | null,
  "bidHistory": [
    {
      "id": "string",
      "teamId": "string",
      "teamName": "string",
      "bidAmount": "number",
      "timestamp": "ISO 8601",
      "isJumpBid": "boolean"
    }
  ],
  "lastBidTimestamp": "ISO 8601 | null",
  "consecutiveBidCount": {
    "teamId": "number (0-2)"
  },
  "state": "IDLE|READY|LIVE|PAUSED|SOLD|COMPLETED",
  "timerStartedAt": "ISO 8601 | null",
  "timerDuration": "number (seconds)",
  "bidSlabs": [
    { "maxPrice": 10.0, "increment": 0.25 },
    { "maxPrice": 20.0, "increment": 0.50 },
    { "maxPrice": Infinity, "increment": 1.0 }
  ]
}
```