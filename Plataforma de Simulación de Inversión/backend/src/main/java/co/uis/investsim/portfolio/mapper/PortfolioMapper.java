package co.uis.investsim.portfolio.mapper;

import co.uis.investsim.common.util.NumberUtils;
import co.uis.investsim.portfolio.dto.PortfolioDTO;
import co.uis.investsim.portfolio.dto.PortfolioSummaryDTO;
import co.uis.investsim.portfolio.dto.PositionDTO;
import co.uis.investsim.portfolio.entity.Portfolio;
import co.uis.investsim.portfolio.entity.Position;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class PortfolioMapper {

    public PortfolioDTO toDto(Portfolio portfolio, PortfolioSummaryDTO summary, List<PositionDTO> positions) {
        return new PortfolioDTO(
                portfolio.getId(),
                portfolio.getName(),
                portfolio.getDescription(),
                portfolio.getActive(),
                portfolio.getCreatedAt(),
                summary,
                positions
        );
    }

    public PositionDTO toDto(Position position, BigDecimal currentPrice) {
        BigDecimal price = currentPrice == null ? position.getAverageCost() : currentPrice;
        BigDecimal costBasis = NumberUtils.scale(position.getQuantity().multiply(position.getAverageCost()));
        BigDecimal marketValue = NumberUtils.scale(position.getQuantity().multiply(price));
        BigDecimal unrealizedPnl = NumberUtils.scale(marketValue.subtract(costBasis));
        BigDecimal unrealizedPnlPercent = NumberUtils.scale(
                NumberUtils.safeDivide(unrealizedPnl, costBasis).multiply(BigDecimal.valueOf(100)));

        return new PositionDTO(
                position.getId(),
                position.getInstrumentId(),
                position.getSymbol(),
                position.getQuantity(),
                position.getAverageCost(),
                price,
                costBasis,
                marketValue,
                unrealizedPnl,
                unrealizedPnlPercent
        );
    }
}
