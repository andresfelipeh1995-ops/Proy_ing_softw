package co.uis.investsim.marketdata.provider;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.common.util.NumberUtils;
import co.uis.investsim.marketdata.dto.MarketQuote;
import co.uis.investsim.marketdata.dto.PricePoint;
import co.uis.investsim.marketdata.entity.InstrumentType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@Order(4)
public class SyntheticMarketDataProvider implements MarketDataProvider {
    private static final LocalDate ANCHOR = LocalDate.of(2020, 1, 1);

    @Value("${marketdata.synthetic.enabled:true}")
    private boolean enabled;

    @Value("${marketdata.synthetic.base-price:100}")
    private double basePrice;

    @Override
    public String name() {
        return "Synthetic";
    }

    @Override
    public boolean supports(InstrumentType type) {
        return type == InstrumentType.STOCK || type == InstrumentType.ETF;
    }

    @Override
    public boolean isConfigured() {
        return enabled;
    }

    @Override
    public MarketQuote fetchQuote(String symbol) {
        List<PricePoint> history = fetchHistory(symbol, 10);

        if (history.isEmpty()) {
            throw new BusinessException("El proveedor sintético no pudo generar datos para " + symbol + ".");
        }

        PricePoint last = history.get(history.size() - 1);
        PricePoint previous = history.size() > 1 ? history.get(history.size() - 2) : last;

        return new MarketQuote(
                symbol.toUpperCase(),
                last.close(),
                previous.close(),
                NumberUtils.percentChange(last.close(), previous.close()),
                last.volume(),
                "USD",
                name(),
                Instant.now()
        );
    }

    @Override
    public List<PricePoint> fetchHistory(String symbol, int days) {
        List<PricePoint> series = generateSeries(symbol);
        int from = Math.max(0, series.size() - Math.max(days, 1));
        return new ArrayList<>(series.subList(from, series.size()));
    }

    private List<PricePoint> generateSeries(String symbol) {
        Random random = new Random(symbol.toUpperCase().hashCode());
        double price = basePrice + Math.abs(random.nextGaussian()) * (basePrice * 0.25);
        List<PricePoint> points = new ArrayList<>();

        for (LocalDate date = ANCHOR; !date.isAfter(LocalDate.now()); date = date.plusDays(1)) {
            if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                continue;
            }

            double open = Math.max(0.01, price);
            double drift = 0.0002;
            double noise = random.nextGaussian() * 0.015;
            price = Math.max(0.01, open * (1 + drift + noise));
            double high = Math.max(open, price) * (1 + random.nextDouble() * 0.01);
            double low = Math.min(open, price) * (1 - random.nextDouble() * 0.01);
            long volume = 100_000L + (long) (random.nextDouble() * 5_000_000L);

            points.add(new PricePoint(
                    date,
                    decimal(open),
                    decimal(high),
                    decimal(low),
                    decimal(price),
                    volume
            ));
        }

        return points;
    }

    private BigDecimal decimal(double value) {
        return BigDecimal.valueOf(value).setScale(4, RoundingMode.HALF_UP);
    }
}
