import { httpClient } from "@/lib/http-client.js";

export async function getChallenges(params = {}) {
  const response = await httpClient.get("/api/v1/challenges", { params });
  return response.data;
}

export async function getChallenge(identifier) {
  const response = await httpClient.get(`/api/v1/challenges/${identifier}`);
  return response.data;
}

export async function getPlayerChallenges(playerId, params = {}) {
  const response = await httpClient.get(`/api/v1/challenges/players/${playerId}`, {
    params,
  });
  return response.data;
}

export async function getAdminChallenges(params = {}) {
  const response = await httpClient.get("/api/v1/challenges/admin/manage/list", {
    params,
  });
  return response.data;
}

export async function createChallenge(input) {
  const response = await httpClient.post("/api/v1/challenges/admin/manage", input);
  return response.data;
}

export async function updateChallenge({ challengeId, ...input }) {
  const response = await httpClient.patch(
    `/api/v1/challenges/admin/manage/${challengeId}`,
    input,
  );
  return response.data;
}

export async function changeChallengeStatus({ challengeId, ...input }) {
  const response = await httpClient.post(
    `/api/v1/challenges/admin/manage/${challengeId}/status`,
    input,
  );
  return response.data;
}

export async function recalculateChallenges(input) {
  const response = await httpClient.post("/api/v1/admin/challenges/recalculate", input);
  return response.data;
}
