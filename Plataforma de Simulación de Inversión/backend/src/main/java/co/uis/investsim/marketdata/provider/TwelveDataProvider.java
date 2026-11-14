package co.uis.investsim.marketdata.provider;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.marketdata.dto.MarketQuote;
import co.uis.investsim.marketdata.dto.PricePoint;
import co.uis.investsim.marketdata.dto.TwelveDataQuoteResponse;
import co.uis.investsim.marketdata.dto.TwelveDataTimeSeriesResponse;
import co.uis.investsim.marketdata.entity.InstrumentType;
import co.uis.investsim.marketdata.mapper.MarketDataMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;

@Component
@Order(2)
public class TwelveDataProvider implements MarketDataProvider {
    private static final Duration TIMEOUT = Duration.ofSeconds(20);

    private final WebClient client;
    private final MarketDataMapper mapper;

    @Value("${marketdata.twelvedata.api-key:}")
    private String apiKey;

    public TwelveDataProvider(WebClient.Builder builder, MarketDataMapper mapper,
                              @Value("${marketdata.twelvedata.base-url}") String baseUrl) {
        this.client = builder.baseUrl(baseUrl).build();
        this.mapper = mapper;
    }

    @Override
    public String name() {
        return "TwelveData";
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
        TwelveDataQuoteResponse response = client.get()
                .uri(uriBuilder -> uriBuilder.path("/quote")
                        .queryParam("symbol", symbol.toUpperCase())
                        .queryParam("apikey", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(TwelveDataQuoteResponse.class)
                .block(TIMEOUT);

        if (response != null && "error".equalsIgnoreCase(response.getStatus())) {
            throw new BusinessException("Twelve Data: " + response.getMessage());
        }

        return mapper.toMarketQuote(response, symbol);
    }

    @Override
    public List<PricePoint> fetchHistory(String symbol, int days) {
        int outputSize = Math.min(Math.max(days, 30), 5000);

        TwelveDataTimeSeriesResponse response = client.get()
                .uri(uriBuilder -> uriBuilder.path("/time_series")
                        .queryParam("symbol", symbol.toUpperCase())
                        .queryParam("interval", "1day")
                        .queryParam("outputsize", outputSize)
                        .queryParam("apikey", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(TwelveDataTimeSeriesResponse.class)
                .block(TIMEOUT);

        if (response != null && "error".equalsIgnoreCase(response.getStatus())) {
            throw new BusinessException("Twelve Data: " + response.getMessage());
        }

        return mapper.toPricePoints(response);
    }
}
