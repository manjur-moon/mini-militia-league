import { API_PREFIX } from "@mini-militia/shared";
import { httpClient } from "@/lib/http-client.js";

export async function getApiHealth() {
  const response = await httpClient.get(`${API_PREFIX}/health`);
  return response.data.data;
}
