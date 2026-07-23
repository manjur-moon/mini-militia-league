import { httpClient } from "@/lib/http-client.js";

export async function getActiveRatingConfig() {
  const response = await httpClient.get("/api/v1/ratings/config");
  return response.data;
}

export async function getRatingLeaderboard(params = {}) {
  const response = await httpClient.get("/api/v1/ratings/leaderboard", { params });
  return response.data;
}

export async function getPlayerRating(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/players/${playerId}/ratings`, {
    params,
  });
  return response.data;
}

export async function getPlayerRatingHistory(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/ratings/players/${playerId}/history`, {
    params,
  });
  return response.data;
}

export async function getRatingConfigs() {
  const response = await httpClient.get("/api/v1/ratings/configs");
  return response.data;
}

export async function createRatingConfig(input) {
  const response = await httpClient.post("/api/v1/ratings/configs", input);
  return response.data;
}

export async function activateRatingConfig({ configId, reason }) {
  const response = await httpClient.post(
    `/api/v1/ratings/configs/${configId}/activate`,
    { reason },
  );
  return response.data;
}

export async function recalculateRatings(input) {
  const response = await httpClient.post("/api/v1/admin/ratings/recalculate", input);
  return response.data;
}
