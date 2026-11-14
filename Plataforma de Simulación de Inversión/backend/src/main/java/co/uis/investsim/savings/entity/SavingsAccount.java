package co.uis.investsim.savings.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "savings_accounts", indexes = {
        @Index(name = "idx_savings_user", columnList = "user_id")
})
public class SavingsAccount {
    @Id
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal principal;

    @Column(nullable = false, precision = 10, scale = 6)
    private BigDecimal annualInterestRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompoundingFrequency frequency;

    @Column(nullable = false)
    private Integer termMonths;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate maturityDate;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
