package co.uis.investsim.savings.controller;

import co.uis.investsim.common.api.ApiResponse;
import co.uis.investsim.common.api.ResponseBuilder;
import co.uis.investsim.savings.dto.SavingsAccountDTO;
import co.uis.investsim.savings.dto.SavingsCreateDTO;
import co.uis.investsim.savings.dto.SavingsProjectionDTO;
import co.uis.investsim.savings.service.SavingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/savings")
@RequiredArgsConstructor
public class SavingsController {
    private final SavingsService savingsService;

    @PostMapping
    public ResponseEntity<ApiResponse<SavingsAccountDTO>> create(@Valid @RequestBody SavingsCreateDTO in,
                                                                 Principal principal) {
        return ResponseBuilder.created("Se ha abierto la cuenta de ahorro.",
                savingsService.create(principal.getName(), in));
    }

    @PostMapping("/simulate")
    public ResponseEntity<ApiResponse<SavingsProjectionDTO>> simulate(@Valid @RequestBody SavingsCreateDTO in) {
        return ResponseBuilder.ok("Proyección calculada correctamente.", savingsService.simulate(in));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavingsAccountDTO>>> list(Principal principal) {
        return ResponseBuilder.ok("OK", savingsService.list(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SavingsAccountDTO>> get(@PathVariable Long id, Principal principal) {
        return ResponseBuilder.ok("OK", savingsService.get(id, principal.getName()));
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<SavingsAccountDTO>> close(@PathVariable Long id, Principal principal) {
        return ResponseBuilder.ok("Se ha cerrado la cuenta de ahorro.",
                savingsService.close(id, principal.getName()));
    }
}
