package co.uis.investsim.savings.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class SavingsProjectionDTO {
    private BigDecimal principal;
    private BigDecimal annualInterestRate;
    private String frequency;
    private Integer months;
    private BigDecimal finalAmount;
    private BigDecimal interestEarned;
    private BigDecimal effectiveAnnualRate;
}
