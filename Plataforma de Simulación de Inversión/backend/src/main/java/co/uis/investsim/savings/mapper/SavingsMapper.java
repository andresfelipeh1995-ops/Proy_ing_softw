package co.uis.investsim.savings.mapper;

import co.uis.investsim.common.util.FinancialMath;
import co.uis.investsim.savings.dto.SavingsAccountDTO;
import co.uis.investsim.savings.dto.SavingsCreateDTO;
import co.uis.investsim.savings.dto.SavingsProjectionDTO;
import co.uis.investsim.savings.entity.CompoundingFrequency;
import co.uis.investsim.savings.entity.SavingsAccount;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class SavingsMapper {

    public SavingsAccountDTO toDto(SavingsAccount entity) {
        BigDecimal finalAmount = finalAmount(entity.getPrincipal(), entity.getAnnualInterestRate(),
                entity.getFrequency(), entity.getTermMonths());

        return new SavingsAccountDTO(
                entity.getId(),
                entity.getName(),
                entity.getPrincipal(),
                entity.getAnnualInterestRate(),
                entity.getFrequency() == null ? null : entity.getFrequency().name(),
                entity.getTermMonths(),
                entity.getStartDate(),
                entity.getMaturityDate(),
                finalAmount,
                finalAmount.subtract(entity.getPrincipal()).setScale(2, RoundingMode.HALF_UP),
                entity.getActive()
        );
    }

    public SavingsProjectionDTO toProjection(SavingsCreateDTO dto) {
        BigDecimal finalAmount = finalAmount(dto.getPrincipal(), dto.getAnnualInterestRate(),
                dto.getFrequency(), dto.getTermMonths());
        BigDecimal effectiveAnnualRate = effectiveAnnualRate(dto.getAnnualInterestRate(), dto.getFrequency());

        return new SavingsProjectionDTO(
                dto.getPrincipal(),
                dto.getAnnualInterestRate(),
                dto.getFrequency().name(),
                dto.getTermMonths(),
                finalAmount,
                finalAmount.subtract(dto.getPrincipal()).setScale(2, RoundingMode.HALF_UP),
                effectiveAnnualRate
        );
    }

    public BigDecimal finalAmount(BigDecimal principal, BigDecimal rate, CompoundingFrequency frequency,
                                  Integer months) {
        int periods = frequency == null ? 12 : frequency.getPeriodsPerYear();
        double years = (months == null ? 0 : months) / 12.0;
        return FinancialMath.compoundAmount(principal, rate, periods, years);
    }

    private BigDecimal effectiveAnnualRate(BigDecimal rate, CompoundingFrequency frequency) {
        int periods = frequency == null ? 12 : frequency.getPeriodsPerYear();
        double nominal = rate == null ? 0d : rate.doubleValue();
        double effective = Math.pow(1 + nominal / periods, periods) - 1;
        return BigDecimal.valueOf(effective * 100).setScale(4, RoundingMode.HALF_UP);
    }
}
