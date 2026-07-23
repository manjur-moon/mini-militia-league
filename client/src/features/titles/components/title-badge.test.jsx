import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TitleBadge } from "./title-badge.jsx";

describe("TitleBadge", () => {
  it("renders the title icon and name", () => {
    render(<TitleBadge title={{ icon: "♛", name: "King Slayer" }} current />);
    expect(screen.getByText("King Slayer")).toBeInTheDocument();
    expect(screen.getByText("♛")).toBeInTheDocument();
  });
});
