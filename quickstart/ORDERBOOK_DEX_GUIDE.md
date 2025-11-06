# Canton Order Book DEX - Implementation Guide

## Overview

This guide documents the implementation of a decentralized order book exchange (DEX) on the Canton Network, built on top of the Canton Quickstart. The DEX features:

- **On-ledger order matching** with atomic settlement
- **Token-based collateral** system
- **Buy and sell orders** with price-quantity matching
- **Real-time order book** display
- **Web-based trading interface**

## Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│  - Order Book Display                                │
│  - Place Order Form                                  │
│  - Wallet View                                       │
└──────────────────┬──────────────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────────────┐
│              Backend (Spring Boot)                   │
│  - OrderBookController                               │
│  - OrderBookService                                  │
│  - PQS Integration                                   │
└──────────────────┬──────────────────────────────────┘
                   │ gRPC Ledger API
┌──────────────────▼──────────────────────────────────┐
│            Canton Participant Node                   │
│  - DAML Smart Contracts                              │
│  - Participant Query Store (PQS)                     │
└──────────────────────────────────────────────────────┘
```

### DAML Contracts

Located in: `daml/order-book/OrderBook.daml`

#### 1. Token
Fungible token template with:
- **Fields**: issuer, owner, symbol, amount
- **Choices**: Transfer, Split, Merge

#### 2. Exchange
Exchange operator template with:
- **Choices**: CreateBuyOrder, CreateSellOrder

#### 3. BuyOrder / SellOrder
Order templates with:
- **Fields**: exchange, trader, baseSymbol, quoteSymbol, price, quantity, collateralCid
- **Choices**: CancelOrder, MatchWithSellOrder (BuyOrder only)

### Backend Service Layer

Located in: `backend/src/main/java/com/digitalasset/quickstart/orderbook/`

#### Models
- `TokenInfo`: Token representation for API
- `OrderInfo`: Order representation for API
- `PlaceOrderRequest`: Order placement request

#### Service
- `OrderBookService`: Core business logic
  - `getTokens()`: Query user's tokens via PQS
  - `getOrderBook()`: Query active orders for trading pair
  - `placeOrder()`: Submit order to ledger

#### Controller
- `OrderBookController`: REST API endpoints
  - `GET /api/orderbook/tokens`: Get user's tokens
  - `GET /api/orderbook/orders`: Get order book for pair
  - `POST /api/orderbook/orders`: Place new order

### Frontend Components

Located in: `frontend/src/`

#### Services
- `OrderBookClient`: API client for backend communication

#### Components
- `OrderBook`: Real-time order book display
- `PlaceOrderForm`: Order entry form
- `DexView`: Main trading interface

#### Routes
- `/dex`: DEX trading interface (added to existing app)

## Setup Instructions

### Prerequisites

1. **DAML SDK**: Version 3.3.0-snapshot.20250502.13767.0.v2fc6c7e2
2. **Java**: JDK 21
3. **Node.js**: v18+ with npm
4. **Docker**: For Canton deployment
5. **Make**: For build automation

### Installation Steps

#### 1. Install DAML SDK

```bash
cd quickstart
make install-daml-sdk
```

If this fails due to network issues, manually install DAML:

```bash
curl -sSL https://get.daml.com/ | sh -s 3.3.0-snapshot.20250502.13767.0.v2fc6c7e2
```

#### 2. Build DAML Contracts

```bash
# Build all DAML packages (includes order-book)
cd daml
daml build --all

# Verify order-book DAR was created
ls order-book/.daml/dist/order-book-0.0.1.dar
```

#### 3. Build Backend

```bash
# From quickstart directory
./gradlew build

# This will:
# - Compile DAML contracts
# - Generate Java bindings
# - Build Spring Boot backend
```

#### 4. Build Frontend

```bash
cd frontend
npm install
npm run build
```

## Running the DEX

### Option 1: Local Development (without Docker)

#### Start Backend
```bash
cd quickstart
make start-backend

# Or manually:
./gradlew :backend:bootRun
```

#### Start Frontend
```bash
cd frontend
npm run dev
# Access at http://localhost:5173
```

### Option 2: Full Stack with Docker

#### Start All Services
```bash
cd quickstart
make start

