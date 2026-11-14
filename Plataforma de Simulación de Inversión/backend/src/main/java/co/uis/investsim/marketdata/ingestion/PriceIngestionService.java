package co.uis.investsim.marketdata.ingestion;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.common.exception.NotFoundException;
import co.uis.investsim.common.sequence.SequenceService;
import co.uis.investsim.common.util.NumberUtils;
import co.uis.investsim.marketdata.dto.MarketQuote;
import co.uis.investsim.marketdata.dto.PricePoint;
import co.uis.investsim.marketdata.entity.IngestionLog;
import co.uis.investsim.marketdata.entity.Instrument;
import co.uis.investsim.marketdata.entity.InstrumentType;
import co.uis.investsim.marketdata.entity.PriceHistory;
import co.uis.investsim.marketdata.provider.ProviderRouter;
import co.uis.investsim.marketdata.repository.IngestionLogRepository;
import co.uis.investsim.marketdata.repository.InstrumentRepository;
import co.uis.investsim.marketdata.repository.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceIngestionService {
    private final InstrumentRepository instrumentRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final IngestionLogRepository ingestionLogRepository;
    private final ProviderRouter providerRouter;
    private final SequenceService sequenceService;

    @Value("${ingestion.history-days:365}")
    private int historyDays;

    public Instrument registerInstrument(String symbol, InstrumentType type, String name) {
        String normalized = symbol.trim().toUpperCase();

        return instrumentRepository.findBySymbolIgnoreCase(normalized).orElseGet(() -> {
            Instrument instrument = new Instrument();
            instrument.setId(sequenceService.next("instruments"));
            instrument.setSymbol(normalized);
            instrument.setName(name == null || name.isBlank() ? normalized : name.trim());
            instrument.setType(type);
            instrument.setActive(true);
            instrument.setCreatedAt(Instant.now());
            return instrumentRepository.save(instrument);
        });
    }

    public Instrument ingestQuote(String symbol) {
        Instrument instrument = findInstrument(symbol);
        Instant startedAt = Instant.now();

        try {
            MarketQuote quote = providerRouter.fetchQuote(instrument.getSymbol(), instrument.getType());

            BigDecimal previous = instrument.getCurrentPrice();

            instrument.setPreviousClose(quote.previousClose() != null
                    && quote.previousClose().compareTo(BigDecimal.ZERO) > 0
                    ? quote.previousClose()
                    : previous);
            instrument.setCurrentPrice(quote.price());
            instrument.setDailyChangePercent(quote.changePercent() != null
                    ? NumberUtils.scale(quote.changePercent())
                    : NumberUtils.percentChange(quote.price(), previous));
            instrument.setLastUpdated(quote.timestamp() == null ? Instant.now() : quote.timestamp());
            instrument = instrumentRepository.save(instrument);

            upsertQuotePrice(instrument, quote);
            saveLog(quote.source(), instrument.getSymbol(), "QUOTE", "SUCCESS",
                    "Cotización actualizada correctamente.", 1, startedAt);

            return instrument;
        } catch (RuntimeException ex) {
            saveLog("Router", instrument.getSymbol(), "QUOTE", "ERROR", ex.getMessage(), 0, startedAt);
            throw ex;
        }
    }

    public int ingestHistory(String symbol, int days) {
        Instrument instrument = findInstrument(symbol);
        int requestedDays = days <= 0 ? historyDays : days;
        Instant startedAt = Instant.now();

        try {
            List<PricePoint> points = providerRouter.fetchHistory(instrument.getSymbol(),
                    instrument.getType(), requestedDays);

            for (PricePoint point : points) {
                upsertHistoryPrice(instrument, point, "Provider");
            }

            if (!points.isEmpty() && instrument.getCurrentPrice() == null) {
                PricePoint last = points.get(points.size() - 1);
                instrument.setCurrentPrice(last.close());
                instrument.setLastUpdated(last.date().atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
                instrumentRepository.save(instrument);
            }

            saveLog("Router", instrument.getSymbol(), "HISTORY", "SUCCESS",
                    "Histórico procesado correctamente.", points.size(), startedAt);

            return points.size();
        } catch (RuntimeException ex) {
            saveLog("Router", instrument.getSymbol(), "HISTORY", "ERROR", ex.getMessage(), 0, startedAt);
            throw ex;
        }
    }

    public void ingestAll() {
        List<Instrument> instruments = instrumentRepository.findByActiveTrue();

        for (Instrument instrument : instruments) {
            try {
                ingestQuote(instrument.getSymbol());

                if (priceHistoryRepository.countBySymbol(instrument.getSymbol()) == 0) {
                    ingestHistory(instrument.getSymbol(), historyDays);
                }
            } catch (Exception ex) {
                log.warn("No fue posible ingestar {}: {}", instrument.getSymbol(), ex.getMessage());
            }
        }
    }

    public Instrument findInstrument(String symbol) {
        return instrumentRepository.findBySymbolIgnoreCase(symbol.trim())
                .orElseThrow(() -> new NotFoundException("Instrumento no encontrado con símbolo " + symbol + "."));
    }

    private void upsertQuotePrice(Instrument instrument, MarketQuote quote) {
        LocalDate today = LocalDate.now();
        Optional<PriceHistory> existing = priceHistoryRepository.findBySymbolAndDate(instrument.getSymbol(), today);

        PriceHistory price = existing.orElseGet(() -> {
            PriceHistory created = new PriceHistory();
            created.setId(sequenceService.next("price_history"));
            created.setInstrumentId(instrument.getId());
            created.setSymbol(instrument.getSymbol());
            created.setDate(today);
            created.setOpen(quote.price());
            created.setHigh(quote.price());
            created.setLow(quote.price());
            created.setInterval("quote");
            created.setCreatedAt(Instant.now());
            return created;
        });

        if (existing.isPresent()) {
            price.setHigh(max(price.getHigh(), quote.price()));
            price.setLow(min(price.getLow(), quote.price()));
            price.setClose(quote.price());
        }

        price.setVolume(quote.volume());
        price.setSource(quote.source());
        priceHistoryRepository.save(price);
    }

    private void upsertHistoryPrice(Instrument instrument, PricePoint point, String source) {
        PriceHistory price = priceHistoryRepository
                .findBySymbolAndDate(instrument.getSymbol(), point.date())
                .orElseGet(() -> {
                    PriceHistory created = new PriceHistory();
                    created.setId(sequenceService.next("price_history"));
                    created.setInstrumentId(instrument.getId());
                    created.setSymbol(instrument.getSymbol());
                    created.setDate(point.date());
                    created.setInterval("1day");
                    created.setCreatedAt(Instant.now());
                    return created;
                });

        price.setOpen(point.open());
        price.setHigh(point.high());
        price.setLow(point.low());
        price.setClose(point.close());
        price.setVolume(point.volume());
        price.setSource(source);

        priceHistoryRepository.save(price);
    }

    private void saveLog(String provider, String symbol, String operation, String status,
                         String message, int records, Instant startedAt) {
        IngestionLog logEntry = new IngestionLog();
        logEntry.setId(sequenceService.next("ingestion_logs"));
        logEntry.setProvider(provider);
        logEntry.setSymbol(symbol);
        logEntry.setOperation(operation);
        logEntry.setStatus(status);
        logEntry.setMessage(message);
        logEntry.setRecordsProcessed(records);
        logEntry.setStartedAt(startedAt);
        logEntry.setFinishedAt(Instant.now());
        ingestionLogRepository.save(logEntry);
    }

    private BigDecimal max(BigDecimal first, BigDecimal second) {
        if (first == null) {
            return second;
        }
        return second == null ? first : first.max(second);
    }

    private BigDecimal min(BigDecimal first, BigDecimal second) {
        if (first == null) {
            return second;
        }
        return second == null ? first : first.min(second);
    }
}
