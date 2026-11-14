package co.uis.investsim.trading.mapper;

import co.uis.investsim.trading.dto.TradeTransactionDTO;
import co.uis.investsim.trading.entity.TradeTransaction;
import org.springframework.stereotype.Component;

@Component
public class TradeMapper {

    public TradeTransactionDTO toDto(TradeTransaction entity) {
        return new TradeTransactionDTO(
                entity.getId(),
                entity.getPortfolioId(),
                entity.getSymbol(),
                entity.getType() == null ? null : entity.getType().name(),
                entity.getQuantity(),
                entity.getPrice(),
                entity.getTotal(),
                entity.getStatus(),
                entity.getExecutedAt()
        );
    }
}
