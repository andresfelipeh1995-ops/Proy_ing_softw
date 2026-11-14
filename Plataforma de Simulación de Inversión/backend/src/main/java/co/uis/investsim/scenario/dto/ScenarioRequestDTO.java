package co.uis.investsim.scenario.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@NoArgsConstructor
@Getter
@Setter
public class ScenarioRequestDTO {
    @NotNull(message = "El portafolio es obligatorio.")
    private Long portfolioId;

    @Size(max = 120, message = "El nombre debe tener máximo 120 caracteres.")
    private String name;

    @Size(max = 300, message = "La descripción debe tener máximo 300 caracteres.")
    private String description;

    @NotNull(message = "El choque de mercado es obligatorio.")
    @DecimalMin(value = "-100.0", message = "El choque de mercado no puede ser menor a -100%.")
    @DecimalMax(value = "500.0", message = "El choque de mercado no puede ser mayor a 500%.")
    private BigDecimal marketShockPercent;

    @DecimalMin(value = "-1.0", message = "El cambio de tasa no puede ser menor a -100%.")
    @DecimalMax(value = "1.0", message = "El cambio de tasa no puede ser mayor a 100%.")
    private BigDecimal interestRateDelta = BigDecimal.ZERO;

    @NotNull(message = "El multiplicador de volatilidad es obligatorio.")
    @DecimalMin(value = "0.0", message = "El multiplicador de volatilidad no puede ser negativo.")
    @DecimalMax(value = "10.0", message = "El multiplicador de volatilidad no puede superar 10.")
    private BigDecimal volatilityMultiplier = BigDecimal.ONE;

    @Min(value = 1, message = "La duración mínima es de 1 día.")
    @Max(value = 3650, message = "La duración máxima es de 3650 días.")
    private Integer durationDays = 30;

    private Boolean save = false;
}
