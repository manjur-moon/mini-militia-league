import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AchievementBadge } from "./achievement-badge.jsx";

describe("AchievementBadge", () => {
  it("shows unlocked state", () => {
    render(
      <AchievementBadge
        achievement={{
          name: "First Blood",
          icon: "🩸",
          category: "milestone",
          version: "v1",
        }}
        unlocked
      />,
    );
    expect(screen.getByText("First Blood")).toBeInTheDocument();
    expect(screen.getByText("Unlocked")).toBeInTheDocument();
  });
});
