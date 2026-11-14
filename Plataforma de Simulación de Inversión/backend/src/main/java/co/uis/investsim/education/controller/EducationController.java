package co.uis.investsim.education.controller;

import co.uis.investsim.common.api.ApiResponse;
import co.uis.investsim.common.api.ResponseBuilder;
import co.uis.investsim.education.dto.EducationalContentDTO;
import co.uis.investsim.education.dto.EducationalContentRequestDTO;
import co.uis.investsim.education.service.EducationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/education")
@RequiredArgsConstructor
public class EducationController {
    private final EducationService educationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EducationalContentDTO>>> list(
            @RequestParam(required = false) String category) {
        return ResponseBuilder.ok("OK", educationService.list(category));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<EducationalContentDTO>> getBySlug(@PathVariable String slug) {
        return ResponseBuilder.ok("OK", educationService.getBySlug(slug));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<EducationalContentDTO>> create(
            @Valid @RequestBody EducationalContentRequestDTO in) {
        return ResponseBuilder.created("Contenido educativo creado.", educationService.create(in));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EducationalContentDTO>> update(
            @PathVariable Long id, @Valid @RequestBody EducationalContentRequestDTO in) {
        return ResponseBuilder.ok("Contenido educativo actualizado.", educationService.update(id, in));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        educationService.deactivate(id);
        return ResponseBuilder.ok("Contenido educativo desactivado.");
    }
}
