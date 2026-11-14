import { api } from "../api/apiClient";

export function registerUser(userData) {
  return api.post("/users", userData, { skipAuth: true });
}

export function getMyProfile() {
  return api.get("/users/me");
}

export function updateMyProfile(userData) {
  return api.put("/users/me", userData);
}

export function updateMyPassword(passwordData) {
  return api.patch("/users/me/password", passwordData);
}

export function deactivateMyAccount() {
  return api.patch("/users/me");
}

export function listUsers() {
  return api.get("/users");
}

export function getUserById(id) {
  return api.get(`/users/${id}`);
}

export function deactivateUser(id) {
  return api.patch(`/users/${id}`);
}
