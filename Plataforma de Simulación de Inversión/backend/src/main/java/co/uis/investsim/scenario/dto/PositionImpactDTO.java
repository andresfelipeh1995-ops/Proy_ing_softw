package co.uis.investsim.scenario.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class PositionImpactDTO {
    private String symbol;
    private BigDecimal quantity;
    private BigDecimal initialValue;
    private BigDecimal projectedValue;
    private BigDecimal changeAmount;
    private BigDecimal changePercent;
}
