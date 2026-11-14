package co.uis.investsim.marketdata.dto;

import co.uis.investsim.marketdata.entity.InstrumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
public class InstrumentCreateDTO {
    @NotBlank(message = "El símbolo es obligatorio.")
    @Size(max = 20, message = "El símbolo debe tener máximo 20 caracteres.")
    private String symbol;

    @NotBlank(message = "El nombre es obligatorio.")
    @Size(max = 120, message = "El nombre debe tener máximo 120 caracteres.")
    private String name;

    @NotNull(message = "El tipo de instrumento es obligatorio.")
    private InstrumentType type;

    private String currency = "USD";

    private String exchange;
}
