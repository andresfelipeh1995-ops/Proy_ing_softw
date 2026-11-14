package co.uis.investsim.marketdata.mapper;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.common.util.NumberUtils;
import co.uis.investsim.marketdata.dto.AlphaVantageQuoteResponse;
import co.uis.investsim.marketdata.dto.AlphaVantageTimeSeriesResponse;
import co.uis.investsim.marketdata.dto.IngestionLogDTO;
import co.uis.investsim.marketdata.dto.InstrumentDTO;
import co.uis.investsim.marketdata.dto.MarketQuote;
import co.uis.investsim.marketdata.dto.PriceHistoryDTO;
import co.uis.investsim.marketdata.dto.PricePoint;
import co.uis.investsim.marketdata.dto.StooqCandle;
import co.uis.investsim.marketdata.dto.TwelveDataQuoteResponse;
import co.uis.investsim.marketdata.dto.TwelveDataTimeSeriesResponse;
import co.uis.investsim.marketdata.entity.IngestionLog;
import co.uis.investsim.marketdata.entity.Instrument;
import co.uis.investsim.marketdata.entity.PriceHistory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Component
public class MarketDataMapper {

    public MarketQuote toMarketQuote(AlphaVantageQuoteResponse response, String symbol) {
        if (response == null || response.getGlobalQuote() == null || response.getGlobalQuote().isEmpty()) {
            throw new BusinessException("Alpha Vantage no devolvió una cotización válida para " + symbol + ".");
        }

        Map<String, Object> quote = response.getGlobalQuote();
        String normalizedSymbol = value(quote.get("01. symbol"), symbol);
        BigDecimal price = NumberUtils.decimal(quote.get("05. price"));

        if (price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Alpha Vantage devolvió un precio inválido para " + symbol + ".");
        }

        Object rawChangePercent = quote.get("10. change percent");
        BigDecimal changePercent = rawChangePercent == null
                ? BigDecimal.ZERO
                : NumberUtils.decimal(String.valueOf(rawChangePercent).replace("%", ""));

        return new MarketQuote(
                normalizedSymbol,
                price,
                NumberUtils.decimal(quote.get("08. previous close")),
                changePercent,
                NumberUtils.longValue(quote.get("06. volume")),
                "USD",
                "AlphaVantage",
                parseTimestamp(quote.get("07. latest trading day"))
        );
    }

    public MarketQuote toMarketQuote(TwelveDataQuoteResponse response, String symbol) {
        if (response == null || response.getClose() == null || response.getClose().isBlank()) {
            String detail = response != null && response.getMessage() != null ? response.getMessage() : "respuesta vacía";
            throw new BusinessException("Twelve Data no devolvió una cotización válida para " + symbol + " (" + detail + ").");
        }

        BigDecimal price = NumberUtils.decimal(response.getClose());
        BigDecimal previousClose = NumberUtils.decimal(response.getPrevious_close());
        BigDecimal changePercent = response.getPercent_change() != null
                ? NumberUtils.decimal(response.getPercent_change())
                : NumberUtils.percentChange(price, previousClose);

        return new MarketQuote(
                response.getSymbol() == null ? symbol : response.getSymbol(),
                price,
                previousClose,
                changePercent,
                NumberUtils.longValue(response.getVolume()),
                response.getCurrency() == null ? "USD" : response.getCurrency(),
                "TwelveData",
                Instant.now()
        );
    }

    public List<PricePoint> toPricePoints(AlphaVantageTimeSeriesResponse response) {
        if (response == null || response.getTimeSeries() == null || response.getTimeSeries().isEmpty()) {
            return List.of();
        }

        List<PricePoint> points = new ArrayList<>();

        response.getTimeSeries().forEach((date, bar) -> {
            LocalDate tradingDate = parseDate(date);
            if (tradingDate != null && bar != null) {
                points.add(new PricePoint(
                        tradingDate,
                        NumberUtils.decimal(bar.getOpen()),
                        NumberUtils.decimal(bar.getHigh()),
                        NumberUtils.decimal(bar.getLow()),
                        NumberUtils.decimal(bar.getClose()),
                        NumberUtils.longValue(bar.getVolume())
                ));
            }
        });

        points.sort(Comparator.comparing(PricePoint::date));
        return points;
    }

