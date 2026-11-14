package co.uis.investsim.scenario.repository;

import co.uis.investsim.scenario.entity.MarketScenario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MarketScenarioRepository extends JpaRepository<MarketScenario, Long> {
    List<MarketScenario> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<MarketScenario> findByIdAndUserId(Long id, Long userId);
}
