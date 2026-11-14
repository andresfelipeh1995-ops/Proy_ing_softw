package co.uis.investsim.trading.repository;

import co.uis.investsim.trading.entity.TradeTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TradeTransactionRepository extends JpaRepository<TradeTransaction, Long> {
    List<TradeTransaction> findByUserIdOrderByExecutedAtDesc(Long userId);

    List<TradeTransaction> findByPortfolioIdAndUserIdOrderByExecutedAtDesc(Long portfolioId, Long userId);
}
