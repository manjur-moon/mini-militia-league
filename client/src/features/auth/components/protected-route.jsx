import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingState } from "@/components/ui/loading-state.jsx";
import { authClient } from "@/lib/auth-client.js";

export function ProtectedRoute() {
  const location = useLocation();
  const { data: session, isPending, error } = authClient.useSession();
  if (isPending)
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 p-4 dark:bg-slate-950">
        <div className="w-full max-w-lg">
          <LoadingState
            title="Checking your session"
            description="Validating your secure account before opening the dashboard."
          />
        </div>
      </div>
    );
  if (error || !session?.user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (session.user.status !== "active")
    return <Navigate to="/account-inactive" replace />;
  return <Outlet />;
}
