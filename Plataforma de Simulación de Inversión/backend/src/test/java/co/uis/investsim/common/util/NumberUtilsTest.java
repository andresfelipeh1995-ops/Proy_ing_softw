package co.uis.investsim.common.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NumberUtilsTest {

    @Test
    void parsesDecimalAndIgnoresInvalidValues() {
        assertEquals(new BigDecimal("123.45"), NumberUtils.decimal("123.45"));
        assertEquals(BigDecimal.ZERO, NumberUtils.decimal("N/A"));
        assertEquals(BigDecimal.ZERO, NumberUtils.decimal(null));
    }

    @Test
    void calculatesPercentChange() {
        assertEquals(new BigDecimal("10.0000"),
                NumberUtils.percentChange(new BigDecimal("110"), new BigDecimal("100")));
        assertEquals(BigDecimal.ZERO,
                NumberUtils.percentChange(new BigDecimal("110"), BigDecimal.ZERO));
    }

    @Test
    void dividesSafely() {
        assertEquals(new BigDecimal("0.5000000000"),
                NumberUtils.safeDivide(BigDecimal.ONE, new BigDecimal("2")));
        assertEquals(BigDecimal.ZERO, NumberUtils.safeDivide(BigDecimal.ONE, BigDecimal.ZERO));
    }
}
