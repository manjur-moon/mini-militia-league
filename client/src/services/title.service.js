import { httpClient } from "@/lib/http-client.js";

export async function getTitles() {
  const response = await httpClient.get("/api/v1/titles");
  return response.data;
}

export async function getTitleDefinition(code) {
  const response = await httpClient.get(`/api/v1/titles/definitions/${code}`);
  return response.data;
}

export async function getPlayerCurrentTitle(playerId) {
  const response = await httpClient.get(`/api/v1/titles/players/${playerId}/current`);
  return response.data;
}

export async function getPlayerTitleHistory(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/titles/players/${playerId}/history`, {
    params,
  });
  return response.data;
}

export async function getTitleDefinitions(params = {}) {
  const response = await httpClient.get("/api/v1/titles/admin/definitions", {
    params,
  });
  return response.data;
}

export async function createTitleDefinition(input) {
  const response = await httpClient.post("/api/v1/titles/admin/definitions", input);
  return response.data;
}

export async function createTitleRevision({ titleId, input }) {
  const response = await httpClient.post(
    `/api/v1/titles/admin/definitions/${titleId}/revisions`,
    input,
  );
  return response.data;
}

export async function activateTitleDefinition({ titleId, reason }) {
  const response = await httpClient.post(
    `/api/v1/titles/admin/definitions/${titleId}/activate`,
    { reason },
  );
  return response.data;
}

export async function deactivateTitleDefinition({ titleId, reason }) {
  const response = await httpClient.post(
    `/api/v1/titles/admin/definitions/${titleId}/deactivate`,
    { reason },
  );
  return response.data;
}

export async function recalculateTitles(input) {
  const response = await httpClient.post("/api/v1/admin/titles/recalculate", input);
  return response.data;
}
