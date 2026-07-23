import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ChallengeProgressCard } from "./challenge-progress-card.jsx";

describe("ChallengeProgressCard", () => {
  it("renders completed challenge progress", () => {
    render(
      <MemoryRouter>
        <ChallengeProgressCard
          item={{
            status: "completed",
            currentValue: 100,
            targetValue: 100,
            progressPercentage: 100,
            challenge: {
              code: "WEEKLY_KILLS_100_2026_W29",
              name: "Century Assault",
              description: "Get 100 weekly kills.",
              icon: "💯",
              type: "weekly",
              metric: "totalKills",
              targetOperator: "gte",
              targetValue: 100,
              minimumMatches: 1,
              reward: { name: "Century Assault Badge" },
            },
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Century Assault")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
