import { httpClient } from "@/lib/http-client.js";

export async function getCurrentMvp(params = {}) {
  const response = await httpClient.get("/api/v1/mvp/current", { params });
  return response.data;
}

export async function getMvpAwards(params = {}) {
  const response = await httpClient.get("/api/v1/mvp/awards", { params });
  return response.data;
}

export async function getActiveMvpConfig() {
  const response = await httpClient.get("/api/v1/mvp/config");
  return response.data;
}

export async function getMvpConfigs() {
  const response = await httpClient.get("/api/v1/admin/analytics/mvp/configs");
  return response.data;
}

export async function createMvpConfig(input) {
  const response = await httpClient.post("/api/v1/admin/analytics/mvp/configs", input);
  return response.data;
}

export async function activateMvpConfig({ configId, reason }) {
  const response = await httpClient.post(
    `/api/v1/admin/analytics/mvp/configs/${configId}/activate`,
    { reason },
  );
  return response.data;
}

export async function recalculateMvp(input) {
  const response = await httpClient.post(
    "/api/v1/admin/analytics/mvp/recalculate",
    input,
  );
  return response.data;
}
