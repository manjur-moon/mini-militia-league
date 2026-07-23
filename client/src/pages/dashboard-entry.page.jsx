import { Navigate } from "react-router-dom";
import { USER_ROLES } from "@mini-militia/shared";
import { authClient } from "@/lib/auth-client.js";

function getDashboardPath(role) {
  if (role === USER_ROLES.ADMIN) return "/admin";
  if (role === USER_ROLES.MODERATOR) return "/moderator";
  return "/player";
}

export function DashboardEntryPage() {
  const { data: session } = authClient.useSession();
  return <Navigate to={getDashboardPath(session?.user?.role)} replace />;
}

export function AccountEntryPage() {
  const { data: session } = authClient.useSession();
  return <Navigate to={`${getDashboardPath(session?.user?.role)}/account`} replace />;
}
