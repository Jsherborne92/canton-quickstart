package com.digitalasset.quickstart.orderbook.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PlaceOrderRequest(
    @JsonProperty("orderType") String orderType,
    @JsonProperty("baseSymbol") String baseSymbol,
    @JsonProperty("quoteSymbol") String quoteSymbol,
    @JsonProperty("price") String price,
    @JsonProperty("quantity") String quantity,
    @JsonProperty("collateralCid") String collateralCid
) {}
