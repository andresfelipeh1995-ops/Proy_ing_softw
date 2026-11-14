package co.uis.investsim.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class PortfolioSummaryDTO {
    private BigDecimal totalCost;
    private BigDecimal totalMarketValue;
    private BigDecimal totalPnl;
    private BigDecimal totalPnlPercent;
    private BigDecimal cashBalance;
    private Integer positionsCount;
}
