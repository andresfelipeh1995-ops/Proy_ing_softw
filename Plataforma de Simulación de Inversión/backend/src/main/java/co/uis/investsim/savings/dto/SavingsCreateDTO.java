package co.uis.investsim.savings.dto;

import co.uis.investsim.savings.entity.CompoundingFrequency;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@NoArgsConstructor
@Getter
@Setter
public class SavingsCreateDTO {
    @NotBlank(message = "El nombre de la cuenta es obligatorio.")
    @Size(max = 100, message = "El nombre debe tener máximo 100 caracteres.")
    private String name;

    @NotNull(message = "El capital inicial es obligatorio.")
    @DecimalMin(value = "0.01", message = "El capital inicial debe ser mayor que cero.")
    private BigDecimal principal;

    @NotNull(message = "La tasa de interés anual es obligatoria.")
    @DecimalMin(value = "0.0", message = "La tasa no puede ser negativa.")
    @DecimalMax(value = "1.0", message = "La tasa debe expresarse en decimales (máximo 1.0 = 100%).")
    private BigDecimal annualInterestRate;

    @NotNull(message = "La frecuencia de capitalización es obligatoria.")
    private CompoundingFrequency frequency;

    @NotNull(message = "El plazo en meses es obligatorio.")
    @Min(value = 1, message = "El plazo mínimo es de 1 mes.")
    @Max(value = 600, message = "El plazo máximo es de 600 meses.")
    private Integer termMonths;
}
