import axe from "axe-core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/ui/empty-state.jsx";
import { AIInsightCard } from "@/features/ai/components/ai-insight-card.jsx";
import { NotificationItem } from "@/features/notifications/components/notification-item.jsx";

async function expectNoCriticalViolations(container) {
  const result = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  const seriousViolations = result.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact),
  );
  expect(seriousViolations).toEqual([]);
}

describe("critical component accessibility", () => {
  it("renders empty states with a heading and operable action", async () => {
    const action = vi.fn();
    const { container } = render(
      <EmptyState
        title="No verified matches"
        description="Upload and verify a result before official statistics appear."
        action={
          <button type="button" onClick={action}>
            Upload match
          </button>
        }
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Upload match" }));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "No verified matches" })).toBeVisible();
    await expectNoCriticalViolations(container);
  });

  it("gives notification actions clear accessible names", async () => {
    const onOpen = vi.fn();
    const onMarkRead = vi.fn();
    const { container } = render(
      <NotificationItem
        notification={{
          id: "notification-1",
          type: "match_verified",
          title: "Match verified",
          message: "Your official statistics were updated.",
          actionUrl: "/matches/1",
          isRead: false,
          createdAt: "2026-07-20T10:00:00.000Z",
        }}
        onOpen={onOpen}
        onMarkRead={onMarkRead}
        isUpdating={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(onOpen).toHaveBeenCalledOnce();
    expect(onMarkRead).toHaveBeenCalledWith("notification-1");
    await expectNoCriticalViolations(container);
  });

  it("labels AI-generated content and exposes its deterministic fallback status", async () => {
    const { container } = render(
      <AIInsightCard
        title="Weekly analysis"
        insight={{
          label: "Week 29",
          provider: "deterministic",
          model: null,
          isFallback: true,
          cacheHit: true,
          structuredContent: {
            headline: "Verified league summary",
            summary: "Four verified matches were included.",
            highlights: ["Alpha led total kills."],
            watchNext: ["Monitor player activity."],
            disclaimer:
              "AI-generated content is descriptive only and does not change official statistics.",
          },
        }}
      />,
    );

    expect(screen.getByText("Statistics fallback")).toBeVisible();
    expect(
      screen.getByText(
        "AI-generated content is descriptive only and does not change official statistics.",
      ),
    ).toBeVisible();
    await expectNoCriticalViolations(container);
  });
});
