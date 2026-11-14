package co.uis.investsim.common.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FinancialMathTest {

    @Test
    void calculatesCompoundAmount() {
        BigDecimal result = FinancialMath.compoundAmount(
                new BigDecimal("1000"), new BigDecimal("0.08"), 12, 1.0);

        assertEquals(new BigDecimal("1083.00"), result);
    }

    @Test
    void returnsPrincipalWhenNoTime() {
        BigDecimal result = FinancialMath.compoundAmount(
                new BigDecimal("500"), new BigDecimal("0.10"), 12, 0.0);

        assertEquals(new BigDecimal("500"), result);
    }
}
