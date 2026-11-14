package co.uis.investsim.marketdata.mapper;

import co.uis.investsim.marketdata.dto.PricePoint;
import co.uis.investsim.marketdata.dto.StooqCandle;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MarketDataMapperTest {
    private final MarketDataMapper mapper = new MarketDataMapper();

    @Test
    void parsesStooqCsv() {
        String csv = """
                Date,Open,High,Low,Close,Volume
                2026-01-02,100,110,99,105,1000000
                2026-01-03,105,112,104,110,1200000
                2026-01-04,N/D,N/D,N/D,N/D,N/D
                """;

        List<StooqCandle> candles = mapper.parseStooq(csv);

        assertEquals(2, candles.size());
        assertEquals(LocalDate.of(2026, 1, 2), candles.get(0).date());
        assertEquals(new BigDecimal("105"), candles.get(0).close());
        assertEquals(1000000L, candles.get(0).volume());
    }

    @Test
    void convertsCandlesToPricePoints() {
        List<PricePoint> points = mapper.toPricePoints(List.of(
                new StooqCandle(LocalDate.of(2026, 1, 2), new BigDecimal("100"), new BigDecimal("110"),
                        new BigDecimal("99"), new BigDecimal("105"), 1000L)));

        assertEquals(1, points.size());
        assertEquals(new BigDecimal("105"), points.get(0).close());
        assertTrue(points.get(0).date().isBefore(LocalDate.now()));
    }
}
