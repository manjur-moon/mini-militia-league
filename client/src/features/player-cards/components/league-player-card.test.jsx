import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeaguePlayerCard } from "./league-player-card.jsx";

const card = {
  player: { playerId: "MM001", name: "Ninja", profileImage: null },
  title: { name: "League Competitor" },
  ratings: {
    attack: 81,
    survival: 74,
    consistency: 77,
    activity: 90,
    overall: 80,
  },
  kdr: 1.75,
  minimumMatchesMet: true,
  formulaVersion: "rating-v1",
};

describe("LeaguePlayerCard", () => {
  it("renders the player identity, fallback initials and verified metrics", () => {
    render(<LeaguePlayerCard card={card} />);

    expect(screen.getByLabelText("Ninja Mini Militia player card")).toBeInTheDocument();
    expect(screen.getByText("Ninja")).toBeInTheDocument();
    expect(screen.getByText("MM001")).toBeInTheDocument();
    expect(screen.getByText("League Competitor")).toBeInTheDocument();
    expect(screen.getByText("1.75")).toBeInTheDocument();
    expect(screen.getByText("Rank eligible")).toBeInTheDocument();
  });
});
