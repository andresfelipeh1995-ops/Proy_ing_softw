package co.uis.investsim.education.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class EducationalContentRequestDTO {
    @NotBlank(message = "El título es obligatorio.")
    @Size(max = 160, message = "El título debe tener máximo 160 caracteres.")
    private String title;

    @NotBlank(message = "El slug es obligatorio.")
    @Size(max = 160, message = "El slug debe tener máximo 160 caracteres.")
    private String slug;

    @NotBlank(message = "La categoría es obligatoria.")
    @Size(max = 80, message = "La categoría debe tener máximo 80 caracteres.")
    private String category;

    @NotBlank(message = "El resumen es obligatorio.")
    @Size(max = 400, message = "El resumen debe tener máximo 400 caracteres.")
    private String summary;

    @NotBlank(message = "El contenido es obligatorio.")
    private String content;

    private String level = "BASICO";

    private Integer displayOrder = 0;
}
