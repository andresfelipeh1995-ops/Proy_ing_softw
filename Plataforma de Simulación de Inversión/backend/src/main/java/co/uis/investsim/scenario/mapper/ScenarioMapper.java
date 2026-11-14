package co.uis.investsim.scenario.mapper;

import co.uis.investsim.scenario.dto.ScenarioResultDTO;
import co.uis.investsim.scenario.entity.MarketScenario;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class ScenarioMapper {

    public void applyRequest(MarketScenario entity, String name, String description,
                             BigDecimal shock, BigDecimal rateDelta, BigDecimal volatility, Integer days) {
        entity.setName(name);
        entity.setDescription(description);
        entity.setMarketShockPercent(shock);
        entity.setInterestRateDelta(rateDelta);
        entity.setVolatilityMultiplier(volatility);
        entity.setDurationDays(days);
    }

    public ScenarioResultDTO toDto(MarketScenario scenario, Long portfolioId, BigDecimal initialValue,
                                   BigDecimal projectedValue, List<co.uis.investsim.scenario.dto.PositionImpactDTO> positions) {
        BigDecimal changeAmount = projectedValue.subtract(initialValue);
        BigDecimal changePercent = initialValue.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : changeAmount.divide(initialValue, 6, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(4, java.math.RoundingMode.HALF_UP);

        return new ScenarioResultDTO(
                scenario == null ? null : scenario.getId(),
                portfolioId,
                scenario == null ? null : scenario.getName(),
                scenario == null ? null : scenario.getMarketShockPercent(),
                scenario == null ? null : scenario.getInterestRateDelta(),
                scenario == null ? null : scenario.getVolatilityMultiplier(),
                scenario == null ? null : scenario.getDurationDays(),
                initialValue.setScale(2, java.math.RoundingMode.HALF_UP),
                projectedValue.setScale(2, java.math.RoundingMode.HALF_UP),
                changeAmount.setScale(2, java.math.RoundingMode.HALF_UP),
                changePercent,
                positions
        );
    }
}
