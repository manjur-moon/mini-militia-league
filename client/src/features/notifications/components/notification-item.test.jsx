import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotificationItem } from "./notification-item.jsx";

const notification = {
  id: "64f000000000000000000001",
  type: "match_verified",
  title: "Match verified",
  message: "Your result is now official.",
  actionUrl: "/matches/64f000000000000000000002",
  isRead: false,
  createdAt: "2026-07-20T10:00:00.000Z",
};

describe("NotificationItem", () => {
  it("shows unread state and exposes its actions", () => {
    const onOpen = vi.fn();
    const onMarkRead = vi.fn();
    render(
      <NotificationItem
        notification={notification}
        onOpen={onOpen}
        onMarkRead={onMarkRead}
        isUpdating={false}
      />,
    );

    expect(screen.getByText("New")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(onOpen).toHaveBeenCalledWith(notification);
    expect(onMarkRead).toHaveBeenCalledWith(notification.id);
  });

  it("hides mutation actions for a read notification without a target URL", () => {
    render(
      <NotificationItem
        notification={{
          ...notification,
          type: "unknown_type",
          isRead: true,
          actionUrl: null,
          createdAt: null,
        }}
        onOpen={vi.fn()}
        onMarkRead={vi.fn()}
        isUpdating={false}
      />,
    );

    expect(screen.queryByText("New")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View details" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark as read" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Unknown time")).toBeInTheDocument();
  });

  it("disables mark-as-read during an update", () => {
    render(
      <NotificationItem
        notification={notification}
        onOpen={vi.fn()}
        onMarkRead={vi.fn()}
        isUpdating
      />,
    );

    expect(screen.getByRole("button", { name: "Mark as read" })).toBeDisabled();
  });
});
