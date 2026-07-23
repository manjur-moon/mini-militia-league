import axios from "axios";
import { clientEnv } from "./env.js";

export function normalizeApiBaseUrl(value) {
  const url = new URL(value);
  const normalizedPath = url.pathname.replace(/\/+$/, "");

  if (normalizedPath.endsWith("/api/v1")) {
    url.pathname = normalizedPath.slice(0, -"/api/v1".length) || "/";
  } else {
    url.pathname = normalizedPath || "/";
  }

  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

export const httpClient = axios.create({
  baseURL: normalizeApiBaseUrl(clientEnv.VITE_API_BASE_URL),
  withCredentials: true,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = {
      status: error.response?.status ?? 0,
      message:
        error.response?.data?.message ??
        error.message ??
        "Unable to complete the request.",
      errors: error.response?.data?.errors ?? [],
      requestId: error.response?.data?.requestId,
      originalError: error,
    };

    return Promise.reject(normalizedError);
  },
);
