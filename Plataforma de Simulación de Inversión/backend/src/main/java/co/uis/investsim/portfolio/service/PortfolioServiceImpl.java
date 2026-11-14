package co.uis.investsim.portfolio.service;

import co.uis.investsim.common.exception.NotFoundException;
import co.uis.investsim.common.sequence.SequenceService;
import co.uis.investsim.common.util.NumberUtils;
import co.uis.investsim.marketdata.dto.InstrumentDTO;
import co.uis.investsim.marketdata.service.MarketDataService;
import co.uis.investsim.portfolio.dto.PortfolioCreateDTO;
import co.uis.investsim.portfolio.dto.PortfolioDTO;
import co.uis.investsim.portfolio.dto.PortfolioSummaryDTO;
import co.uis.investsim.portfolio.dto.PositionDTO;
import co.uis.investsim.portfolio.entity.Portfolio;
import co.uis.investsim.portfolio.entity.Position;
import co.uis.investsim.portfolio.mapper.PortfolioMapper;
import co.uis.investsim.portfolio.repository.PortfolioRepository;
import co.uis.investsim.portfolio.repository.PositionRepository;
import co.uis.investsim.user.entity.UserEntity;
import co.uis.investsim.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PortfolioServiceImpl implements PortfolioService {
    private final PortfolioRepository portfolioRepository;
    private final PositionRepository positionRepository;
    private final UserService userService;
    private final MarketDataService marketDataService;
    private final PortfolioMapper portfolioMapper;
    private final SequenceService sequenceService;

    @Override
    public PortfolioDTO create(String email, PortfolioCreateDTO in) {
        UserEntity user = userService.findByEmail(email);

        Portfolio portfolio = new Portfolio();
        portfolio.setId(sequenceService.next("portfolios"));
        portfolio.setUserId(user.getId());
        portfolio.setName(in.getName().trim());
        portfolio.setDescription(in.getDescription());
        portfolio.setActive(true);
        portfolio.setCreatedAt(Instant.now());

        return buildDto(portfolioRepository.save(portfolio), user);
    }

    @Override
    public List<PortfolioDTO> list(String email) {
        UserEntity user = userService.findByEmail(email);

        return portfolioRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .map(portfolio -> buildDto(portfolio, user))
                .toList();
    }

    @Override
    public PortfolioDTO get(Long id, String email) {
        UserEntity user = userService.findByEmail(email);
        return buildDto(findOwnedEntity(id, email), user);
    }

    @Override
    public PortfolioDTO update(Long id, String email, PortfolioCreateDTO in) {
        UserEntity user = userService.findByEmail(email);
        Portfolio portfolio = findOwnedEntity(id, email);

        portfolio.setName(in.getName().trim());
        portfolio.setDescription(in.getDescription());

        return buildDto(portfolioRepository.save(portfolio), user);
    }

    @Override
    public void deactivate(Long id, String email) {
        Portfolio portfolio = findOwnedEntity(id, email);
        portfolio.setActive(false);
        portfolioRepository.save(portfolio);
    }

    @Override
    public PortfolioSummaryDTO summary(Long id, String email) {
        UserEntity user = userService.findByEmail(email);
        Portfolio portfolio = findOwnedEntity(id, email);
        return buildSummary(portfolio, user, buildPositions(portfolio));
    }

    @Override
    public Portfolio findOwnedEntity(Long id, String email) {
        UserEntity user = userService.findByEmail(email);

        return portfolioRepository.findByIdAndUserIdAndActiveTrue(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Portafolio no encontrado con ID " + id + "."));
    }

    private PortfolioDTO buildDto(Portfolio portfolio, UserEntity user) {
        List<PositionDTO> positions = buildPositions(portfolio);
        PortfolioSummaryDTO summary = buildSummary(portfolio, user, positions);
        return portfolioMapper.toDto(portfolio, summary, positions);
    }

    private List<PositionDTO> buildPositions(Portfolio portfolio) {
        List<Position> positions = positionRepository.findByPortfolioId(portfolio.getId());
        List<PositionDTO> result = new ArrayList<>();

        for (Position position : positions) {
            BigDecimal currentPrice = currentPrice(position.getSymbol());
            result.add(portfolioMapper.toDto(position, currentPrice));
        }

        return result;
    }

    private PortfolioSummaryDTO buildSummary(Portfolio portfolio, UserEntity user, List<PositionDTO> positions) {
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalMarketValue = BigDecimal.ZERO;

        for (PositionDTO position : positions) {
            totalCost = totalCost.add(position.getCostBasis());
            totalMarketValue = totalMarketValue.add(position.getMarketValue());
        }

        BigDecimal totalPnl = totalMarketValue.subtract(totalCost);
        BigDecimal totalPnlPercent = NumberUtils.scale(
                NumberUtils.safeDivide(totalPnl, totalCost).multiply(BigDecimal.valueOf(100)));

        return new PortfolioSummaryDTO(
                NumberUtils.scale(totalCost),
                NumberUtils.scale(totalMarketValue),
                NumberUtils.scale(totalPnl),
                totalPnlPercent,
                NumberUtils.scale(user.getAvailableBalance()),
                positions.size()
        );
    }

    private BigDecimal currentPrice(String symbol) {
        try {
            InstrumentDTO instrument = marketDataService.getInstrument(symbol);
            return instrument.getCurrentPrice();
        } catch (Exception ex) {
            return null;
        }
    }
}
