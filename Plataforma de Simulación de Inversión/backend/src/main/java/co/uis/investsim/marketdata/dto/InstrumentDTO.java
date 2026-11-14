package co.uis.investsim.marketdata.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class InstrumentDTO {
    private Long id;
    private String symbol;
    private String name;
    private String type;
    private String currency;
    private String exchange;
    private BigDecimal currentPrice;
    private BigDecimal previousClose;
    private BigDecimal dailyChangePercent;
    private Instant lastUpdated;
    private Boolean active;
}
