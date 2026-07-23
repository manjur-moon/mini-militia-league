import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./breadcrumbs.jsx";

describe("Breadcrumbs", () => {
  it("creates links for parent route segments", () => {
    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Breadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.getByText("Users")).toHaveAttribute("aria-current", "page");
  });
});
