package co.uis.investsim.marketdata.provider;

import co.uis.investsim.marketdata.dto.MarketQuote;
import co.uis.investsim.marketdata.dto.PricePoint;
import co.uis.investsim.marketdata.entity.InstrumentType;

import java.util.List;

public interface MarketDataProvider {

    String name();

    boolean supports(InstrumentType type);

    boolean isConfigured();

    MarketQuote fetchQuote(String symbol);

    List<PricePoint> fetchHistory(String symbol, int days);
}
