package com.digitalasset.quickstart.orderbook.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TokenInfo(
    @JsonProperty("issuer") String issuer,
    @JsonProperty("owner") String owner,
    @JsonProperty("symbol") String symbol,
    @JsonProperty("amount") String amount,
    @JsonProperty("contractId") String contractId
) {}
