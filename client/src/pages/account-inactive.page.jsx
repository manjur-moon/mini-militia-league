import { Ban, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client.js";

export function AccountInactivePage() {
  const navigate = useNavigate();

  async function handleSignOut() {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message ?? "Unable to sign out.");
      return;
    }

    navigate("/login", { replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4 dark:bg-slate-950">
      <section className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl dark:border-red-900 dark:bg-slate-900 sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
          <Ban size={32} aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-4xl font-black">Account unavailable</h1>
        <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
          This account is inactive. Protected application routes remain unavailable
          until an administrator reactivates it.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-7 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-black hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </section>
    </div>
  );
}
