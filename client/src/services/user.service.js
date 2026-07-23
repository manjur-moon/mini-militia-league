import { httpClient } from "@/lib/http-client.js";

export async function getUsers(params = {}) {
  const response = await httpClient.get("/api/v1/users", { params });
  return response.data;
}

export async function updateUserRole({ userId, role, reason }) {
  const response = await httpClient.patch(`/api/v1/users/${userId}/role`, {
    role,
    reason,
  });
  return response.data;
}

export async function updateUserStatus({ userId, status, reason }) {
  const response = await httpClient.patch(`/api/v1/users/${userId}/status`, {
    status,
    reason,
  });
  return response.data;
}

export async function linkUserPlayer({ userId, playerId, reason }) {
  const response = await httpClient.put(`/api/v1/users/${userId}/player-link`, {
    playerId,
    reason,
  });
  return response.data;
}

export async function unlinkUserPlayer({ userId, reason }) {
  const response = await httpClient.delete(`/api/v1/users/${userId}/player-link`, {
    data: { reason },
  });
  return response.data;
}
