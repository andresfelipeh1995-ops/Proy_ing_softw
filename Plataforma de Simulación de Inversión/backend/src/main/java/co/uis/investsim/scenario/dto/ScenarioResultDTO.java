package co.uis.investsim.scenario.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ScenarioResultDTO {
    private Long scenarioId;
    private Long portfolioId;
    private String name;
    private BigDecimal marketShockPercent;
    private BigDecimal interestRateDelta;
    private BigDecimal volatilityMultiplier;
    private Integer durationDays;
    private BigDecimal initialValue;
    private BigDecimal projectedValue;
    private BigDecimal changeAmount;
    private BigDecimal changePercent;
    private List<PositionImpactDTO> positions;
}
