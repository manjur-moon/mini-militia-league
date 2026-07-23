import { httpClient } from "@/lib/http-client.js";

export async function getPlayers(params = {}) {
  const response = await httpClient.get("/api/v1/players", { params });
  return response.data;
}

export async function getPlayer(playerId) {
  const response = await httpClient.get(`/api/v1/players/${playerId}`);
  return response.data;
}

export async function getPlayerProfile(playerId) {
  const response = await httpClient.get(`/api/v1/players/${playerId}/profile`);
  return response.data;
}

export async function createPlayer(input) {
  const response = await httpClient.post("/api/v1/players", input);
  return response.data;
}

export async function updatePlayer({ playerId, ...input }) {
  const response = await httpClient.patch(`/api/v1/players/${playerId}`, input);
  return response.data;
}

export async function updatePlayerStatus({ playerId, ...input }) {
  const response = await httpClient.patch(`/api/v1/players/${playerId}/status`, input);
  return response.data;
}

export async function uploadPlayerPhoto({ playerId, file }) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await httpClient.post(`/api/v1/players/${playerId}/photo`, formData);
  return response.data;
}

export async function deletePlayerPhoto({ playerId, reason }) {
  const response = await httpClient.delete(`/api/v1/players/${playerId}/photo`, {
    data: { reason },
  });
  return response.data;
}

export async function getPlayerMatches(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/players/${playerId}/matches`, {
    params,
  });
  return response.data;
}

export async function getPlayerStatistics(playerId) {
  const response = await httpClient.get(`/api/v1/players/${playerId}/statistics`);
  return response.data;
}

export async function getPlayerRecords(playerId) {
  const response = await httpClient.get(`/api/v1/players/${playerId}/records`);
  return response.data;
}

export async function getLinkedPlayerProfile() {
  const response = await httpClient.get("/api/v1/players/me/profile");
  return response.data;
}

export async function getLinkedPlayerMatches(params = {}) {
  const response = await httpClient.get("/api/v1/players/me/matches", { params });
  return response.data;
}
