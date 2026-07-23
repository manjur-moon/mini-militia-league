import { httpClient } from "@/lib/http-client.js";

export async function getAIStatus() {
  const response = await httpClient.get("/api/v1/ai/status");
  return response.data;
}

export async function getPeriodAISummary(periodType, params = {}) {
  const response = await httpClient.get(`/api/v1/ai/summaries/${periodType}`, {
    params,
  });
  return response.data;
}

export async function getPeriodAIHighlight(periodType, params = {}) {
  const response = await httpClient.get(`/api/v1/ai/highlights/${periodType}`, {
    params,
  });
  return response.data;
}

export async function getPlayerAIInsight(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/ai/players/${playerId}`, {
    params,
  });
  return response.data;
}

export async function getMatchAIInsight(matchId) {
  const response = await httpClient.get(`/api/v1/ai/matches/${matchId}`);
  return response.data;
}

export async function getAdminAISummaries(params = {}) {
  const response = await httpClient.get("/api/v1/admin/ai/summaries", { params });
  return response.data;
}

export async function regenerateAIInsight(input) {
  const response = await httpClient.post("/api/v1/admin/ai/regenerate", input);
  return response.data;
}
