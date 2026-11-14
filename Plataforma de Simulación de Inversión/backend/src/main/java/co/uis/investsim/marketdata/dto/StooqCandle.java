package co.uis.investsim.marketdata.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record StooqCandle(
        LocalDate date,
        BigDecimal open,
        BigDecimal high,
        BigDecimal low,
        BigDecimal close,
        Long volume
) {
}
