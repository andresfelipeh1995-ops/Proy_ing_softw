package co.uis.investsim.trading.dto;

import co.uis.investsim.trading.entity.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@NoArgsConstructor
@Getter
@Setter
public class TradeRequestDTO {
    @NotNull(message = "El portafolio es obligatorio.")
    private Long portfolioId;

    @NotBlank(message = "El símbolo del instrumento es obligatorio.")
    private String symbol;

    @NotNull(message = "El tipo de operación es obligatorio.")
    private TransactionType type;

    @NotNull(message = "La cantidad es obligatoria.")
    @DecimalMin(value = "0.0001", message = "La cantidad debe ser mayor que cero.")
    @Digits(integer = 12, fraction = 4, message = "La cantidad tiene un formato inválido.")
    private BigDecimal quantity;
}
