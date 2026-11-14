package co.uis.investsim.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class NumberUtils {
    private NumberUtils() {
    }

    public static BigDecimal decimal(Object value) {
        return decimal(value, BigDecimal.ZERO);
    }

    public static BigDecimal decimal(Object value, BigDecimal defaultValue) {
        if (value == null) {
            return defaultValue;
        }

        String text = String.valueOf(value).trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text) || "N/A".equalsIgnoreCase(text)) {
            return defaultValue;
        }

        try {
            return new BigDecimal(text.replace(",", ""));
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    public static long longValue(Object value) {
        BigDecimal number = decimal(value);
        return number.longValue();
    }

    public static BigDecimal percentChange(BigDecimal current, BigDecimal previous) {
        if (current == null || previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return current.subtract(previous)
                .divide(previous, 10, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(4, RoundingMode.HALF_UP);
    }

    public static BigDecimal safeDivide(BigDecimal numerator, BigDecimal denominator) {
        if (numerator == null || denominator == null || denominator.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return numerator.divide(denominator, 10, RoundingMode.HALF_UP);
    }

    public static BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(4, RoundingMode.HALF_UP);
    }
}
