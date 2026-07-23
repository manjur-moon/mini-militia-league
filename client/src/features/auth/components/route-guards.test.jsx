import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-client.js", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

import { authClient } from "@/lib/auth-client.js";
import { ProtectedRoute } from "./protected-route.jsx";
import { RoleRoute } from "@/features/rbac/components/role-route.jsx";

function renderProtected(sessionState) {
  authClient.useSession.mockReturnValue(sessionState);
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/account-inactive" element={<div>Inactive page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderRoleRoute(sessionState, allowedRoles = ["admin"]) {
  authClient.useSession.mockReturnValue(sessionState);
  return render(
    <MemoryRouter initialEntries={["/admin-only"]}>
      <Routes>
        <Route element={<RoleRoute allowedRoles={allowedRoles} />}>
          <Route path="/admin-only" element={<div>Admin content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/account-inactive" element={<div>Inactive page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("frontend authentication and role guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an accessible loading state while the session is pending", () => {
    renderProtected({ data: null, isPending: true, error: null });

    expect(screen.getByText("Checking your session")).toBeInTheDocument();
  });

  it("redirects an anonymous visitor to login", () => {
    renderProtected({ data: null, isPending: false, error: null });

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("redirects an inactive account away from protected content", () => {
    renderProtected({
      data: { user: { status: "inactive", role: "player" } },
      isPending: false,
      error: null,
    });

    expect(screen.getByText("Inactive page")).toBeInTheDocument();
  });

  it("renders protected content for an active authenticated user", () => {
    renderProtected({
      data: { user: { status: "active", role: "player" } },
      isPending: false,
      error: null,
    });

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("denies an active user whose role is not allowed", () => {
    renderRoleRoute({
      data: { user: { status: "active", role: "player" } },
      isPending: false,
      error: null,
    });

    expect(screen.getByText("Unauthorized page")).toBeInTheDocument();
  });

  it("allows an active user with an accepted role", () => {
    renderRoleRoute({
      data: { user: { status: "active", role: "admin" } },
      isPending: false,
      error: null,
    });

    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});

// Additional role-route states are kept separate so route-access regressions are visible.
describe("role guard session states", () => {
  it("shows role-check loading feedback", () => {
    renderRoleRoute({ data: null, isPending: true, error: null });
    expect(screen.getByText("Checking access")).toBeInTheDocument();
  });

  it("redirects an anonymous role-protected request to login", () => {
    renderRoleRoute({ data: null, isPending: false, error: null });
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("redirects inactive role holders before checking the role", () => {
    renderRoleRoute({
      data: { user: { status: "inactive", role: "admin" } },
      isPending: false,
      error: null,
    });
    expect(screen.getByText("Inactive page")).toBeInTheDocument();
  });
});
