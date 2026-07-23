import { httpClient } from "@/lib/http-client.js";

export async function getLeaderboard(params = {}) {
  const response = await httpClient.get("/api/v1/analytics/leaderboards", { params });
  return response.data;
}

export async function getPeriodAnalytics(periodType, params = {}) {
  const response = await httpClient.get(`/api/v1/analytics/periods/${periodType}`, {
    params,
  });
  return response.data;
}

export async function getGlobalAnalytics() {
  const response = await httpClient.get("/api/v1/analytics/global");
  return response.data;
}

export async function getMostImproved(params = {}) {
  const response = await httpClient.get("/api/v1/analytics/most-improved", {
    params,
  });
  return response.data;
}

export async function getPlayerPerformance(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/players/${playerId}/performance`, {
    params,
  });
  return response.data;
}

export async function getPlayerAdvancedAnalytics(playerId) {
  const response = await httpClient.get(
    `/api/v1/players/${playerId}/advanced-analytics`,
  );
  return response.data;
}

export async function recalculatePeriodicAnalytics(input) {
  const response = await httpClient.post("/api/v1/admin/analytics/recalculate", input);
  return response.data;
}
