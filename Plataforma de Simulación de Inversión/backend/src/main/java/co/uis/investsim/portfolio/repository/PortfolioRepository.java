package co.uis.investsim.portfolio.repository;

import co.uis.investsim.portfolio.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    List<Portfolio> findByUserIdAndActiveTrue(Long userId);

    Optional<Portfolio> findByIdAndActiveTrue(Long id);

    Optional<Portfolio> findByIdAndUserIdAndActiveTrue(Long id, Long userId);
}
