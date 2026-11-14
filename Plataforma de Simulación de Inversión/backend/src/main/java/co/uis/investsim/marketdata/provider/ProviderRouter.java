package co.uis.investsim.marketdata.provider;

import co.uis.investsim.common.exception.BusinessException;
import co.uis.investsim.marketdata.dto.MarketQuote;
import co.uis.investsim.marketdata.dto.PricePoint;
import co.uis.investsim.marketdata.entity.InstrumentType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.AnnotationAwareOrderComparator;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderRouter {
    private final List<MarketDataProvider> providers;

    public MarketQuote fetchQuote(String symbol, InstrumentType type) {
        Exception lastError = null;

        for (MarketDataProvider provider : orderedProviders()) {
            if (!provider.supports(type) || !provider.isConfigured()) {
                continue;
            }

            try {
                MarketQuote quote = provider.fetchQuote(symbol);
                if (quote != null) {
                    return quote;
                }
            } catch (Exception ex) {
                lastError = ex;
                log.warn("Proveedor {} falló al consultar cotización de {}: {}", provider.name(), symbol, ex.getMessage());
            }
        }

        throw new BusinessException("No fue posible obtener la cotización de " + symbol
                + " con los proveedores disponibles."
                + (lastError != null ? " Último error: " + lastError.getMessage() : ""));
    }

    public List<PricePoint> fetchHistory(String symbol, InstrumentType type, int days) {
        Exception lastError = null;

        for (MarketDataProvider provider : orderedProviders()) {
            if (!provider.supports(type) || !provider.isConfigured()) {
                continue;
            }

            try {
                List<PricePoint> history = provider.fetchHistory(symbol, days);
                if (history != null && !history.isEmpty()) {
                    return history;
                }
            } catch (Exception ex) {
                lastError = ex;
                log.warn("Proveedor {} falló al consultar histórico de {}: {}", provider.name(), symbol, ex.getMessage());
            }
        }

        throw new BusinessException("No fue posible obtener el histórico de " + symbol
                + " con los proveedores disponibles."
                + (lastError != null ? " Último error: " + lastError.getMessage() : ""));
    }

    public String activeQuoteProvider() {
        return orderedProviders().stream()
                .filter(MarketDataProvider::isConfigured)
                .map(MarketDataProvider::name)
                .findFirst()
                .orElse("Ninguno");
    }

    private List<MarketDataProvider> orderedProviders() {
        List<MarketDataProvider> ordered = new ArrayList<>(providers);
        AnnotationAwareOrderComparator.sort(ordered);
        return ordered;
    }
}