# This starts:
# - Canton domain and participant nodes
# - Backend service
# - Frontend (served via backend)
# - PQS (Participant Query Store)
```

#### Check Service Health
```bash
# Backend health
curl http://localhost:8080/api/orderbook/health

# Frontend
open http://localhost:3000/dex
```

## Initial Data Setup

### 1. Connect to Canton Console

```bash
cd quickstart
make canton-console
```

### 2. Create Exchange Contract

```scala
@ val exchange = participant1.parties.list().find(_.displayName == "app-provider").get

@ participant1.ledger_api.javaapi.commands.submit(Seq(exchange), {
  import com.daml.ledger.javaapi.data._
  Seq(new CreateCommand(
    new Identifier("order-book", "OrderBook", "Exchange"),
    new DamlRecord(
      new DamlRecord.Field("operator", exchange.toProtoPrimitive),
      new DamlRecord.Field("name", new Text("Canton DEX"))
    )
  ))
})
```

### 3. Mint Test Tokens

```scala
@ val alice = participant1.parties.list().find(_.displayName == "app-user").get

// Mint 10 BTC for Alice
@ participant1.ledger_api.javaapi.commands.submit(Seq(exchange), {
  import com.daml.ledger.javaapi.data._
  Seq(new CreateCommand(
    new Identifier("order-book", "OrderBook", "Token"),
    new DamlRecord(
      new DamlRecord.Field("issuer", exchange.toProtoPrimitive),
      new DamlRecord.Field("owner", alice.toProtoPrimitive),
      new DamlRecord.Field("symbol", new Text("BTC")),
      new DamlRecord.Field("amount", new Numeric(new java.math.BigDecimal("10.0")))
    )
  ))
})

// Mint 100,000 USD for Alice
@ participant1.ledger_api.javaapi.commands.submit(Seq(exchange), {
  import com.daml.ledger.javaapi.data._
  Seq(new CreateCommand(
    new Identifier("order-book", "OrderBook", "Token"),
    new DamlRecord(
      new DamlRecord.Field("issuer", exchange.toProtoPrimitive),
      new DamlRecord.Field("owner", alice.toProtoPrimitive),
      new DamlRecord.Field("symbol", new Text("USD")),
      new DamlRecord.Field("amount", new Numeric(new java.math.BigDecimal("100000.0")))
    )
  ))
})
```

## Using the DEX

### 1. Access the Web Interface

Navigate to: `http://localhost:3000/dex`

### 2. View Your Tokens

The wallet section displays all tokens you own:
- Symbol (BTC, USD, etc.)
- Amount
- Issuer

### 3. Place an Order

#### Sell Order Example
1. Select **Sell** tab
2. Enter price: `45000` USD
3. Enter quantity: `0.5` BTC
4. Select BTC token from dropdown (as collateral)
5. Click **Place SELL Order**

#### Buy Order Example
1. Select **Buy** tab
2. Enter price: `45500` USD
3. Enter quantity: `0.5` BTC
4. Select USD token from dropdown (as collateral)
5. Click **Place BUY Order**

### 4. View Order Book

The order book updates every 2 seconds showing:
- **Sell Orders (Asks)**: Sorted by price ascending
- **Buy Orders (Bids)**: Sorted by price descending
- **Spread**: Difference between best bid and ask

### 5. Order Matching

When a buy order price >= sell order price, the exchange can match them:
- Execute via Canton console or matching engine
- Settlement is atomic
- Tokens transfer automatically

## API Reference

### GET /api/orderbook/tokens

Get all tokens owned by authenticated user.

**Response:**
```json
[
  {
    "issuer": "party-123::abc",
    "owner": "party-456::def",
    "symbol": "BTC",
    "amount": "10.00000000",
    "contractId": "00abc123..."
  }
]
```

### GET /api/orderbook/orders?baseSymbol={base}&quoteSymbol={quote}

Get order book for trading pair.

**Parameters:**
- `baseSymbol`: Base currency (e.g., "BTC")
- `quoteSymbol`: Quote currency (e.g., "USD")

