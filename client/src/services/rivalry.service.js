import { httpClient } from "@/lib/http-client.js";

export async function getPlayerRivalries(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/rivalries/players/${playerId}`, {
    params,
  });
  return response.data;
}

export async function getRivalryComparison(playerId, opponentId, params = {}) {
  const response = await httpClient.get(
    `/api/v1/rivalries/players/${playerId}/opponents/${opponentId}`,
    { params },
  );
  return response.data;
}

export async function getRivalryMatches(playerId, opponentId, params = {}) {
  const response = await httpClient.get(
    `/api/v1/rivalries/players/${playerId}/opponents/${opponentId}/matches`,
    { params },
  );
  return response.data;
}

export async function getRivalOfWeek(params = {}) {
  const response = await httpClient.get("/api/v1/rivalries/rival-of-week", {
    params,
  });
  return response.data;
}

export async function recalculateRivalries(input) {
  const response = await httpClient.post("/api/v1/admin/rivalries/recalculate", input);
  return response.data;
}
