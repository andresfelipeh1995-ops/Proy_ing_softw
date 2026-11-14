package co.uis.investsim.portfolio.repository;

import co.uis.investsim.portfolio.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PositionRepository extends JpaRepository<Position, Long> {
    List<Position> findByPortfolioId(Long portfolioId);

    Optional<Position> findByPortfolioIdAndSymbolIgnoreCase(Long portfolioId, String symbol);
}