**Response:**
```json
[
  {
    "exchange": "party-123::abc",
    "trader": "party-456::def",
    "baseSymbol": "BTC",
    "quoteSymbol": "USD",
    "price": "45000.00",
    "quantity": "0.50000000",
    "collateralCid": "00def456...",
    "contractId": "00ghi789...",
    "orderType": "sell"
  }
]
```

### POST /api/orderbook/orders

Place a new order.

**Request Body:**
```json
{
  "orderType": "buy",
  "baseSymbol": "BTC",
  "quoteSymbol": "USD",
  "price": "45500.00",
  "quantity": "0.50000000",
  "collateralCid": "00jkl012..."
}
```

**Response:**
```json
"00mno345..."  // Contract ID of created order
```

## Troubleshooting

### DAML Build Issues

**Problem:** `daml: command not found`

**Solution:**
```bash
# Add DAML to PATH
export PATH="$HOME/.daml/bin:$PATH"

# Or install globally
curl -sSL https://get.daml.com/ | sh
```

**Problem:** SDK version mismatch

**Solution:**
```bash
# Check version in daml.yaml matches .env
cat daml/order-book/daml.yaml
cat .env | grep DAML
```

### Backend Build Issues

**Problem:** Generated bindings not found

**Solution:**
```bash
# Ensure DAML was compiled first
cd daml
daml build --all

# Then rebuild backend
cd ..
./gradlew clean build
```

**Problem:** PQS query errors

**Solution:**
```bash
# Verify PQS is running
docker ps | grep pqs

# Check PQS logs
docker logs backend-service-pqs
```

### Frontend Issues

**Problem:** API calls fail with CORS error

**Solution:**
Check `vite.config.ts` has proxy configured:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
```

**Problem:** DEX route shows 404

**Solution:**
Ensure `DexViewWrapper` is imported and route is added in `App.tsx`

### Runtime Issues

**Problem:** No Exchange contract found

**Solution:**
Create Exchange via Canton console (see Initial Data Setup)

**Problem:** No tokens available

**Solution:**
Mint tokens via Canton console (see Initial Data Setup)

**Problem:** Order placement fails

**Solution:**
1. Check collateral is sufficient
2. Verify collateral symbol matches order requirement
3. Ensure you own the collateral token

## Development Tips

### Hot Reload Development

Terminal 1 - Backend:
```bash
./gradlew :backend:bootRun
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Terminal 3 - DAML:
```bash
cd daml
# After making changes:
daml build --all
# Then restart backend
```

### Debugging

#### Backend Logs
```bash
# If using Docker
docker logs -f backend-service

# If local
# Logs output to console
```

#### Frontend Console
Open browser DevTools Console to see:
- API call logs
- Order book updates
- Error messages

#### Canton Ledger
```bash
make canton-console

@ participant1.ledger_api.state.acs.of_party(alice)
```

## Next Steps

### Enhancements

1. **Automatic Matching Engine**: Background service to match orders
2. **Market Orders**: Immediate execution at best price
3. **Limit Orders with Expiry**: Time-based order cancellation
4. **Partial Fills**: Support for partial order execution
5. **Order History**: Track completed trades
6. **Price Charts**: Visualize trading activity
7. **Multi-Party Support**: Multiple exchanges and makers
8. **Advanced Orders**: Stop-loss, take-profit, etc.

### Production Readiness

1. **Authentication**: Integrate with Canton Network auth
2. **Authorization**: Fine-grained permissions
3. **Error Handling**: Comprehensive error messages
4. **Testing**: Unit, integration, and E2E tests
5. **Monitoring**: Metrics and alerting
6. **Performance**: Optimize PQS queries
7. **Security**: Audit smart contracts
8. **Documentation**: API docs, user guides

## References

- [Canton Documentation](https://docs.canton.network/)
- [DAML Documentation](https://docs.daml.com/)
- [Canton Network Quickstart](https://github.com/digital-asset/canton-network-node)

## License

SPDX-License-Identifier: 0BSD

## Support

For issues and questions:
- Check the troubleshooting section above
- Review Canton documentation
- Open an issue in the repository
