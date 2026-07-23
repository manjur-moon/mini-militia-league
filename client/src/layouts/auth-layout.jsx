import { ArrowLeft, BarChart3, ShieldCheck, Trophy } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { AppLogo } from "@/components/brand/app-logo.jsx";
import { ThemeToggle } from "@/components/ui/theme-toggle.jsx";

const benefits = [
  {
    title: "Verified results",
    description: "Only moderator-approved matches affect official statistics.",
    icon: ShieldCheck,
  },
  {
    title: "Performance analytics",
    description: "Track trends, ranks and league progress from one dashboard.",
    icon: BarChart3,
  },
  {
    title: "Competitive recognition",
    description: "Earn weekly MVP placements, records and achievements.",
    icon: Trophy,
  },
];

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.8fr)]">
      <aside className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 auth-grid opacity-40" aria-hidden="true" />
        <div
          className="absolute -left-24 top-20 size-72 rounded-full bg-amber-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <AppLogo />
        </div>
        <div className="relative max-w-xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">
            Competitive league intelligence
          </p>
          <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight">
            Every verified match becomes meaningful progress.
          </h1>
          <div className="mt-10 grid gap-4">
            {benefits.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-slate-950">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-black">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-slate-400">
          Secure sessions powered by Better Auth.
        </p>
      </aside>

      <main className="relative flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
        <div className="flex h-18 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800 sm:px-8">
          <div className="lg:hidden">
            <AppLogo />
          </div>
          <Link
            to="/"
            className="hidden items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white lg:inline-flex"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to homepage
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
