import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HallOfFameRecordCard } from "./hall-of-fame-record-card.jsx";

describe("HallOfFameRecordCard", () => {
  it("renders the player, value and historical status", () => {
    render(
      <MemoryRouter>
        <HallOfFameRecordCard
          record={{
            id: "record-1",
            status: "historical",
            definition: {
              icon: "🎯",
              label: "Most Kills Record",
            },
            player: { playerId: "MM001", name: "Alpha" },
            recordValue: 1200,
            unit: "kills",
            awardDate: "2026-07-01T00:00:00.000Z",
            sourceVersion: "hall-of-fame-v1:core-v1",
            criteria: { definition: "Highest verified kill total." },
            season: null,
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText("historical")).toBeInTheDocument();
  });
});
