package co.uis.investsim.trading.controller;

import co.uis.investsim.common.api.ApiResponse;
import co.uis.investsim.common.api.ResponseBuilder;
import co.uis.investsim.trading.dto.TradeRequestDTO;
import co.uis.investsim.trading.dto.TradeTransactionDTO;
import co.uis.investsim.trading.service.TradingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/trading")
@RequiredArgsConstructor
public class TradingController {
    private final TradingService tradingService;

    @PostMapping("/buy")
    public ResponseEntity<ApiResponse<TradeTransactionDTO>> buy(@Valid @RequestBody TradeRequestDTO in,
                                                                Principal principal) {
        return ResponseBuilder.created("Compra simulada ejecutada correctamente.",
                tradingService.buy(principal.getName(), in));
    }

    @PostMapping("/sell")
    public ResponseEntity<ApiResponse<TradeTransactionDTO>> sell(@Valid @RequestBody TradeRequestDTO in,
                                                                 Principal principal) {
        return ResponseBuilder.created("Venta simulada ejecutada correctamente.",
                tradingService.sell(principal.getName(), in));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<TradeTransactionDTO>>> list(Principal principal) {
        return ResponseBuilder.ok("OK", tradingService.listByUser(principal.getName()));
    }

    @GetMapping("/transactions/portfolio/{portfolioId}")
    public ResponseEntity<ApiResponse<List<TradeTransactionDTO>>> listByPortfolio(
            @PathVariable Long portfolioId, Principal principal) {
        return ResponseBuilder.ok("OK", tradingService.listByPortfolio(portfolioId, principal.getName()));
    }
}
