package co.uis.investsim.scenario.controller;

import co.uis.investsim.common.api.ApiResponse;
import co.uis.investsim.common.api.ResponseBuilder;
import co.uis.investsim.scenario.dto.ScenarioRequestDTO;
import co.uis.investsim.scenario.dto.ScenarioResultDTO;
import co.uis.investsim.scenario.entity.MarketScenario;
import co.uis.investsim.scenario.service.ScenarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
public class ScenarioController {
    private final ScenarioService scenarioService;

    @PostMapping("/simulate")
    public ResponseEntity<ApiResponse<ScenarioResultDTO>> simulate(@Valid @RequestBody ScenarioRequestDTO in,
                                                                   Principal principal) {
        return ResponseBuilder.ok("Escenario simulado correctamente.",
                scenarioService.simulate(principal.getName(), in));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MarketScenario>>> list(Principal principal) {
        return ResponseBuilder.ok("OK", scenarioService.list(principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Principal principal) {
        scenarioService.delete(id, principal.getName());
        return ResponseBuilder.ok("Se ha eliminado correctamente el escenario.");
    }
}
