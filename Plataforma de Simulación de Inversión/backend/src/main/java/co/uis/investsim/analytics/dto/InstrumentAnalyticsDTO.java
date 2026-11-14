package co.uis.investsim.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class InstrumentAnalyticsDTO {
    private String symbol;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal initialPrice;
    private BigDecimal currentPrice;
    private BigDecimal totalReturnPercent;
    private BigDecimal annualizedVolatilityPercent;
    private BigDecimal maxDrawdownPercent;
    private BigDecimal bestDayPercent;
    private BigDecimal worstDayPercent;
    private BigDecimal sharpeRatio;
    private List<PerformancePointDTO> series;
}
