import { api } from "../api/apiClient";

export function listEducation(category) {
  return api.get("/education", {
    params: category ? { category } : {},
  });
}

export function getEducationBySlug(slug) {
  return api.get(`/education/${encodeURIComponent(slug)}`);
}

export function createEducation(data) {
  return api.post("/education", data);
}

export function updateEducation(id, data) {
  return api.put(`/education/${id}`, data);
}

export function deactivateEducation(id) {
  return api.patch(`/education/${id}`);
}
