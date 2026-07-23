import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "@/lib/auth-client.js";

export function PublicOnlyRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return null;
  }

  if (session?.user) {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
