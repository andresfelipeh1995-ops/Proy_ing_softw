package co.uis.investsim.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class PortfolioCreateDTO {
    @NotBlank(message = "El nombre del portafolio es obligatorio.")
    @Size(max = 100, message = "El nombre debe tener máximo 100 caracteres.")
    private String name;

    @Size(max = 300, message = "La descripción debe tener máximo 300 caracteres.")
    private String description;
}
