package co.uis.investsim.marketdata.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record MarketQuote(
        String symbol,
        BigDecimal price,
        BigDecimal previousClose,
        BigDecimal changePercent,
        Long volume,
        String currency,
        String source,
        Instant timestamp
) {
}
