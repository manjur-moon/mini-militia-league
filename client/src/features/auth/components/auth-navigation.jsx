import { LogOut, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client.js";

export function AuthNavigation() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message ?? "Unable to sign out.");
      return;
    }

    toast.success("Signed out successfully.");
    navigate("/login", { replace: true });
  }

  if (isPending) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-black text-slate-950 hover:bg-amber-400"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/dashboard"
        className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        Dashboard
      </Link>
      <Link
        to="/account"
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <UserRound size={17} aria-hidden="true" />
        Account
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        <LogOut size={17} aria-hidden="true" />
        Sign out
      </button>
    </div>
  );
}
