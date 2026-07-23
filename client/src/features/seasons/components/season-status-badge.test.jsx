import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeasonStatusBadge } from "./season-status-badge.jsx";

describe("SeasonStatusBadge", () => {
  it("renders the active lifecycle state", () => {
    render(<SeasonStatusBadge status="active" />);
    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
