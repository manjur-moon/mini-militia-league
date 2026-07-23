import { httpClient } from "@/lib/http-client.js";

export async function uploadMatchScreenshot(input) {
  const formData = new FormData();
  formData.append("screenshot", input.file);
  formData.append("matchDate", input.matchDate);
  formData.append("timezone", input.timezone);
  formData.append("participantCount", String(input.participantCount));
  if (input.seasonId) formData.append("seasonId", input.seasonId);
  const response = await httpClient.post("/api/v1/matches/uploads", formData);
  return response.data;
}

export async function getMatches(params = {}) {
  const response = await httpClient.get("/api/v1/matches", { params });
  return response.data;
}

export async function getMatch(matchId) {
  const response = await httpClient.get(`/api/v1/matches/${matchId}`);
  return response.data;
}

export async function retryOCR(jobId) {
  const response = await httpClient.post(`/api/v1/matches/ocr/jobs/${jobId}/retry`);
  return response.data;
}

export async function saveMatchReview({ matchId, ...input }) {
  const response = await httpClient.patch(`/api/v1/matches/${matchId}/review`, input);
  return response.data;
}

export async function verifyMatch({ matchId, reason }) {
  const response = await httpClient.post(`/api/v1/matches/${matchId}/verify`, {
    reason,
  });
  return response.data;
}

export async function rejectMatch({ matchId, reason }) {
  const response = await httpClient.post(`/api/v1/matches/${matchId}/reject`, {
    reason,
  });
  return response.data;
}

export async function updateMatchMetadata({ matchId, ...input }) {
  const response = await httpClient.patch(`/api/v1/matches/${matchId}`, input);
  return response.data;
}

export async function addMatchResult({ matchId, ...input }) {
  const response = await httpClient.post(`/api/v1/matches/${matchId}/results`, input);
  return response.data;
}

export async function updateMatchResult({ matchId, resultId, ...input }) {
  const response = await httpClient.patch(
    `/api/v1/matches/${matchId}/results/${resultId}`,
    input,
  );
  return response.data;
}

export async function removeMatchResult({ matchId, resultId, reason }) {
  const response = await httpClient.delete(
    `/api/v1/matches/${matchId}/results/${resultId}`,
    { data: { reason } },
  );
  return response.data;
}

export async function getMatchRevisions(matchId, params = {}) {
  const response = await httpClient.get(`/api/v1/matches/${matchId}/revisions`, {
    params,
  });
  return response.data;
}

export async function proposeMatchRevision({ matchId, ...input }) {
  const response = await httpClient.post(`/api/v1/matches/${matchId}/revisions`, input);
  return response.data;
}

export async function approveMatchRevision({ matchId, revisionNumber, ...input }) {
  const response = await httpClient.post(
    `/api/v1/matches/${matchId}/revisions/${revisionNumber}/approve`,
    input,
  );
  return response.data;
}

export async function rejectMatchRevision({ matchId, revisionNumber, reason }) {
  const response = await httpClient.post(
    `/api/v1/matches/${matchId}/revisions/${revisionNumber}/reject`,
    { reason },
  );
  return response.data;
}
