package co.uis.investsim.marketdata.controller;

import co.uis.investsim.common.api.ApiResponse;
import co.uis.investsim.common.api.ResponseBuilder;
import co.uis.investsim.marketdata.dto.IngestionLogDTO;
import co.uis.investsim.marketdata.dto.InstrumentCreateDTO;
import co.uis.investsim.marketdata.dto.InstrumentDTO;
import co.uis.investsim.marketdata.dto.MarketQuote;
import co.uis.investsim.marketdata.dto.PriceHistoryDTO;
import co.uis.investsim.marketdata.entity.InstrumentType;
import co.uis.investsim.marketdata.provider.ProviderRouter;
import co.uis.investsim.marketdata.service.MarketDataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketDataController {
    private final MarketDataService marketDataService;
    private final ProviderRouter providerRouter;

    @GetMapping("/instruments")
    public ResponseEntity<ApiResponse<List<InstrumentDTO>>> listInstruments(
            @RequestParam(required = false) InstrumentType type) {
        return ResponseBuilder.ok("OK", marketDataService.listInstruments(type));
    }

    @GetMapping("/instruments/{symbol}")
    public ResponseEntity<ApiResponse<InstrumentDTO>> getInstrument(@PathVariable String symbol) {
        return ResponseBuilder.ok("OK", marketDataService.getInstrument(symbol));
    }

    @GetMapping("/instruments/{symbol}/quote")
    public ResponseEntity<ApiResponse<MarketQuote>> getQuote(@PathVariable String symbol) {
        return ResponseBuilder.ok("OK", marketDataService.getQuote(symbol));
    }

    @GetMapping("/instruments/{symbol}/history")
    public ResponseEntity<ApiResponse<List<PriceHistoryDTO>>> getHistory(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "180") int days) {
        return ResponseBuilder.ok("OK", marketDataService.getHistory(symbol, days));
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Map<String, String>>> providers() {
        return ResponseBuilder.ok("OK", Map.of("activeQuoteProvider", providerRouter.activeQuoteProvider()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/instruments")
    public ResponseEntity<ApiResponse<InstrumentDTO>> createInstrument(
            @Valid @RequestBody InstrumentCreateDTO in) {
        return ResponseBuilder.created("Se ha registrado el instrumento.", marketDataService.createInstrument(in));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/instruments/{symbol}/ingest")
    public ResponseEntity<ApiResponse<InstrumentDTO>> ingestInstrument(@PathVariable String symbol) {
        return ResponseBuilder.ok("Se ha actualizado el instrumento.", marketDataService.ingestQuoteFor(symbol));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/ingest")
    public ResponseEntity<ApiResponse<Void>> ingestAll() {
        marketDataService.ingestAll();
        return ResponseBuilder.ok("Ingesta de datos de mercado ejecutada.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<IngestionLogDTO>>> logs() {
        return ResponseBuilder.ok("OK", marketDataService.recentLogs());
    }
}
