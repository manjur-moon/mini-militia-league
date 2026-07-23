import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SeasonCard } from "./season-card.jsx";

describe("SeasonCard", () => {
  it("renders season identity and champion snapshot", () => {
    render(
      <MemoryRouter>
        <SeasonCard
          season={{
            id: "season-1",
            name: "Season One",
            slug: "season-one",
            description: "Competitive league season.",
            status: "completed",
            startAt: "2026-01-01T00:00:00.000Z",
            endAt: "2026-02-01T00:00:00.000Z",
            champion: { name: "Alpha" },
            mvpAward: { score: 120 },
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Season One")).toBeInTheDocument();
    expect(screen.getByText(/Champion: Alpha/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View season" })).toHaveAttribute(
      "href",
      "/seasons/season-one",
    );
  });
});
