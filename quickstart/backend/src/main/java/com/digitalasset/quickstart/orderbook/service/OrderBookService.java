package com.digitalasset.quickstart.orderbook.service;

import com.digitalasset.quickstart.ledger.LedgerApi;
import com.digitalasset.quickstart.orderbook.model.*;
import com.digitalasset.quickstart.pqs.Pqs;
import com.digitalasset.transcode.java.ContractId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Service for managing order book operations on the Canton ledger.
 * Handles token management, order placement, and order book queries.
 */
@Service
public class OrderBookService {

    private static final Logger logger = LoggerFactory.getLogger(OrderBookService.class);

    private final LedgerApi ledgerApi;
    private final Pqs pqs;

    @Autowired
    public OrderBookService(LedgerApi ledgerApi, Pqs pqs) {
        this.ledgerApi = ledgerApi;
        this.pqs = pqs;
    }

    /**
     * Get all tokens owned by a specific party.
     * @param owner The party ID of the token owner
     * @return List of token information
     */
    public CompletableFuture<List<TokenInfo>> getTokens(String owner) {
        String sql = """
            SELECT contract_id, payload
            FROM active('OrderBook:Token')
            WHERE payload->>'owner' = ?
            ORDER BY payload->>'symbol', contract_id
            """;

        return pqs.query(sql, rs -> {
            return new TokenInfo(
                rs.getString("payload")->'issuer',
                rs.getString("payload")->'owner',
                rs.getString("payload")->'symbol',
                rs.getString("payload")->'amount',
                rs.getString("contract_id")
            );
        }, owner).thenApply(list -> list);
    }

    /**
     * Get all active orders for a specific trading pair.
     * @param baseSymbol The base currency symbol (e.g., "BTC")
     * @param quoteSymbol The quote currency symbol (e.g., "USD")
     * @return List of all buy and sell orders
     */
    public CompletableFuture<List<OrderInfo>> getOrderBook(String baseSymbol, String quoteSymbol) {
        // Query buy orders
        String buyOrdersSql = """
            SELECT contract_id, payload
            FROM active('OrderBook:BuyOrder')
            WHERE payload->>'baseSymbol' = ?
              AND payload->>'quoteSymbol' = ?
            ORDER BY CAST(payload->>'price' AS DECIMAL) DESC
            """;

        // Query sell orders
        String sellOrdersSql = """
            SELECT contract_id, payload
            FROM active('OrderBook:SellOrder')
            WHERE payload->>'baseSymbol' = ?
              AND payload->>'quoteSymbol' = ?
            ORDER BY CAST(payload->>'price' AS DECIMAL) ASC
            """;

        var buyOrdersFuture = pqs.query(buyOrdersSql, rs -> {
            return new OrderInfo(
                rs.getString("payload")->'exchange',
                rs.getString("payload")->'trader',
                rs.getString("payload")->'baseSymbol',
                rs.getString("payload")->'quoteSymbol',
                rs.getString("payload")->'price',
                rs.getString("payload")->'quantity',
                rs.getString("payload")->'collateralCid',
                rs.getString("contract_id"),
                "buy"
            );
        }, baseSymbol, quoteSymbol);

        var sellOrdersFuture = pqs.query(sellOrdersSql, rs -> {
            return new OrderInfo(
                rs.getString("payload")->'exchange',
                rs.getString("payload")->'trader',
                rs.getString("payload")->'baseSymbol',
                rs.getString("payload")->'quoteSymbol',
                rs.getString("payload")->'price',
                rs.getString("payload")->'quantity',
                rs.getString("payload")->'collateralCid',
                rs.getString("contract_id"),
                "sell"
            );
        }, baseSymbol, quoteSymbol);

        // Combine both futures
        return buyOrdersFuture.thenCombine(sellOrdersFuture, (buyOrders, sellOrders) -> {
            var combined = new java.util.ArrayList<OrderInfo>();
            combined.addAll(buyOrders);
            combined.addAll(sellOrders);
            return combined;
        });
    }

    /**
     * Place a new order on the exchange.
     * @param trader The party placing the order
     * @param request Order details
     * @return Contract ID of the created order
     */
    public CompletableFuture<String> placeOrder(String trader, PlaceOrderRequest request) {
        // First, find the Exchange contract
        String exchangeSql = """
            SELECT contract_id
            FROM active('OrderBook:Exchange')
            LIMIT 1
            """;

        return pqs.query(exchangeSql, rs -> rs.getString("contract_id"))
            .thenCompose(exchangeContracts -> {
                if (exchangeContracts.isEmpty()) {
                    throw new IllegalStateException("No Exchange contract found");
                }

                String exchangeContractId = exchangeContracts.get(0);

                // NOTE: This is pseudo-code. Actual implementation requires:
                // 1. Generated DAML bindings from order-book DAR
                // 2. Proper exercise choice syntax using transcode library
                // 3. Template type classes for OrderBook.Exchange

                // Example structure (will need DAML bindings):
                // return ledgerApi.exercise(
                //     new ContractId<Exchange>(exchangeContractId),
                //     new Exchange_CreateBuyOrder(...) or new Exchange_CreateSellOrder(...)
                // );

                logger.warn("Order placement requires compiled DAML bindings - returning placeholder");
                return CompletableFuture.completedFuture("placeholder-order-id");
            });
    }
}
