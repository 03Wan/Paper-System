import { apiGet, apiPost } from "./request";

async function postWithFallback(primaryPath, fallbackPath, payload) {
  try {
    return await apiPost(primaryPath, payload);
  } catch (error) {
    if (Number(error?.response?.status) === 404 && fallbackPath) {
      return apiPost(fallbackPath, payload);
    }
    throw error;
  }
}

export function loginApi(payload) {
  return postWithFallback("/session/login", "/auth/login", payload);
}

export function getSessionApi() {
  return apiGet("/session/me");
}

export function logoutApi() {
  return apiPost("/session/logout");
}
