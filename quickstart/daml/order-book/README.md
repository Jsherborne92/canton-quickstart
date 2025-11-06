# Order Book DEX - DAML Contracts

This module contains the DAML smart contracts for a decentralized order book exchange.

## Contracts

### Token
A fungible token template representing tradeable assets.

**Signatories:** issuer
**Observers:** owner

**Fields:**
- `issuer: Party` - The party that issued the token
- `owner: Party` - The current owner of the token
- `symbol: Text` - Token symbol (e.g., "BTC", "USD")
- `amount: Decimal` - Token amount (must be > 0)

**Choices:**
- `Transfer` - Transfer token to a new owner
- `Split` - Split token into two separate tokens
- `Merge` - Merge two tokens of the same symbol

### Exchange
The exchange operator template that manages order creation.

**Signatories:** operator

**Fields:**
- `operator: Party` - The exchange operator party
- `name: Text` - Name of the exchange

**Choices:**
- `CreateBuyOrder` - Create a new buy order (requires USD collateral)
- `CreateSellOrder` - Create a new sell order (requires asset collateral)

### BuyOrder
Represents a bid to buy an asset at a specific price.

**Signatories:** exchange, trader

**Fields:**
- `exchange: Party` - The exchange operator
- `trader: Party` - The party placing the order
- `baseSymbol: Text` - Asset to buy (e.g., "BTC")
- `quoteSymbol: Text` - Currency to pay with (e.g., "USD")
- `price: Decimal` - Price per unit
- `quantity: Decimal` - Amount to buy
- `collateralCid: ContractId Token` - Locked quote currency tokens

**Choices:**
- `CancelBuyOrder` - Cancel order and return collateral
- `MatchWithSellOrder` - Match with a sell order (exchange only)

### SellOrder
Represents an offer to sell an asset at a specific price.

**Signatories:** exchange, trader

**Fields:**
- `exchange: Party` - The exchange operator
- `trader: Party` - The party placing the order
- `baseSymbol: Text` - Asset to sell
- `quoteSymbol: Text` - Currency to receive
- `price: Decimal` - Price per unit
- `quantity: Decimal` - Amount to sell
- `collateralCid: ContractId Token` - Locked asset tokens

**Choices:**
- `CancelSellOrder` - Cancel order and return collateral

## Order Matching Logic

When `MatchWithSellOrder` is exercised on a `BuyOrder`:

1. **Validation:**
   - Symbols must match
   - Buy price must be >= sell price

2. **Trade Execution:**
   - Trade price = sell order price
   - Trade quantity = min(buy quantity, sell quantity)
   - Quote amount = trade price * trade quantity

3. **Collateral Handling:**
   - Split collateral tokens to exact amounts needed
   - Transfer tokens between parties atomically

4. **Remaining Orders:**
   - If partially filled, create new order with remaining quantity
   - If fully filled, archive the order
   - Return excess collateral to traders

## Building

```bash
# Build this module
daml build

# Run from multi-package (recommended)
cd ..
daml build --all
```

Output: `.daml/dist/order-book-0.0.1.dar`

## Testing

Create a test file `daml/order-book/Test.daml`:

```haskell
module Test where

import OrderBook
import Daml.Script

test_token_transfer : Script ()
test_token_transfer = script do
  alice <- allocateParty "Alice"
  bob <- allocateParty "Bob"

  -- Create token
  tokenId <- submit alice do
    createCmd Token with
      issuer = alice
      owner = alice
      symbol = "BTC"
      amount = 10.0

  -- Transfer to Bob
  newTokenId <- submit alice do
    exerciseCmd tokenId Transfer with newOwner = bob

  -- Verify new owner
  token <- queryContractId bob newTokenId
  assert (token._2.owner == bob)

  return ()

test_order_placement : Script ()
test_order_placement = script do
  exchange <- allocateParty "Exchange"
  trader <- allocateParty "Trader"

  -- Create exchange
  exchangeId <- submit exchange do
    createCmd Exchange with
      operator = exchange
      name = "Test DEX"

  -- Mint USD collateral
  usdId <- submit exchange do
    createCmd Token with
      issuer = exchange
      owner = trader
      symbol = "USD"
      amount = 50000.0

  -- Place buy order
  buyOrderId <- submit trader do
    exerciseCmd exchangeId CreateBuyOrder with
      trader = trader
      baseSymbol = "BTC"
      quoteSymbol = "USD"
      price = 45000.0
      quantity = 1.0
      collateralCid = usdId

  return ()
```

Run tests:
```bash
daml test
```

## Integration

This DAR is automatically:
1. Compiled by `daml build --all`
2. Used to generate Java bindings via `codeGenOrderBook` Gradle task
3. Deployed to Canton via Docker compose
4. Queried by backend via PQS

## Dependencies

- `daml-prim`
- `daml-stdlib`

Target: DAML-LF 2.1

## License

SPDX-License-Identifier: 0BSD
