import { api } from "../api/apiClient";

export function getPortfolioAnalytics(portfolioId, days = 180) {
  return api.get(`/analytics/portfolios/${portfolioId}`, {
    params: { days },
  });
}

export function getInstrumentAnalytics(symbol, days = 180) {
  return api.get(`/analytics/instruments/${encodeURIComponent(symbol)}`, {
    params: { days },
  });
}
