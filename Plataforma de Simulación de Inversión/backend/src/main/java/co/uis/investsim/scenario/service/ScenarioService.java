package co.uis.investsim.scenario.service;

import co.uis.investsim.common.exception.NotFoundException;
import co.uis.investsim.common.sequence.SequenceService;
import co.uis.investsim.marketdata.dto.InstrumentDTO;
import co.uis.investsim.marketdata.service.MarketDataService;
import co.uis.investsim.portfolio.entity.Portfolio;
import co.uis.investsim.portfolio.entity.Position;
import co.uis.investsim.portfolio.repository.PortfolioRepository;
import co.uis.investsim.portfolio.repository.PositionRepository;
import co.uis.investsim.scenario.dto.PositionImpactDTO;
import co.uis.investsim.scenario.dto.ScenarioRequestDTO;
import co.uis.investsim.scenario.dto.ScenarioResultDTO;
import co.uis.investsim.scenario.entity.MarketScenario;
import co.uis.investsim.scenario.mapper.ScenarioMapper;
import co.uis.investsim.scenario.repository.MarketScenarioRepository;
import co.uis.investsim.user.entity.UserEntity;
import co.uis.investsim.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScenarioService {
    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final PositionRepository positionRepository;
    private final MarketScenarioRepository scenarioRepository;
    private final MarketDataService marketDataService;
    private final ScenarioMapper scenarioMapper;
    private final SequenceService sequenceService;

    public ScenarioResultDTO simulate(String email, ScenarioRequestDTO in) {
        UserEntity user = findUser(email);
        Portfolio portfolio = portfolioRepository
                .findByIdAndUserIdAndActiveTrue(in.getPortfolioId(), user.getId())
                .orElseThrow(() -> new NotFoundException(
                        "Portafolio no encontrado con ID " + in.getPortfolioId() + "."));

        BigDecimal shock = in.getMarketShockPercent().divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);
        BigDecimal volatility = in.getVolatilityMultiplier() == null ? BigDecimal.ONE : in.getVolatilityMultiplier();
        BigDecimal initialValue = BigDecimal.ZERO;
        BigDecimal projectedValue = BigDecimal.ZERO;
        List<PositionImpactDTO> impacts = new ArrayList<>();

        for (Position position : positionRepository.findByPortfolioId(portfolio.getId())) {
            BigDecimal price = currentPrice(position.getSymbol());
            if (price == null) {
                price = position.getAverageCost();
            }

            BigDecimal positionInitial = position.getQuantity().multiply(price).setScale(2, RoundingMode.HALF_UP);
            BigDecimal typeFactor = typeFactor(position.getSymbol());
            BigDecimal shockFactor = shock.multiply(volatility).multiply(typeFactor);
            BigDecimal positionProjected = positionInitial.multiply(BigDecimal.ONE.add(shockFactor))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal change = positionProjected.subtract(positionInitial);
            BigDecimal changePercent = positionInitial.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : change.divide(positionInitial, 6, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).setScale(4, RoundingMode.HALF_UP);

            impacts.add(new PositionImpactDTO(position.getSymbol(), position.getQuantity(), positionInitial,
                    positionProjected, change, changePercent));

            initialValue = initialValue.add(positionInitial);
            projectedValue = projectedValue.add(positionProjected);
        }

        MarketScenario scenario = null;

        if (Boolean.TRUE.equals(in.getSave())) {
            scenario = new MarketScenario();
            scenario.setId(sequenceService.next("scenarios"));
            scenario.setUserId(user.getId());
            scenarioMapper.applyRequest(scenario,
                    in.getName() == null || in.getName().isBlank() ? "Escenario simulado" : in.getName(),
                    in.getDescription(), in.getMarketShockPercent(), in.getInterestRateDelta(),
                    volatility, in.getDurationDays());
            scenario.setCreatedAt(Instant.now());
            scenario = scenarioRepository.save(scenario);
        } else {
            scenario = new MarketScenario();
            scenarioMapper.applyRequest(scenario,
                    in.getName() == null || in.getName().isBlank() ? "Escenario simulado" : in.getName(),
                    in.getDescription(), in.getMarketShockPercent(), in.getInterestRateDelta(),
                    volatility, in.getDurationDays());
        }

        return scenarioMapper.toDto(scenario, portfolio.getId(), initialValue, projectedValue, impacts);
    }

    public List<MarketScenario> list(String email) {
        UserEntity user = findUser(email);
        return scenarioRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public void delete(Long id, String email) {
        UserEntity user = findUser(email);
        MarketScenario scenario = scenarioRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Escenario no encontrado con ID " + id + "."));
        scenarioRepository.delete(scenario);
    }

    private BigDecimal currentPrice(String symbol) {
        try {
            InstrumentDTO instrument = marketDataService.getInstrument(symbol);
            return instrument.getCurrentPrice();
        } catch (Exception ex) {
            return null;
        }
    }

    private BigDecimal typeFactor(String symbol) {
        try {
            String type = marketDataService.getInstrument(symbol).getType();
            return "ETF".equalsIgnoreCase(type) ? BigDecimal.valueOf(0.7) : BigDecimal.ONE;
        } catch (Exception ex) {
            return BigDecimal.ONE;
        }
    }

    private UserEntity findUser(String email) {
        return userRepository.findByEmailAndActiveTrue(email.trim().toLowerCase())
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado con email " + email + "."));
    }
}
