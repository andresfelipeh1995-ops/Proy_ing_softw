package co.uis.investsim.scenario.entity;

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

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "scenarios", indexes = {
        @Index(name = "idx_scenario_user", columnList = "user_id")
})
public class MarketScenario {
    @Id
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(length = 120)
    private String name;

    @Column(length = 300)
    private String description;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal marketShockPercent;

    @Column(precision = 10, scale = 4)
    private BigDecimal interestRateDelta;

    @Column(precision = 10, scale = 4)
    private BigDecimal volatilityMultiplier;

    private Integer durationDays;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
