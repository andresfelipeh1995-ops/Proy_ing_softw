import { api } from "../api/apiClient";

export function buy({ portfolioId, symbol, quantity }) {
  return api.post("/trading/buy", {
    portfolioId,
    symbol,
    type: "BUY",
    quantity,
  });
}

export function sell({ portfolioId, symbol, quantity }) {
  return api.post("/trading/sell", {
    portfolioId,
    symbol,
    type: "SELL",
    quantity,
  });
}

export function listTransactions() {
  return api.get("/trading/transactions");
}

export function listTransactionsByPortfolio(portfolioId) {
  return api.get(`/trading/transactions/portfolio/${portfolioId}`);
}
