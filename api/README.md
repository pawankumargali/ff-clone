# PnL Tracker Service

A lightweight **Profit & Loss (PnL) tracking service** for cryptocurrency trading that records trades, tracks portfolio positions, and calculates both realized and unrealized PnL using the **Average Cost method**.

⚠️ **Development Tool**: Uses in-memory storage. All data is lost on server restart.

---

## 📚 Table of Contents

- [🚀 Quick Start](#-quick-start) - Get running in 5 minutes
- [⚡ API Reference](#-api-reference) - Complete endpoint documentation
- [🏗️ Project Structure](#️-project-structure) - Codebase organization
- [🧮 How It Works](#-how-it-works) - Calculation logic
- [📊 Data Models](#-data-models) - Complete data structures
- [❌ Error Handling](#-error-handling) - Error responses and examples
- [⚙️ Configuration](#️-configuration) - Environment & scripts
- [📋 Assumptions](#-assumptions) - Important constraints and business rules
- [📖 Detailed Examples](#-detailed-examples) - Complete trading workflows

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- Yarn package manager

### Setup (3 steps)
```bash
# 1. Install dependencies
git clone https://github.com/pawankumargali/pnl-tracker.git && cd pnl-tracker
yarn install

# 2. Start the service
yarn start:dev

# 3. Verify it's running
curl http://localhost:8081/health
```

**Service URL**: `http://localhost:8081`

### Your First Trade
```bash
# Record a BTC purchase
curl -X POST http://localhost:8081/api/v1/trades \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "symbol": "BTC",
    "side": "BUY",
    "price": 65000,
    "quantity": 0.1,
    "timestamp": "2024-01-15T10:30:00Z"
  }'

# Check your position
curl http://localhost:8081/api/v1/positions/portfolio

# View PnL summary
curl http://localhost:8081/api/v1/positions/pnl
```

### Docker Quick Start
```bash
# Build the Docker image
docker build -t pnl-tracker .

# Run the container
docker run \
  -d \
  -p 8081:8081 \
  --name pnl-tracker-pod \
  pnl-tracker

# Verify it's running
curl http://localhost:8081/health

# View logs
docker logs pnl-tracker-pod

# Stop the container
docker stop pnl-tracker-pod

# Remove the container
docker rm pnl-tracker-pod
```

---

## ⚡ API Reference

### Quick Reference Table
| Method | Endpoint | Purpose | Authentication | Rate Limit |
|--------|----------|---------|----------------|------------|
| `GET` | `/health` | Service status | None | 30/min |
| `POST` | `/api/v1/trades` | Record trade | None | 30/min |
| `GET` | `/api/v1/trades` | List all trades | None | 30/min |
| `GET` | `/api/v1/positions/portfolio` | Current Holdings | None | 30/min |
| `GET` | `/api/v1/positions/pnl` | PnL summary with market prices | None | 30/min |

### Rate Limiting
- **Limit**: 30 requests per minute (configurable via `RATE_LIMIT_RPM`)
- **Window**: 60 seconds (1 minute)
- **Exceeded Response**: `429 Too Many Requests` (plain text, not JSON)

### Trade Recording

#### POST `/api/v1/trades`
Records a new trade and updates position calculations.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body Structure:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | number | ✅ | Positive integer | User-defined trade identifier |
| `symbol` | string | ✅ | Must be supported symbol | Cryptocurrency symbol (BTC, ETH, etc.) |
| `side` | string | ✅ | "BUY" or "SELL" | Trade direction |
| `price` | number | ✅ | Positive number | Trade execution price in USD |
| `quantity` | number | ✅ | Positive number | Asset quantity to trade |
| `fee` | number | ❌ | ≥ 0 when provided | Trading fee in USD (defaults to 0) |
| `timestamp` | string | ✅ | ISO 8601 datetime | Trade execution timestamp |

**Example Request:**
```bash
curl -X POST http://localhost:8081/api/v1/trades \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "symbol": "BTC",
    "side": "BUY",
    "price": 65000.50,
    "quantity": 0.1,
    "fee": 10.50,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

**Success Response (201 Created):**
```json
{
  "message": "Trade recorded successfully",
  "data": null
}
```

#### GET `/api/v1/trades`
Retrieves all recorded trades in chronological order.

**Request Headers:** None required

**Success Response (200 OK):**
```json
{
  "message": "Fetched Trades successfully",
  "data": [
    {
      "id": 1,
      "refId": "TRADE_ABC123XY",
      "symbol": "BTC",
      "side": "BUY",
      "price": "65000.50000000",
      "currency": "USD",
      "quantity": "0.10000000",
      "fee": "10.50000000",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Portfolio Positions

#### GET `/api/v1/positions/portfolio`
Retrieves current portfolio positions with average cost calculations.

**Request Headers:** None required

**Success Response (200 OK):**
```json
{
  "message": "Fetched positions successfully",
  "data": [
    {
      "symbol": "BTC",
      "quantity": "0.10000000",
      "averagePrice": "65105.50000000",
      "totalCost": "6510.55000000",
      "realizedPnL": "0.00000000",
      "currency": "USD",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### GET `/api/v1/positions/pnl`
Retrieves comprehensive PnL summary with unrealized gains based on current market prices.

**Request Headers:** None required

**Success Response (200 OK):**
```json
{
  "message": "Fetched PnL summary successfully",
  "data": {
    "realizedPnL": "1500.00000000",
    "unrealizedPnL": "5289.45000000",
    "currency": "USD",
    "positions": [
      {
        "symbol": "BTC",
        "quantity": "0.10000000",
        "averagePrice": "65105.50000000",
        "totalCost": "6510.55000000",
        "realizedPnL": "0.00000000",
        "currency": "USD",
        "currentPrice": "118000.00000000",
        "unrealizedPnL": "5289.45000000",
        "unrealizedPnLPercentage": "81.24",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "updatedAt": "2024-01-15T12:45:30.000Z"
  }
}
```

---

## 🏗️ Project Structure

```
pnl-tracker/
├── src/
│   ├── app.ts                    # Main application entry point
│   ├── controllers/              # Request handlers
│   │   ├── trade.controller.ts   # Trade endpoint handlers
│   │   └── position.controller.ts # Position endpoint handlers
│   ├── services/                 # Business logic
│   │   ├── trade.service.ts      # Trade recording logic
│   │   ├── position.service.ts   # PnL calculations (Average Cost)
│   │   ├── market.service.ts     # Market price data (hardcoded)
│   │   └── cache.service.ts      # NodeCache wrapper
│   ├── routes/                   # Express route definitions
│   │   ├── index.router.ts       # Main router setup
│   │   ├── trade.router.ts       # /api/v1/trades routes
│   │   └── position.router.ts    # /api/v1/positions routes
│   ├── middleware/               # Express middleware
│   │   ├── error.middleware.ts   # Global error handling
│   │   └── validators/
│   │       └── record.trade.validator.ts # Trade input validation
│   └── utils/                    # Helper utilities
│       ├── constants.util.ts     # Application constants
│       └── string.util.ts        # String manipulation helpers
├── config.ts                     # Environment configuration
├── index.d.ts                    # TypeScript type definitions
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── Dockerfile                    # Container configuration
└── README.md                     # This documentation
```

### Key Architecture Patterns

**🏛️ Layered Architecture:**
```
Routes → Controllers → Services → Data Layer (Cache)
```

**📊 Data Flow:**
```
HTTP Request → Validation → Business Logic → Cache Update → Response
```

**🔧 Core Technologies:**
- **Framework**: Express.js with TypeScript
- **Storage**: NodeCache (in-memory, 1-week TTL)
- **Precision**: Decimal.js for financial calculations
- **Validation**: Zod schemas
- **Security**: Helmet + CORS + Rate limiting

---

## 🧮 How It Works

### Average Cost Method
Position tracking uses weighted average cost including fees:

```
New Average Price = (Previous Total Cost + Trade Cost + Fee) / Total Quantity
Trade Cost = (Price × Quantity) + Fee
```

**Example:**
- Buy 0.1 BTC @ $65,000 + $10.50 fee → Avg: $65,105.50
- Buy 0.05 BTC @ $67,000 + $5.25 fee → Avg: $65,772.00

### PnL Calculations

**Realized PnL** (completed trades):
```
Realized PnL = (Sale Price × Quantity - Sale Fee) - (Average Cost × Quantity)
```

**Unrealized PnL** (current holdings):
```
Unrealized PnL = (Current Market Price × Quantity) - Total Cost Basis
Unrealized PnL % = (Unrealized PnL ÷ Total Cost Basis) × 100
```

### Supported Assets
The service supports the following cryptocurrency symbols with hardcoded market prices:

| Symbol | Asset Name | Mark Price (USD) |
|--------|------------|-------------|
| BTC | Bitcoin | $118,000.00 |
| ETH | Ethereum | $4,500.00 |
| BNB | Binance Coin | $1,000.00 |
| SOL | Solana | $200.00 |
| XRP | Ripple | $3.00 |
| ADA | Cardano | $1.00 |
| POL | Polygon | $0.25 |
| BASE | Base | $0.05 |

**Unsupported Asset Behavior:**
- Recording trades with unsupported symbols returns a 400 error
- Error message lists all supported symbols
- PnL calculations will fail for unsupported assets

*Note: These are hardcoded prices for development/testing purposes, not real-time market data.*

---

## 📊 Data Models

### TradeHistory
Represents a single trade transaction with all relevant details.

| Field | Type | Description | Example | Constraints |
|-------|------|-------------|---------|-------------|
| `id` | number | User-provided trade identifier | `1` | Positive integer |
| `refId` | string | System-generated reference | `"TRADE_ABC123XY"` | Auto-generated, unique |
| `symbol` | string | Cryptocurrency symbol | `"BTC"` | Uppercase, 3+ chars |
| `side` | string | Trade direction | `"BUY"` or `"SELL"` | Enum values only |
| `price` | string | Execution price in USD | `"65000.50000000"` | 8 decimal precision |
| `currency` | string | Base currency | `"USD"` | Always USD |
| `quantity` | string | Trade quantity | `"0.10000000"` | 8 decimal precision |
| `fee` | string | Trading fee in USD | `"10.50000000"` | 8 decimal precision, ≥ 0 |
| `timestamp` | string | Trade execution time | `"2024-01-15T10:30:00.000Z"` | ISO 8601 UTC |
| `createdAt` | string | Record creation time | `"2024-01-15T10:30:00.000Z"` | ISO 8601 UTC |
| `updatedAt` | string | Record last update | `"2024-01-15T10:30:00.000Z"` | ISO 8601 UTC |

### Position
Represents current holdings for a specific cryptocurrency symbol.

| Field | Type | Description | Example | Calculation |
|-------|------|-------------|---------|-------------|
| `symbol` | string | Cryptocurrency symbol | `"BTC"` | From trades |
| `quantity` | string | Current holding quantity | `"0.10000000"` | Sum of BUY - SELL quantities |
| `averagePrice` | string | Weighted average cost | `"65105.50000000"` | Total cost ÷ Total quantity |
| `totalCost` | string | Total cost basis | `"6510.55000000"` | Average price × Quantity |
| `realizedPnL` | string | Cumulative realized P&L | `"150.00000000"` | Sum of all sale profits/losses |
| `currency` | string | Base currency | `"USD"` | Always USD |
| `createdAt` | string | Position creation time | `"2024-01-15T10:30:00.000Z"` | First trade timestamp |
| `updatedAt` | string | Position last update | `"2024-01-15T10:30:00.000Z"` | Last trade timestamp |

### PnLSummary
Comprehensive profit and loss summary across all positions.

| Field | Type | Description | Example | Calculation |
|-------|------|-------------|---------|-------------|
| `realizedPnL` | string | Total realized P&L | `"1500.00000000"` | Sum of all position realized PnL |
| `unrealizedPnL` | string | Total unrealized P&L | `"5289.45000000"` | Sum of all position unrealized PnL |
| `currency` | string | Base currency | `"USD"` | Always USD |
| `positions` | array | Array of positions with unrealized PnL | See PositionWithUnrealizedPnL | All current positions |
| `updatedAt` | string | Summary generation time | `"2024-01-15T12:45:30.000Z"` | Current timestamp |

### PositionWithUnrealizedPnL
Extends Position with current market data and unrealized PnL calculations.

| Field | Type | Description | Example | Calculation |
|-------|------|-------------|---------|-------------|
| *(All Position fields)* | | Inherits all Position fields | | |
| `currentPrice` | string | Current market price | `"118000.00000000"` | From market service |
| `unrealizedPnL` | string | Unrealized profit/loss | `"5289.45000000"` | (Current price × Quantity) - Total cost |
| `unrealizedPnLPercentage` | string | Unrealized P&L percentage | `"81.24"` | (Unrealized PnL ÷ Total cost) × 100 |

---

## ❌ Error Handling

### Error Response Structure
All API errors return a consistent JSON structure with appropriate HTTP status codes.

```json
{
  "error": "ErrorType",
  "message": "Detailed error description"
}
```

### Error Types and Examples

#### Validation Errors (400 Bad Request)
Occur when request data fails expected input schema validation checks.

**Missing Required Field:**
```json
{
  "error": "InvalidInputError",
  "message": "Invalid input: expected number, received undefined for field `price`"
}
```

**Invalid Data Type:**
```json
{
  "error": "InvalidInputError",
  "message": "Invalid input: expected number, received string for field `price`"
}
```

**Negative Price:**
```json
{
  "error": "InvalidInputError",
  "message": "Too small: expected number to be >0 for field `price`"
}
```

**Negative Fee:**
```json
{
  "error": "InvalidInputError",
  "message": "Fee cannot be negative for field `fee`"
}
```

**Invalid Symbol Length:**
```json
{
  "error": "InvalidInputError",
  "message": "Too small: expected string to have >=3 characters for field `symbol`"
}
```

**Invalid Enum Value:**
```json
{
  "error": "InvalidInputError",
  "message": "Invalid option: expected one of \"BUY\"|\"SELL\" for field `side`"
}
```

**Invalid Date Format:**
```json
{
  "error": "InvalidInputError",
  "message": "Invalid input: expected date, received Date for field `timestamp`"
}
```

*Note: This error message indicates a validation bug where the error message incorrectly reports receiving a "Date" when it should report receiving an invalid date string. A valid date string is in ISO 8601 format - "2025-08-18T03:45:36.876Z"*

#### Business Logic Errors (400 Bad Request)
Occur when business rules are violated.

**Unsupported Symbol:**
```json
{
  "error": "APIError",
  "message": "Invalid symbol. Supported symbols are BTC, ETH, BNB, SOL, XRP, ADA, POL, BASE"
}
```

**Selling Without Position:**
```json
{
  "error": "APIError",
  "message": "Cannot sell BTC: No existing position found"
}
```

**Selling From Empty Position:**
```json
{
  "error": "APIError",
  "message": "Cannot sell BTC: Position is empty"
}
```

**Insufficient Quantity:**
```json
{
  "error": "APIError",
  "message": "Cannot sell 0.20000000 BTC: Only 0.1 available"
}
```

**No Symbols Provided to Market Service:**
```json
{
  "error": "APIError",
  "message": "No symbols provided"
}
```

#### Market Data Errors (404 Not Found)
Occur when market price data is unavailable.

**Price Fetch Failed:**
```json
{
  "error": "APIError",
  "message": "Unable to fetch price for symbol"
}
```

**Page Not Found:**
```json
{
  "error": "APIError",
  "message": "Page Not Found"
}
```

#### Rate Limiting (429 Too Many Requests)
Returns plain text when rate limit is exceeded.

**Rate Limit Response:**
```
Too many requests, please try again later.
```

**Rate Limiting Details:**
- **Window**: 1 minute (60,000 ms)
- **Limit**: 30 requests per minute (configurable via `RATE_LIMIT_RPM`)
- **Headers**: Includes standard rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- **Response Type**: Plain text (not JSON)

#### Server Errors (500 Internal Server Error)
Occur during unexpected server failures.

**Generic Internal Server Error:**
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

**Error Serialization Failure:**
```json
{
  "error": "InternalServerError",
  "message": ""
}
```

### HTTP Status Code Summary
| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | InvalidInputError | Validation failures (input schema violations) |
| 400 | APIError | Business logic violations |
| 404 | APIError | Resource not found or market data unavailable |
| 429 | Rate Limit | Too many requests (plain text response) |
| 500 | InternalServerError | Unexpected server errors |

### Common Error Scenarios

#### Trade Recording Errors
1. **Missing required fields** → 400 InvalidInputError
2. **Invalid data types** → 400 InvalidInputError
3. **Negative values for price/quantity** → 400 InvalidInputError
4. **Negative fee** → 400 InvalidInputError
5. **Short symbol (< 3 chars)** → 400 InvalidInputError
6. **Invalid side value** → 400 InvalidInputError
7. **Unsupported cryptocurrency** → 400 APIError
8. **Selling without position** → 400 APIError
9. **Insufficient quantity for sale** → 400 APIError

#### Position/PnL Retrieval Errors
1. **Market price unavailable** → 404 APIError
2. **Internal calculation errors** → 500 InternalServerError

#### Rate Limiting
1. **Exceeding 30 requests/minute** → 429 Too Many Requests (plain text)

---

## ⚙️ Configuration

### Environment Variables
```bash
PORT=8081                    # Server port (default: 8081)
RATE_LIMIT_RPM=30           # Rate limit per minute (default: 30)
```

### Available Scripts
```bash
yarn start:dev              # Development mode with auto-reload
yarn build                  # Build TypeScript to JavaScript
yarn start                  # Production mode (builds first)
```

### Cache Configuration
- **Storage**: NodeCache (in-memory)
- **Default TTL**: 60 seconds (for general cache items)
- **Trade Data TTL**: 1 week (604,800 seconds) - overrides default for persistent data
- **Precision**: 8 decimal places for all financial values
- **Keys**:
  - `trade_history` - All recorded trades (1 week TTL)
  - `user_positions` - Current portfolio positions (1 week TTL)
  - `portfolio_realized_pnl` - Cumulative realized P&L (1 week TTL)

**Note**: Trade-related data uses extended TTL to persist across sessions, while the cache service default TTL (60 seconds) is used for temporary data.

---

## 📋 Assumptions

### Technical Constraints
- **Single User**: No authentication or multi-user support required
- **In-Memory Storage**: All data stored in NodeCache with 1-week TTL
- **Data Persistence**: All data is lost when server restarts
- **Currency**: USD only - all calculations use USD as base currency
- **Precision**: 8 decimal places for all financial values using Decimal.js

### Business Logic Rules
- **Trading Type**: SPOT trading only - no futures, options, or derivatives
- **Short Selling**: Not allowed - must buy before selling
- **Cost Basis**: Average Cost method - cannot change calculation method
- **Market Prices**: Static hardcoded prices - no real-time feeds
- **Trade Order**: Should be recorded in chronological order for accurate PnL
- **Position Updates**: Automatic position recalculation after each trade

### Operational Limitations
- **Session-Based**: Data persists only during service uptime
- **Backup**: No automatic data export or backup functionality
- **Environment**: Designed for development and testing use cases

---

## 📖 Detailed Examples

### Complete Trading Session
This example demonstrates a full trading workflow with position tracking and PnL calculations.

#### Step 1: Initial BTC Purchase
```bash
# Buy 0.1 BTC at $65,000 with $10.50 fee
curl -X POST http://localhost:8081/api/v1/trades \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "symbol": "BTC",
    "side": "BUY",
    "price": 65000,
    "quantity": 0.1,
    "fee": 10.50,
    "timestamp": "2024-01-15T09:30:00Z"
  }'

# Response: {"message": "Trade recorded successfully", "data": null}
```

#### Step 2: Check Portfolio Position
```bash
curl http://localhost:8081/api/v1/positions/portfolio
```

**Position Response:**
```json
{
  "message": "Fetched positions successfully",
  "data": [
    {
      "symbol": "BTC",
      "quantity": "0.10000000",
      "averagePrice": "65105.00000000",  // (65000 * 0.1 + 10.50) / 0.1
      "totalCost": "6510.50000000",     // 65105.00 * 0.1
      "realizedPnL": "0.00000000",      // No sales yet
      "currency": "USD",
      "createdAt": "2024-01-15T09:30:00.000Z",
      "updatedAt": "2024-01-15T09:30:00.000Z"
    }
  ]
}
```

#### Step 3: Check Current PnL
```bash
curl http://localhost:8081/api/v1/positions/pnl
```

**PnL Response:**
```json
{
  "message": "Fetched PnL summary successfully",
  "data": {
    "realizedPnL": "0.00000000",
    "unrealizedPnL": "5289.50000000",    // (118000 * 0.1) - 6510.50
    "currency": "USD",
    "positions": [
      {
        "symbol": "BTC",
        "quantity": "0.10000000",
        "averagePrice": "65105.00000000",
        "totalCost": "6510.50000000",
        "realizedPnL": "0.00000000",
        "currency": "USD",
        "currentPrice": "118000.00000000",  // Current market price
        "unrealizedPnL": "5289.50000000",
        "unrealizedPnLPercentage": "81.25", // 5289.50 / 6510.50 * 100
        "createdAt": "2024-01-15T09:30:00.000Z",
        "updatedAt": "2024-01-15T09:30:00.000Z"
      }
    ],
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Step 4: Additional BTC Purchase
```bash
# Buy another 0.05 BTC at $67,000 with $5.25 fee
curl -X POST http://localhost:8081/api/v1/trades \
  -H "Content-Type: application/json" \
  -d '{
    "id": 2,
    "symbol": "BTC",
    "side": "BUY",
    "price": 67000,
    "quantity": 0.05,
    "fee": 5.25,
    "timestamp": "2024-01-15T11:00:00Z"
  }'
```

#### Step 5: Updated Position After Second Purchase
```bash
curl http://localhost:8081/api/v1/positions/portfolio
```

**Updated Position:**
```json
{
  "message": "Fetched positions successfully",
  "data": [
    {
      "symbol": "BTC",
      "quantity": "0.15000000",           // 0.1 + 0.05
      "averagePrice": "65771.67000000",   // (6510.50 + 3355.25) / 0.15
      "totalCost": "9865.75000000",       // 65771.67 * 0.15
      "realizedPnL": "0.00000000",
      "currency": "USD",
      "createdAt": "2024-01-15T09:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

#### Step 6: Partial Sale
```bash
# Sell 0.08 BTC at $70,000 with $8.75 fee
curl -X POST http://localhost:8081/api/v1/trades \
  -H "Content-Type: application/json" \
  -d '{
    "id": 3,
    "symbol": "BTC",
    "side": "SELL",
    "price": 70000,
    "quantity": 0.08,
    "fee": 8.75,
    "timestamp": "2024-01-15T15:20:00Z"
  }'
```

#### Step 7: Final Position and PnL
```bash
# Check final position
curl http://localhost:8081/api/v1/positions/portfolio

# Check final PnL summary
curl http://localhost:8081/api/v1/positions/pnl
```

**Final Position:**
- Remaining quantity: 0.07 BTC (0.15 - 0.08)
- Average price: $65,771.67 (unchanged)
- Realized PnL: $329.52 ((70000 * 0.08 - 8.75) - (65771.67 * 0.08))
- Unrealized PnL: Based on remaining 0.07 BTC at current market price

---

## 📝 License & Author

**License**: MIT - see [LICENSE](LICENSE) file
**Author**: pawankumargali
