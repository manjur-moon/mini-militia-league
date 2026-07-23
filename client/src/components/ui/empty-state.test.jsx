import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state.jsx";

describe("EmptyState", () => {
  it("renders its title and description", () => {
    render(<EmptyState title="No results" description="Try another search." />);
    expect(screen.getByRole("heading", { name: "No results" })).toBeInTheDocument();
    expect(screen.getByText("Try another search.")).toBeInTheDocument();
  });
});
