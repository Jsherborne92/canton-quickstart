package com.digitalasset.quickstart.orderbook.controller;

import com.digitalasset.quickstart.orderbook.model.*;
import com.digitalasset.quickstart.orderbook.service.OrderBookService;
import com.digitalasset.quickstart.security.AuthUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * REST controller for order book DEX operations.
 * Provides endpoints for viewing tokens, querying the order book, and placing orders.
 */
@RestController
@RequestMapping("/api/orderbook")
public class OrderBookController {

    private static final Logger logger = LoggerFactory.getLogger(OrderBookController.class);

    private final OrderBookService orderBookService;
    private final AuthUtils authUtils;

    @Autowired
    public OrderBookController(OrderBookService orderBookService, AuthUtils authUtils) {
        this.orderBookService = orderBookService;
        this.authUtils = authUtils;
    }

    /**
     * Get all tokens owned by the authenticated user.
     * @param auth Spring Security authentication object
     * @return List of tokens owned by the user
     */
    @GetMapping("/tokens")
    public CompletableFuture<ResponseEntity<List<TokenInfo>>> getTokens(Authentication auth) {
        String party = authUtils.getAuthenticatedParty(auth);
        logger.info("Getting tokens for party: {}", party);

        return orderBookService.getTokens(party)
            .thenApply(ResponseEntity::ok)
            .exceptionally(ex -> {
                logger.error("Error fetching tokens", ex);
                return ResponseEntity.internalServerError().build();
            });
    }

    /**
     * Get the order book for a specific trading pair.
     * @param baseSymbol Base currency symbol (e.g., "BTC")
     * @param quoteSymbol Quote currency symbol (e.g., "USD")
     * @return List of all active orders for the trading pair
     */
    @GetMapping("/orders")
    public CompletableFuture<ResponseEntity<List<OrderInfo>>> getOrderBook(
        @RequestParam String baseSymbol,
        @RequestParam String quoteSymbol
    ) {
        logger.info("Getting order book for {}/{}", baseSymbol, quoteSymbol);

        return orderBookService.getOrderBook(baseSymbol, quoteSymbol)
            .thenApply(ResponseEntity::ok)
            .exceptionally(ex -> {
                logger.error("Error fetching order book", ex);
                return ResponseEntity.internalServerError().build();
            });
    }

    /**
     * Place a new order on the exchange.
     * @param auth Spring Security authentication object
     * @param request Order details including type, symbols, price, quantity, and collateral
     * @return Contract ID of the created order
     */
    @PostMapping("/orders")
    public CompletableFuture<ResponseEntity<String>> placeOrder(
        Authentication auth,
        @RequestBody PlaceOrderRequest request
    ) {
        String party = authUtils.getAuthenticatedParty(auth);
        logger.info("Placing {} order for party {} on {}/{} @ {} x {}",
            request.orderType(), party, request.baseSymbol(), request.quoteSymbol(),
            request.price(), request.quantity());

        return orderBookService.placeOrder(party, request)
            .thenApply(ResponseEntity::ok)
            .exceptionally(ex -> {
                logger.error("Error placing order", ex);
                return ResponseEntity.internalServerError().build();
            });
    }

    /**
     * Health check endpoint.
     * @return Simple status message
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OrderBook API is running");
    }
}
