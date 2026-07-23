import { httpClient } from "@/lib/http-client.js";

export async function getPlayerCard(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/players/${playerId}/card`, {
    params,
  });
  return response.data;
}
