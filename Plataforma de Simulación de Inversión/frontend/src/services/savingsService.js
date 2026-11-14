import { api } from "../api/apiClient";

export function listSavings() {
  return api.get("/savings");
}

export function getSavingsAccount(id) {
  return api.get(`/savings/${id}`);
}

export function createSavingsAccount(data) {
  return api.post("/savings", data);
}

export function simulateSavings(data) {
  return api.post("/savings/simulate", data);
}

export function closeSavingsAccount(id) {
  return api.patch(`/savings/${id}/close`);
}
