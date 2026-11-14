package co.uis.investsim.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class FinancialMath {
    private FinancialMath() {
    }

    public static BigDecimal compoundAmount(BigDecimal principal, BigDecimal annualRate,
                                            int compoundsPerYear, double years) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || years <= 0) {
            return principal == null ? BigDecimal.ZERO : principal;
        }

        double rate = annualRate == null ? 0d : annualRate.doubleValue();
        int periods = Math.max(compoundsPerYear, 1);
        double amount = principal.doubleValue() * Math.pow(1 + rate / periods, periods * years);

        return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal annualizedVolatility(double standardDeviation) {
        return BigDecimal.valueOf(standardDeviation * Math.sqrt(252) * 100)
                .setScale(4, RoundingMode.HALF_UP);
    }
}
