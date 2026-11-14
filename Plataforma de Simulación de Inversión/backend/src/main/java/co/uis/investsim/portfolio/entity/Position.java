package co.uis.investsim.portfolio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "positions",
        uniqueConstraints = @UniqueConstraint(name = "uk_position_portfolio_symbol",
                columnNames = {"portfolio_id", "symbol"}),
        indexes = @Index(name = "idx_position_portfolio", columnList = "portfolio_id"))
public class Position {
    @Id
    private Long id;

    @Column(nullable = false)
    private Long portfolioId;

    private Long instrumentId;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal averageCost = BigDecimal.ZERO;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
