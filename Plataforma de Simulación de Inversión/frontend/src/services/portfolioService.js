import { api } from "../api/apiClient";

export function listPortfolios() {
  return api.get("/portfolios");
}

export function getPortfolio(id) {
  return api.get(`/portfolios/${id}`);
}

export function getPortfolioSummary(id) {
  return api.get(`/portfolios/${id}/summary`);
}

export function createPortfolio(data) {
  return api.post("/portfolios", data);
}

export function updatePortfolio(id, data) {
  return api.put(`/portfolios/${id}`, data);
}

export function deactivatePortfolio(id) {
  return api.patch(`/portfolios/${id}`);
}
