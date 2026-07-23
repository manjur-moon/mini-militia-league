import { CalendarDays, Link2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header.jsx";
import { SectionCard } from "@/components/ui/section-card.jsx";
import { authClient } from "@/lib/auth-client.js";

export function AccountPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  if (!user) return null;

  const details = [
    { label: "Email", value: user.email, icon: Mail },
    { label: "Role", value: user.role, icon: ShieldCheck },
    { label: "Status", value: user.status, icon: UserRound },
    {
      label: "Player profile",
      value: user.linkedPlayerId ?? "Not linked yet",
      icon: Link2,
    },
    {
      label: "Account created",
      value: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(user.createdAt),
      ),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Account settings"
        title={user.name}
        description="Review the identity and access details attached to your Better Auth account."
        icon={UserRound}
      />
      <SectionCard
        title="Account information"
        description="Role, status and player links can only be changed through authorized server workflows."
      >
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {details.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
            >
              <dt className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                <Icon size={17} aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-2 break-words font-black capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>
    </div>
  );
}
