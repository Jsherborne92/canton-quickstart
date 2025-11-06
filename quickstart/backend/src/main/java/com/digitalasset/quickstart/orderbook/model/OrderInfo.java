package com.digitalasset.quickstart.orderbook.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OrderInfo(
    @JsonProperty("exchange") String exchange,
    @JsonProperty("trader") String trader,
    @JsonProperty("baseSymbol") String baseSymbol,
    @JsonProperty("quoteSymbol") String quoteSymbol,
    @JsonProperty("price") String price,
    @JsonProperty("quantity") String quantity,
    @JsonProperty("collateralCid") String collateralCid,
    @JsonProperty("contractId") String contractId,
    @JsonProperty("orderType") String orderType
) {}
