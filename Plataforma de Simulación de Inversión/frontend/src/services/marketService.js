import { api } from "../api/apiClient";

export function listInstruments(type) {
  return api.get("/market/instruments", {
    params: type ? { type } : {},
  });
}

export function getInstrument(symbol) {
  return api.get(`/market/instruments/${encodeURIComponent(symbol)}`);
}

export function getQuote(symbol) {
  return api.get(`/market/instruments/${encodeURIComponent(symbol)}/quote`);
}

export function getHistory(symbol, days = 180) {
  return api.get(`/market/instruments/${encodeURIComponent(symbol)}/history`, {
    params: { days },
  });
}

export function getProviders() {
  return api.get("/market/providers");
}

export function createInstrument(data) {
  return api.post("/market/instruments", data);
}

export function ingestInstrument(symbol) {
  return api.post(`/market/instruments/${encodeURIComponent(symbol)}/ingest`);
}

export function ingestAll() {
  return api.post("/market/ingest");
}

export function getIngestionLogs() {
  return api.get("/market/logs");
}
