import { httpClient } from "@/lib/http-client.js";

export async function getPlayerProfileShare(playerId) {
  const response = await httpClient.get(`/api/v1/share/players/${playerId}`);
  return response.data;
}

export async function getAchievementShare(playerId, achievementCode) {
  const response = await httpClient.get(
    `/api/v1/share/players/${playerId}/achievements/${achievementCode}`,
  );
  return response.data;
}

export async function getWeeklyMvpShare(params = {}) {
  const response = await httpClient.get("/api/v1/share/mvp/weekly", { params });
  return response.data;
}
