import { api } from "../api/apiClient";

export function simulateScenario(data) {
  return api.post("/scenarios/simulate", data);
}

export function listScenarios() {
  return api.get("/scenarios");
}

export function deleteScenario(id) {
  return api.delete(`/scenarios/${id}`);
}
