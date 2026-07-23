import {
  Activity,
  Archive,
  Award,
  BarChart3,
  Bell,
  BellRing,
  Bot,
  Crown,
  FileSearch,
  Gauge,
  Medal,
  ScanLine,
  Settings,
  ShieldCheck,
  Swords,
  Tags,
  Target,
  Trophy,
  Upload,
  UserRound,
  Users,
} from "lucide-react";

export const playerNavigation = Object.freeze([
  {
    label: "Overview",
    to: "/player",
    icon: Gauge,
    end: true,
  },
  {
    label: "Profile",
    to: "/player/profile",
    icon: UserRound,
  },
  {
    label: "Performance",
    to: "/player/performance",
    icon: BarChart3,
  },
  {
    label: "Achievements",
    to: "/player/achievements",
    icon: Medal,
  },
  {
    label: "Challenges",
    to: "/player/challenges",
    icon: Target,
  },
  {
    label: "Hall of Fame",
    to: "/player/hall-of-fame",
    icon: Crown,
  },
  {
    label: "Notifications",
    to: "/player/notifications",
    icon: Bell,
  },
  {
    label: "Account",
    to: "/player/account",
    icon: Settings,
  },
]);

export const moderatorNavigation = Object.freeze([
  {
    label: "Overview",
    to: "/moderator",
    icon: Gauge,
    end: true,
  },
  {
    label: "Upload match",
    to: "/moderator/uploads",
    icon: Upload,
  },
  {
    label: "OCR verification",
    to: "/moderator/verification",
    icon: ScanLine,
  },
  {
    label: "Failed jobs",
    to: "/moderator/failed-jobs",
    icon: Activity,
  },
  {
    label: "Screenshot archive",
    to: "/moderator/archive",
    icon: Archive,
  },
  {
    label: "Account",
    to: "/moderator/account",
    icon: Settings,
  },
]);

export const adminNavigation = Object.freeze([
  {
    label: "Overview",
    to: "/admin",
    icon: Gauge,
    end: true,
  },
  {
    label: "Users",
    to: "/admin/users",
    icon: Users,
  },
  {
    label: "Players",
    to: "/admin/players",
    icon: UserRound,
  },
  {
    label: "Analytics",
    to: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "AI insights",
    to: "/admin/ai-insights",
    icon: Bot,
  },
  {
    label: "Ratings",
    to: "/admin/ratings",
    icon: Activity,
  },
  {
    label: "Titles",
    to: "/admin/titles",
    icon: Tags,
  },

  // Match screenshot upload
  {
    label: "Upload match",
    to: "/admin/uploads",
    icon: Upload,
  },

  {
    label: "Matches",
    to: "/admin/matches",
    icon: Trophy,
  },
  {
    label: "Verification",
    to: "/admin/verification",
    icon: ShieldCheck,
  },
  {
    label: "Achievements",
    to: "/admin/achievements",
    icon: Award,
  },
  {
    label: "Rivalries",
    to: "/admin/rivalries",
    icon: Swords,
  },
  {
    label: "Challenges",
    to: "/admin/challenges",
    icon: Target,
  },
  {
    label: "Hall of Fame",
    to: "/admin/hall-of-fame",
    icon: Crown,
  },
  {
    label: "Seasons",
    to: "/admin/seasons",
    icon: Medal,
  },
  {
    label: "Notifications",
    to: "/admin/notifications",
    icon: Bell,
  },
  {
    label: "Notification management",
    to: "/admin/notification-management",
    icon: BellRing,
  },
  {
    label: "Audit logs",
    to: "/admin/audit-logs",
    icon: FileSearch,
    disabled: true,
  },
  {
    label: "Account",
    to: "/admin/account",
    icon: Settings,
  },
]);