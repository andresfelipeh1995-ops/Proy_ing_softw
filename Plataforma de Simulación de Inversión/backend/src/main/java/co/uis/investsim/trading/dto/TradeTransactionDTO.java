package co.uis.investsim.trading.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TradeTransactionDTO {
    private Long id;
    private Long portfolioId;
    private String symbol;
    private String type;
    private BigDecimal quantity;
    private BigDecimal price;
    private BigDecimal total;
    private String status;
    private Instant executedAt;
}
