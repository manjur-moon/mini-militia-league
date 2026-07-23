import { httpClient } from "@/lib/http-client.js";

export async function getAchievements(params = {}) {
  const response = await httpClient.get("/api/v1/achievements", { params });
  return response.data;
}

export async function getAchievementDefinition(code) {
  const response = await httpClient.get(`/api/v1/achievements/definitions/${code}`);
  return response.data;
}

export async function getPlayerAchievements(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/achievements/players/${playerId}`, {
    params,
  });
  return response.data;
}

export async function getAchievementDefinitions(params = {}) {
  const response = await httpClient.get("/api/v1/achievements/admin/definitions", {
    params,
  });
  return response.data;
}

export async function createAchievementDefinition(input) {
  const response = await httpClient.post(
    "/api/v1/achievements/admin/definitions",
    input,
  );
  return response.data;
}

export async function createAchievementRevision({ achievementId, input }) {
  const response = await httpClient.post(
    `/api/v1/achievements/admin/definitions/${achievementId}/revisions`,
    input,
  );
  return response.data;
}

export async function activateAchievementDefinition({ achievementId, reason }) {
  const response = await httpClient.post(
    `/api/v1/achievements/admin/definitions/${achievementId}/activate`,
    { reason },
  );
  return response.data;
}

export async function deactivateAchievementDefinition({ achievementId, reason }) {
  const response = await httpClient.post(
    `/api/v1/achievements/admin/definitions/${achievementId}/deactivate`,
    { reason },
  );
  return response.data;
}

export async function recalculateAchievements(input) {
  const response = await httpClient.post(
    "/api/v1/admin/achievements/recalculate",
    input,
  );
  return response.data;
}