    public List<PricePoint> toPricePoints(TwelveDataTimeSeriesResponse response) {
        if (response == null || response.getValues() == null || response.getValues().isEmpty()) {
            return List.of();
        }

        List<PricePoint> points = new ArrayList<>();

        for (TwelveDataTimeSeriesResponse.Value value : response.getValues()) {
            LocalDate tradingDate = parseDate(value.getDatetime());
            if (tradingDate != null) {
                points.add(new PricePoint(
                        tradingDate,
                        NumberUtils.decimal(value.getOpen()),
                        NumberUtils.decimal(value.getHigh()),
                        NumberUtils.decimal(value.getLow()),
                        NumberUtils.decimal(value.getClose()),
                        NumberUtils.longValue(value.getVolume())
                ));
            }
        }

        points.sort(Comparator.comparing(PricePoint::date));
        return points;
    }

    public List<StooqCandle> parseStooq(String csv) {
        List<StooqCandle> candles = new ArrayList<>();

        if (csv == null || csv.isBlank()) {
            return candles;
        }

        String[] lines = csv.trim().split("\\R");

        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) {
                continue;
            }

            String[] parts = line.split(",");
            if (parts.length < 6) {
                continue;
            }

            LocalDate date = parseDate(parts[0]);
            BigDecimal close = NumberUtils.decimal(parts[4]);

            if (date == null || close.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            candles.add(new StooqCandle(
                    date,
                    NumberUtils.decimal(parts[1]),
                    NumberUtils.decimal(parts[2]),
                    NumberUtils.decimal(parts[3]),
                    close,
                    NumberUtils.longValue(parts[5])
            ));
        }

        candles.sort(Comparator.comparing(StooqCandle::date));
        return candles;
    }

    public InstrumentDTO toDto(Instrument entity) {
        return new InstrumentDTO(
                entity.getId(),
                entity.getSymbol(),
                entity.getName(),
                entity.getType() == null ? null : entity.getType().name(),
                entity.getCurrency(),
                entity.getExchange(),
                entity.getCurrentPrice(),
                entity.getPreviousClose(),
                entity.getDailyChangePercent(),
                entity.getLastUpdated(),
                entity.getActive()
        );
    }

    public PriceHistoryDTO toDto(PriceHistory entity) {
        return new PriceHistoryDTO(
                entity.getDate(),
                entity.getOpen(),
                entity.getHigh(),
                entity.getLow(),
                entity.getClose(),
                entity.getVolume(),
                entity.getSource()
        );
    }

    public IngestionLogDTO toDto(IngestionLog entity) {
        return new IngestionLogDTO(
                entity.getId(),
                entity.getProvider(),
                entity.getSymbol(),
                entity.getOperation(),
                entity.getStatus(),
                entity.getMessage(),
                entity.getRecordsProcessed(),
                entity.getStartedAt(),
                entity.getFinishedAt()
        );
    }

    public List<PricePoint> toPricePoints(List<StooqCandle> candles) {
        return candles.stream()
                .map(candle -> new PricePoint(candle.date(), candle.open(), candle.high(), candle.low(),
                        candle.close(), candle.volume()))
                .toList();
    }

    private String value(Object raw, String fallback) {
        return raw == null || String.valueOf(raw).isBlank() ? fallback : String.valueOf(raw);
    }

    private Instant parseTimestamp(Object raw) {
        LocalDate date = parseDate(raw == null ? null : String.valueOf(raw));
        return date == null ? Instant.now() : date.atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        String value = raw.trim();
        if (value.length() > 10) {
            value = value.substring(0, 10);
        }

        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }
}
