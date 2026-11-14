package co.uis.investsim.marketdata.provider;

import co.uis.investsim.marketdata.dto.AlphaVantageQuoteResponse;
import co.uis.investsim.marketdata.dto.AlphaVantageTimeSeriesResponse;
import co.uis.investsim.marketdata.dto.MarketQuote;
import co.uis.investsim.marketdata.dto.PricePoint;
import co.uis.investsim.marketdata.entity.InstrumentType;
import co.uis.investsim.marketdata.mapper.MarketDataMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;

@Component
@Order(1)
public class AlphaVantageProvider implements MarketDataProvider {
    private static final Duration TIMEOUT = Duration.ofSeconds(20);

    private final WebClient client;
    private final MarketDataMapper mapper;

    @Value("${marketdata.alphavantage.api-key:}")
    private String apiKey;

    public AlphaVantageProvider(WebClient.Builder builder, MarketDataMapper mapper,
                                @Value("${marketdata.alphavantage.base-url}") String baseUrl) {
        this.client = builder.baseUrl(baseUrl).build();
        this.mapper = mapper;
    }

    @Override
    public String name() {
        return "AlphaVantage";
    }

    @Override
    public boolean supports(InstrumentType type) {
        return type == InstrumentType.STOCK || type == InstrumentType.ETF;
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public MarketQuote fetchQuote(String symbol) {
        AlphaVantageQuoteResponse response = client.get()
                .uri(uriBuilder -> uriBuilder.path("/query")
                        .queryParam("function", "GLOBAL_QUOTE")
                        .queryParam("symbol", symbol.toUpperCase())
                        .queryParam("apikey", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(AlphaVantageQuoteResponse.class)
                .block(TIMEOUT);

        return mapper.toMarketQuote(response, symbol);
    }

    @Override
    public List<PricePoint> fetchHistory(String symbol, int days) {
        String outputSize = days > 100 ? "full" : "compact";

        AlphaVantageTimeSeriesResponse response = client.get()
                .uri(uriBuilder -> uriBuilder.path("/query")
                        .queryParam("function", "TIME_SERIES_DAILY")
                        .queryParam("symbol", symbol.toUpperCase())
                        .queryParam("outputsize", outputSize)
                        .queryParam("apikey", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(AlphaVantageTimeSeriesResponse.class)
                .block(TIMEOUT);

        return mapper.toPricePoints(response);
    }
}
