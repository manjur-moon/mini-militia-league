import { httpClient } from "@/lib/http-client.js";

export async function getSeasons(params = {}) {
  const response = await httpClient.get("/api/v1/seasons", { params });
  return response.data;
}

export async function getActiveSeason() {
  const response = await httpClient.get("/api/v1/seasons/active");
  return response.data;
}

export async function getSeason(identifier) {
  const response = await httpClient.get(`/api/v1/seasons/${identifier}`);
  return response.data;
}

export async function getSeasonStatistics(identifier) {
  const response = await httpClient.get(`/api/v1/seasons/${identifier}/statistics`);
  return response.data;
}

export async function getSeasonLeaderboard(identifier, params = {}) {
  const response = await httpClient.get(`/api/v1/seasons/${identifier}/leaderboard`, {
    params,
  });
  return response.data;
}

export async function getAdminSeasons(params = {}) {
  const response = await httpClient.get("/api/v1/admin/seasons", { params });
  return response.data;
}

export async function createSeason(input) {
  const response = await httpClient.post("/api/v1/admin/seasons", input);
  return response.data;
}

export async function updateSeason({ seasonId, ...input }) {
  const response = await httpClient.patch(`/api/v1/admin/seasons/${seasonId}`, input);
  return response.data;
}

export async function changeSeasonStatus({ seasonId, ...input }) {
  const response = await httpClient.post(
    `/api/v1/admin/seasons/${seasonId}/status`,
    input,
  );
  return response.data;
}

export async function recalculateSeason({ seasonId, ...input }) {
  const response = await httpClient.post(
    `/api/v1/admin/seasons/${seasonId}/recalculate`,
    input,
  );
  return response.data;
}

export async function backfillSeasonMatches({ seasonId, ...input }) {
  const response = await httpClient.post(
    `/api/v1/admin/seasons/${seasonId}/backfill-matches`,
    input,
  );
  return response.data;
}
