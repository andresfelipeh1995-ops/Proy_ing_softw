package co.uis.investsim.marketdata.service;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.common.exception.NotFoundException;
import co.uis.investsim.common.util.NumberUtils;
import co.uis.investsim.marketdata.dto.IngestionLogDTO;
import co.uis.investsim.marketdata.dto.InstrumentCreateDTO;
import co.uis.investsim.marketdata.dto.InstrumentDTO;
import co.uis.investsim.marketdata.dto.MarketQuote;
import co.uis.investsim.marketdata.dto.PriceHistoryDTO;
import co.uis.investsim.marketdata.entity.Instrument;
import co.uis.investsim.marketdata.entity.InstrumentType;
import co.uis.investsim.marketdata.entity.PriceHistory;
import co.uis.investsim.marketdata.ingestion.PriceIngestionService;
import co.uis.investsim.marketdata.mapper.MarketDataMapper;
import co.uis.investsim.marketdata.repository.IngestionLogRepository;
import co.uis.investsim.marketdata.repository.InstrumentRepository;
import co.uis.investsim.marketdata.repository.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketDataService {
    private final InstrumentRepository instrumentRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final IngestionLogRepository ingestionLogRepository;
    private final PriceIngestionService priceIngestionService;
    private final MarketDataMapper mapper;

    @Value("${ingestion.history-days:365}")
    private int defaultHistoryDays;

    @Cacheable(value = "marketInstruments", key = "#p0 == null ? 'ALL' : #p0.name()")
    public List<InstrumentDTO> listInstruments(InstrumentType type) {
        List<Instrument> instruments = type == null
                ? instrumentRepository.findByActiveTrue()
                : instrumentRepository.findByTypeAndActiveTrue(type);

        return instruments.stream().map(mapper::toDto).toList();
    }

    public InstrumentDTO getInstrument(String symbol) {
        return mapper.toDto(findInstrument(symbol));
    }

    public MarketQuote getQuote(String symbol) {
        Instrument instrument = findInstrument(symbol);

        boolean stale = instrument.getCurrentPrice() == null
                || instrument.getLastUpdated() == null
                || instrument.getLastUpdated().isBefore(Instant.now().minus(15, ChronoUnit.MINUTES));

        if (stale) {
            try {
                instrument = priceIngestionService.ingestQuote(instrument.getSymbol());
            } catch (Exception ex) {
                log.warn("No fue posible actualizar la cotización de {}: {}", symbol, ex.getMessage());
            }
        }

        if (instrument.getCurrentPrice() == null) {
            throw new BusinessException("No hay una cotización disponible para " + symbol
                    + ". Configure un proveedor de datos de mercado o ejecute una ingesta manual.");
        }

        return new MarketQuote(
                instrument.getSymbol(),
                instrument.getCurrentPrice(),
                instrument.getPreviousClose(),
                instrument.getDailyChangePercent(),
                null,
                instrument.getCurrency(),
                "InvestSim",
                instrument.getLastUpdated()
        );
    }

    public List<PriceHistoryDTO> getHistory(String symbol, int days) {
        Instrument instrument = findInstrument(symbol);
        int requestedDays = days <= 0 ? defaultHistoryDays : days;
        LocalDate from = LocalDate.now().minusDays(requestedDays);

        List<PriceHistory> history = priceHistoryRepository
                .findBySymbolAndDateAfterOrderByDateAsc(instrument.getSymbol(), from);

        if (history.isEmpty()) {
            try {
                priceIngestionService.ingestHistory(instrument.getSymbol(), requestedDays);
                history = priceHistoryRepository
                        .findBySymbolAndDateAfterOrderByDateAsc(instrument.getSymbol(), from);
            } catch (Exception ex) {
                log.warn("No fue posible cargar el histórico de {}: {}", symbol, ex.getMessage());
            }
        }

        return history.stream().map(mapper::toDto).toList();
    }

    @CacheEvict(value = "marketInstruments", allEntries = true)
    public InstrumentDTO createInstrument(InstrumentCreateDTO dto) {
        Instrument instrument = priceIngestionService.registerInstrument(dto.getSymbol(), dto.getType(), dto.getName());
        instrument.setCurrency(dto.getCurrency() == null || dto.getCurrency().isBlank() ? "USD" : dto.getCurrency());
        instrument.setExchange(dto.getExchange());
        return mapper.toDto(instrumentRepository.save(instrument));
    }

    @CacheEvict(value = "marketInstruments", allEntries = true)
    public InstrumentDTO ingestQuoteFor(String symbol) {
        return mapper.toDto(priceIngestionService.ingestQuote(symbol));
    }

    public int ingestHistoryFor(String symbol, int days) {
        return priceIngestionService.ingestHistory(symbol, days);
    }

    public void ingestAll() {
        priceIngestionService.ingestAll();
    }

    public List<IngestionLogDTO> recentLogs() {
        return ingestionLogRepository.findTop50ByOrderByStartedAtDesc().stream()
                .map(mapper::toDto)
                .toList();
    }

    public List<Instrument> findActiveInstrumentEntities() {
        return instrumentRepository.findByActiveTrue();
    }

    public Instrument findInstrument(String symbol) {
        return instrumentRepository.findBySymbolIgnoreCase(symbol.trim())
                .orElseThrow(() -> new NotFoundException("Instrumento no encontrado con símbolo " + symbol + "."));
    }

    public BigDecimal currentPriceOrZero(Instrument instrument) {
        return instrument.getCurrentPrice() == null ? NumberUtils.scale(BigDecimal.ZERO)
                : instrument.getCurrentPrice();
    }
}
