import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RivalrySummaryCard } from "./rivalry-summary-card.jsx";

describe("RivalrySummaryCard", () => {
  it("renders the documented head-to-head summary", () => {
    render(
      <MemoryRouter>
        <RivalrySummaryCard
          playerId="MM001"
          rivalry={{
            pairKey: "a:b",
            wins: 3,
            draws: 1,
            losses: 2,
            sharedMatches: 6,
            winRate: 50,
            player: { totalKills: 60, kdr: 2.5 },
            opponent: {
              playerId: "MM002",
              name: "Rival Player",
              photoUrl: null,
              kdr: 2,
            },
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Rival Player")).toBeInTheDocument();
    expect(screen.getByText("View head-to-head")).toBeInTheDocument();
  });
});
