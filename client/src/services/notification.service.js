import { httpClient } from "@/lib/http-client.js";

export async function getNotifications(params = {}) {
  const response = await httpClient.get("/api/v1/notifications", { params });
  return response.data;
}

export async function getUnreadNotificationCount() {
  const response = await httpClient.get("/api/v1/notifications/unread-count");
  return response.data;
}

export async function markNotificationRead(notificationId) {
  const response = await httpClient.patch(
    `/api/v1/notifications/${notificationId}/read`,
  );
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await httpClient.patch("/api/v1/notifications/read-all");
  return response.data;
}

export async function getAdminNotifications(params = {}) {
  const response = await httpClient.get("/api/v1/admin/notifications", { params });
  return response.data;
}

export async function createAdminNotification(input) {
  const response = await httpClient.post("/api/v1/admin/notifications", input);
  return response.data;
}
