import { httpClient } from "@/lib/http-client.js";

export async function getHallOfFame(params = {}) {
  const response = await httpClient.get("/api/v1/hall-of-fame", { params });
  return response.data;
}

export async function getHallOfFameCategory(category, params = {}) {
  const response = await httpClient.get(`/api/v1/hall-of-fame/${category}`, {
    params,
  });
  return response.data;
}

export async function getPlayerHallOfFame(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/hall-of-fame/players/${playerId}`, {
    params,
  });
  return response.data;
}

export async function recalculateHallOfFame(input) {
  const response = await httpClient.post(
    "/api/v1/admin/hall-of-fame/recalculate",
    input,
  );
  return response.data;
}
