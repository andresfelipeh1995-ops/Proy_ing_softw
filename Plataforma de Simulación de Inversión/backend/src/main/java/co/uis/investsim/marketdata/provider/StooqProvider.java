package co.uis.investsim.marketdata.provider;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.common.util.NumberUtils;
import co.uis.investsim.marketdata.dto.MarketQuote;
import co.uis.investsim.marketdata.dto.PricePoint;
import co.uis.investsim.marketdata.dto.StooqCandle;
import co.uis.investsim.marketdata.entity.InstrumentType;
import co.uis.investsim.marketdata.mapper.MarketDataMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@Order(3)
public class StooqProvider implements MarketDataProvider {
    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final DateTimeFormatter STOOQ_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final WebClient client;
    private final MarketDataMapper mapper;

    public StooqProvider(WebClient.Builder builder, MarketDataMapper mapper,
                         @Value("${marketdata.stooq.base-url}") String baseUrl) {
        this.client = builder.baseUrl(baseUrl).build();
        this.mapper = mapper;
    }

    @Override
    public String name() {
        return "Stooq";
    }

    @Override
    public boolean supports(InstrumentType type) {
        return type == InstrumentType.STOCK || type == InstrumentType.ETF;
    }

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public MarketQuote fetchQuote(String symbol) {
        List<PricePoint> history = fetchHistory(symbol, 10);

        if (history.isEmpty()) {
            throw new BusinessException("Stooq no devolvió datos para " + symbol + ".");
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
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(Math.max(days + 10, 30));

        String csv = client.get()
                .uri(uriBuilder -> uriBuilder.path("/q/d/l/")
                        .queryParam("s", toStooqSymbol(symbol))
                        .queryParam("i", "d")
                        .queryParam("d1", STOOQ_DATE.format(start))
                        .queryParam("d2", STOOQ_DATE.format(end))
                        .build())
                .accept(MediaType.TEXT_PLAIN, MediaType.ALL)
                .retrieve()
                .bodyToMono(String.class)
                .block(TIMEOUT);

        List<StooqCandle> candles = mapper.parseStooq(csv);
        return mapper.toPricePoints(candles);
    }

    private String toStooqSymbol(String symbol) {
        String normalized = symbol.trim().toLowerCase();
        return normalized.contains(".") ? normalized : normalized + ".us";
    }
}
