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
public class PortfolioAnalyticsDTO {
    private Long portfolioId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal initialValue;
    private BigDecimal currentValue;
    private BigDecimal totalReturnPercent;
    private BigDecimal annualizedVolatilityPercent;
    private BigDecimal maxDrawdownPercent;
    private BigDecimal bestDayPercent;
    private BigDecimal worstDayPercent;
    private BigDecimal sharpeRatio;
    private List<PerformancePointDTO> series;
}
