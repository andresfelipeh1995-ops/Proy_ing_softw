package co.uis.investsim.analytics.controller;

import co.uis.investsim.analytics.dto.InstrumentAnalyticsDTO;
import co.uis.investsim.analytics.dto.PortfolioAnalyticsDTO;
import co.uis.investsim.analytics.service.AnalyticsService;
import co.uis.investsim.common.api.ApiResponse;
import co.uis.investsim.common.api.ResponseBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    @GetMapping("/portfolios/{portfolioId}")
    public ResponseEntity<ApiResponse<PortfolioAnalyticsDTO>> portfolioAnalytics(
            @PathVariable Long portfolioId,
            @RequestParam(defaultValue = "180") int days,
            Principal principal) {
        return ResponseBuilder.ok("OK",
                analyticsService.portfolioAnalytics(principal.getName(), portfolioId, days));
    }

    @GetMapping("/instruments/{symbol}")
    public ResponseEntity<ApiResponse<InstrumentAnalyticsDTO>> instrumentAnalytics(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "180") int days) {
        return ResponseBuilder.ok("OK", analyticsService.instrumentAnalytics(symbol, days));
    }
}
