import { httpClient } from "@/lib/http-client.js";

export async function getStatisticsOverview() {
  const response = await httpClient.get("/api/v1/statistics/overview");
  return response.data;
}

export async function recalculateStatistics(input) {
  const response = await httpClient.post("/api/v1/admin/statistics/recalculate", input);
  return response.data;
}
