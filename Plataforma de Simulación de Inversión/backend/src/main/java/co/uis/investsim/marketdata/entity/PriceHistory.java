package co.uis.investsim.marketdata.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "price_history", indexes = {
        @Index(name = "idx_price_symbol_date", columnList = "symbol, price_date")
})
public class PriceHistory {
    @Id
    private Long id;

    private Long instrumentId;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(name = "price_date", nullable = false)
    private LocalDate date;

    @Column(precision = 19, scale = 4)
    private BigDecimal open;

    @Column(precision = 19, scale = 4)
    private BigDecimal high;

    @Column(precision = 19, scale = 4)
    private BigDecimal low;

    @Column(precision = 19, scale = 4)
    private BigDecimal close;

    private Long volume;

    @Column(length = 40)
    private String source;

    @Column(name = "price_interval", length = 20)
    private String interval = "1day";

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
