package co.uis.investsim.savings.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class SavingsAccountDTO {
    private Long id;
    private String name;
    private BigDecimal principal;
    private BigDecimal annualInterestRate;
    private String frequency;
    private Integer termMonths;
    private LocalDate startDate;
    private LocalDate maturityDate;
    private BigDecimal projectedFinalAmount;
    private BigDecimal projectedInterest;
    private Boolean active;
}
