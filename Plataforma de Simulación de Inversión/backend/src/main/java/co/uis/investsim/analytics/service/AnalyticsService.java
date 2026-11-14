package co.uis.investsim.analytics.service;

import co.uis.investsim.analytics.dto.InstrumentAnalyticsDTO;
import co.uis.investsim.analytics.dto.PerformancePointDTO;
import co.uis.investsim.analytics.dto.PortfolioAnalyticsDTO;
import co.uis.investsim.common.exception.NotFoundException;
import co.uis.investsim.common.util.FinancialMath;
import co.uis.investsim.marketdata.entity.PriceHistory;
import co.uis.investsim.marketdata.repository.PriceHistoryRepository;
import co.uis.investsim.marketdata.service.MarketDataService;
import co.uis.investsim.portfolio.entity.Portfolio;
import co.uis.investsim.portfolio.entity.Position;
import co.uis.investsim.portfolio.repository.PortfolioRepository;
import co.uis.investsim.portfolio.repository.PositionRepository;
import co.uis.investsim.user.entity.UserEntity;
import co.uis.investsim.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;
import java.util.TreeSet;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final PositionRepository positionRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final MarketDataService marketDataService;

    public PortfolioAnalyticsDTO portfolioAnalytics(String email, Long portfolioId, int days) {
        UserEntity user = userRepository.findByEmailAndActiveTrue(email.trim().toLowerCase())
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado con email " + email + "."));

        Portfolio portfolio = portfolioRepository.findByIdAndUserIdAndActiveTrue(portfolioId, user.getId())
                .orElseThrow(() -> new NotFoundException("Portafolio no encontrado con ID " + portfolioId + "."));

        List<Position> positions = positionRepository.findByPortfolioId(portfolio.getId());
        LocalDate from = LocalDate.now().minusDays(days <= 0 ? 180 : days);

        Map<String, NavigableMap<LocalDate, BigDecimal>> closesBySymbol = new HashMap<>();
        Map<String, BigDecimal> quantities = new HashMap<>();
        TreeSet<LocalDate> allDates = new TreeSet<>();

        for (Position position : positions) {
            quantities.put(position.getSymbol(), position.getQuantity());

            List<PriceHistory> history = priceHistoryRepository
                    .findBySymbolAndDateAfterOrderByDateAsc(position.getSymbol(), from);
            NavigableMap<LocalDate, BigDecimal> closes = new TreeMap<>();

            for (PriceHistory price : history) {
                closes.put(price.getDate(), price.getClose());
            }

            if (closes.isEmpty()) {
                BigDecimal price = currentPrice(position.getSymbol(), position.getAverageCost());
                closes.put(LocalDate.now(), price);
            }

            closesBySymbol.put(position.getSymbol(), closes);
            allDates.addAll(closes.keySet());
        }

        List<PerformancePointDTO> series = new ArrayList<>();

        for (LocalDate date : allDates) {
            BigDecimal total = BigDecimal.ZERO;
            for (Map.Entry<String, NavigableMap<LocalDate, BigDecimal>> entry : closesBySymbol.entrySet()) {
                Map.Entry<LocalDate, BigDecimal> price = entry.getValue().floorEntry(date);
                if (price != null) {
                    total = total.add(price.getValue().multiply(quantities.get(entry.getKey())));
                }
            }
            series.add(new PerformancePointDTO(date, total.setScale(2, RoundingMode.HALF_UP)));
        }

        Metrics metrics = calculateMetrics(series);

        return new PortfolioAnalyticsDTO(
                portfolio.getId(),
                portfolio.getName(),
                series.isEmpty() ? null : series.get(0).getDate(),
                series.isEmpty() ? null : series.get(series.size() - 1).getDate(),
                metrics.initialValue,
                metrics.currentValue,
                metrics.totalReturnPercent,
                metrics.annualizedVolatilityPercent,
                metrics.maxDrawdownPercent,
                metrics.bestDayPercent,
                metrics.worstDayPercent,
                metrics.sharpeRatio,
                series
        );
    }

    public InstrumentAnalyticsDTO instrumentAnalytics(String symbol, int days) {
        int requestedDays = days <= 0 ? 180 : days;
        LocalDate from = LocalDate.now().minusDays(requestedDays);

        List<PriceHistory> history = priceHistoryRepository
                .findBySymbolAndDateAfterOrderByDateAsc(symbol.toUpperCase(), from);

        List<PerformancePointDTO> series = history.stream()
                .map(price -> new PerformancePointDTO(price.getDate(), price.getClose()))
                .toList();

        Metrics metrics = calculateMetrics(series);
        String normalized = symbol.toUpperCase();

        return new InstrumentAnalyticsDTO(
                normalized,
                series.isEmpty() ? null : series.get(0).getDate(),
                series.isEmpty() ? null : series.get(series.size() - 1).getDate(),
                metrics.initialValue,
                metrics.currentValue,
                metrics.totalReturnPercent,
                metrics.annualizedVolatilityPercent,
                metrics.maxDrawdownPercent,
                metrics.bestDayPercent,
                metrics.worstDayPercent,
                metrics.sharpeRatio,
                series
        );
    }

    private Metrics calculateMetrics(List<PerformancePointDTO> series) {
        if (series.isEmpty()) {
            return Metrics.empty();
        }

        BigDecimal initial = series.get(0).getValue();
        BigDecimal current = series.get(series.size() - 1).getValue();
        BigDecimal totalReturn = initial.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : current.subtract(initial).divide(initial, 8, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(4, RoundingMode.HALF_UP);

        List<Double> returns = new ArrayList<>();

        for (int i = 1; i < series.size(); i++) {
            double previous = series.get(i - 1).getValue().doubleValue();
            double value = series.get(i).getValue().doubleValue();
            if (previous > 0) {
                returns.add((value - previous) / previous);
            }
        }

        double mean = returns.stream().mapToDouble(Double::doubleValue).average().orElse(0d);
        double variance = returns.size() > 1
                ? returns.stream().mapToDouble(r -> Math.pow(r - mean, 2)).sum() / (returns.size() - 1)
                : 0d;
        double stdDev = Math.sqrt(variance);

        double annualizedVolatility = FinancialMath.annualizedVolatility(stdDev).doubleValue();

        BigDecimal maxDrawdown = calculateMaxDrawdown(series);
        BigDecimal bestDay = returns.stream().max(Double::compareTo)
                .map(value -> BigDecimal.valueOf(value * 100).setScale(4, RoundingMode.HALF_UP))
                .orElse(BigDecimal.ZERO);
        BigDecimal worstDay = returns.stream().min(Double::compareTo)
                .map(value -> BigDecimal.valueOf(value * 100).setScale(4, RoundingMode.HALF_UP))
                .orElse(BigDecimal.ZERO);

        double sharpe = stdDev == 0 ? 0d : (mean * 252) / (stdDev * Math.sqrt(252));

        return new Metrics(
                initial.setScale(2, RoundingMode.HALF_UP),
                current.setScale(2, RoundingMode.HALF_UP),
                totalReturn,
                BigDecimal.valueOf(annualizedVolatility).setScale(4, RoundingMode.HALF_UP),
                maxDrawdown,
                bestDay,
                worstDay,
                BigDecimal.valueOf(sharpe).setScale(4, RoundingMode.HALF_UP)
        );
    }

    private BigDecimal calculateMaxDrawdown(List<PerformancePointDTO> series) {
        double peak = Double.NEGATIVE_INFINITY;
        double maxDrawdown = 0d;

        for (PerformancePointDTO point : series) {
            double value = point.getValue().doubleValue();

            if (value > peak) {
                peak = value;
            }

            if (peak > 0) {
                double drawdown = (value - peak) / peak;
                if (drawdown < maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            }
        }

        return BigDecimal.valueOf(maxDrawdown * 100).setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal currentPrice(String symbol, BigDecimal fallback) {
        try {
            BigDecimal price = marketDataService.getInstrument(symbol).getCurrentPrice();
            return price == null ? fallback : price;
        } catch (Exception ex) {
            return fallback;
        }
    }

    private record Metrics(
            BigDecimal initialValue,
            BigDecimal currentValue,
            BigDecimal totalReturnPercent,
            BigDecimal annualizedVolatilityPercent,
            BigDecimal maxDrawdownPercent,
            BigDecimal bestDayPercent,
            BigDecimal worstDayPercent,
            BigDecimal sharpeRatio
    ) {
        static Metrics empty() {
            return new Metrics(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }
    }
}
