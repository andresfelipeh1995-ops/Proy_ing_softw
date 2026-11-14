package co.uis.investsim.portfolio.controller;

import co.uis.investsim.common.api.ApiResponse;
import co.uis.investsim.common.api.ResponseBuilder;
import co.uis.investsim.portfolio.dto.PortfolioCreateDTO;
import co.uis.investsim.portfolio.dto.PortfolioDTO;
import co.uis.investsim.portfolio.dto.PortfolioSummaryDTO;
import co.uis.investsim.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {
    private final PortfolioService portfolioService;

    @PostMapping
    public ResponseEntity<ApiResponse<PortfolioDTO>> create(@Valid @RequestBody PortfolioCreateDTO in,
                                                            Principal principal) {
        return ResponseBuilder.created("Se ha creado correctamente el portafolio.",
                portfolioService.create(principal.getName(), in));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PortfolioDTO>>> list(Principal principal) {
        return ResponseBuilder.ok("OK", portfolioService.list(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PortfolioDTO>> get(@PathVariable Long id, Principal principal) {
        return ResponseBuilder.ok("OK", portfolioService.get(id, principal.getName()));
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<ApiResponse<PortfolioSummaryDTO>> summary(@PathVariable Long id, Principal principal) {
        return ResponseBuilder.ok("OK", portfolioService.summary(id, principal.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PortfolioDTO>> update(@PathVariable Long id,
                                                            @Valid @RequestBody PortfolioCreateDTO in,
                                                            Principal principal) {
        return ResponseBuilder.ok("Se ha actualizado correctamente el portafolio.",
                portfolioService.update(id, principal.getName(), in));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id, Principal principal) {
        portfolioService.deactivate(id, principal.getName());
        return ResponseBuilder.ok("Se ha desactivado correctamente el portafolio.");
    }
}
