import { ROLE_ACCESS } from "@mini-militia/shared";
import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/protected-route.jsx";
import { PublicOnlyRoute } from "@/features/auth/components/public-only-route.jsx";
import { RoleRoute } from "@/features/rbac/components/role-route.jsx";
import { AdminDashboardLayout } from "@/layouts/admin-dashboard-layout.jsx";
import { AuthLayout } from "@/layouts/auth-layout.jsx";
import { ModeratorDashboardLayout } from "@/layouts/moderator-dashboard-layout.jsx";
import { PlayerDashboardLayout } from "@/layouts/player-dashboard-layout.jsx";
import { PublicLayout } from "@/layouts/public-layout.jsx";
import { RootLayout } from "@/layouts/root-layout.jsx";
import { AccountInactivePage } from "@/pages/account-inactive.page.jsx";
import { AdminAnalyticsPage } from "@/pages/admin-analytics.page.jsx";
import { AdminAIInsightsPage } from "@/pages/admin-ai-insights.page.jsx";
import { AIInsightsPage } from "@/pages/ai-insights.page.jsx";
import { AnalyticsPage } from "@/pages/analytics.page.jsx";
import { LeaderboardsPage } from "@/pages/leaderboards.page.jsx";
import { MvpPage } from "@/pages/mvp.page.jsx";
import { RatingsPage } from "@/pages/ratings.page.jsx";
import { TitlesPage } from "@/pages/titles.page.jsx";
import { AchievementsPage } from "@/pages/achievements.page.jsx";
import { PlayerAchievementsPage } from "@/pages/player-achievements.page.jsx";
import { RivalriesPage } from "@/pages/rivalries.page.jsx";
import { PlayerRivalriesPage } from "@/pages/player-rivalries.page.jsx";
import { RivalryDetailPage } from "@/pages/rivalry-detail.page.jsx";
import { AdminRivalriesPage } from "@/pages/admin-rivalries.page.jsx";
import { ChallengesPage } from "@/pages/challenges.page.jsx";
import { ChallengeDetailPage } from "@/pages/challenge-detail.page.jsx";
import { PlayerChallengesPage } from "@/pages/player-challenges.page.jsx";
import { AdminChallengesPage } from "@/pages/admin-challenges.page.jsx";
import { HallOfFamePage } from "@/pages/hall-of-fame.page.jsx";
import { PlayerHallOfFamePage } from "@/pages/player-hall-of-fame.page.jsx";
import { AdminHallOfFamePage } from "@/pages/admin-hall-of-fame.page.jsx";
import { SeasonsPage } from "@/pages/seasons.page.jsx";
import { SeasonDetailPage } from "@/pages/season-detail.page.jsx";
import { AdminSeasonsPage } from "@/pages/admin-seasons.page.jsx";
import { NotificationsPage } from "@/pages/notifications.page.jsx";
import { AdminNotificationsPage } from "@/pages/admin-notifications.page.jsx";
import { AdminAchievementsPage } from "@/pages/admin-achievements.page.jsx";
import { AdminTitlesPage } from "@/pages/admin-titles.page.jsx";
import { AdminRatingsPage } from "@/pages/admin-ratings.page.jsx";
import { PlayerPerformancePage } from "@/pages/player-performance.page.jsx";
import { AccountPage } from "@/pages/account.page.jsx";
import { AdminDashboardPage } from "@/pages/admin-dashboard.page.jsx";
import { AdminUsersPage } from "@/pages/admin-users.page.jsx";
import { AdminPlayersPage } from "@/pages/admin-players.page.jsx";
import { AccountEntryPage, DashboardEntryPage } from "@/pages/dashboard-entry.page.jsx";
import { HomePage } from "@/pages/home.page.jsx";
import { LoginPage } from "@/pages/login.page.jsx";
import { ModeratorDashboardPage } from "@/pages/moderator-dashboard.page.jsx";
import { MatchUploadPage } from "@/pages/match-upload.page.jsx";
import { MatchesArchivePage } from "@/pages/matches-archive.page.jsx";
import { MatchReviewPage } from "@/pages/match-review.page.jsx";
import { MatchDetailPage } from "@/pages/match-detail.page.jsx";
import { MatchesPage } from "@/pages/matches.page.jsx";
import { NotFoundPage } from "@/pages/not-found.page.jsx";
import { PlayerDashboardPage } from "@/pages/player-dashboard.page.jsx";
import { PlayerProfilePage } from "@/pages/player-profile.page.jsx";
import { PlayerCardPage } from "@/pages/player-card.page.jsx";
import { PlayerMatchHistoryPage } from "@/pages/player-match-history.page.jsx";
import { PlayersPage } from "@/pages/players.page.jsx";
import { RegisterPage } from "@/pages/register.page.jsx";
import { RouteErrorPage } from "@/pages/route-error.page.jsx";
import { UnauthorizedPage } from "@/pages/unauthorized.page.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "players", element: <PlayersPage /> },
          { path: "players/:playerId", element: <PlayerProfilePage /> },
          { path: "players/:playerId/card", element: <PlayerCardPage /> },
          {
            path: "players/:playerId/matches",
            element: <PlayerMatchHistoryPage />,
          },
          { path: "matches", element: <MatchesPage /> },
          { path: "leaderboards", element: <LeaderboardsPage /> },
          { path: "analytics", element: <AnalyticsPage /> },
          { path: "insights", element: <AIInsightsPage /> },
          { path: "mvp", element: <MvpPage /> },
          { path: "ratings", element: <RatingsPage /> },
          { path: "titles", element: <TitlesPage /> },
          { path: "achievements", element: <AchievementsPage /> },
          { path: "rivalries", element: <RivalriesPage /> },
          { path: "challenges", element: <ChallengesPage /> },
          { path: "hall-of-fame", element: <HallOfFamePage /> },
          { path: "seasons", element: <SeasonsPage /> },
          { path: "seasons/:identifier", element: <SeasonDetailPage /> },
          {
            path: "challenges/:challengeCode",
            element: <ChallengeDetailPage />,
          },
          {
            path: "players/:playerId/achievements",
            element: <PlayerAchievementsPage />,
          },
          {
            path: "players/:playerId/challenges",
            element: <PlayerChallengesPage />,
          },
          {
            path: "players/:playerId/hall-of-fame",
            element: <PlayerHallOfFamePage />,
          },
          {
            path: "players/:playerId/rivalries",
            element: <PlayerRivalriesPage />,
          },
          {
            path: "players/:playerId/rivalries/:opponentId",
            element: <RivalryDetailPage />,
          },
          { path: "matches/:matchId", element: <MatchDetailPage /> },
        ],
      },
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: "login", element: <LoginPage /> },
              { path: "register", element: <RegisterPage /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <DashboardEntryPage /> },
          { path: "account", element: <AccountEntryPage /> },
          { path: "unauthorized", element: <UnauthorizedPage /> },
          {
            element: <RoleRoute allowedRoles={ROLE_ACCESS.PLAYER_AREA} />,
            children: [
              {
                path: "player",
                element: <PlayerDashboardLayout />,
                children: [
                  { index: true, element: <PlayerDashboardPage /> },
                  { path: "profile", element: <PlayerProfilePage linked /> },
                  { path: "performance", element: <PlayerPerformancePage /> },
                  {
                    path: "achievements",
                    element: <PlayerAchievementsPage linked />,
                  },
                  {
                    path: "challenges",
                    element: <PlayerChallengesPage linked />,
                  },
                  {
                    path: "hall-of-fame",
                    element: <PlayerHallOfFamePage linked />,
                  },
                  { path: "notifications", element: <NotificationsPage /> },
                  { path: "account", element: <AccountPage /> },
                ],
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={ROLE_ACCESS.MODERATOR_AREA} />,
            children: [
              {
                path: "moderator",
                element: <ModeratorDashboardLayout />,
                children: [
                  { index: true, element: <ModeratorDashboardPage /> },
                  { path: "uploads", element: <MatchUploadPage /> },
                  { path: "archive", element: <MatchesArchivePage /> },
                  { path: "verification", element: <MatchesArchivePage /> },
                  { path: "failed-jobs", element: <MatchesArchivePage /> },
                  { path: "matches/:matchId", element: <MatchReviewPage /> },
                  { path: "notifications", element: <NotificationsPage /> },
                  { path: "account", element: <AccountPage /> },
                ],
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={ROLE_ACCESS.ADMIN_AREA} />,
            children: [
              {
                path: "admin",
                element: <AdminDashboardLayout />,
                children: [
                  { index: true, element: <AdminDashboardPage /> },
                  { path: "users", element: <AdminUsersPage /> },
                  { path: "players", element: <AdminPlayersPage /> },
                  { path: "analytics", element: <AdminAnalyticsPage /> },
                  { path: "ai-insights", element: <AdminAIInsightsPage /> },
                  { path: "ratings", element: <AdminRatingsPage /> },
                  { path: "titles", element: <AdminTitlesPage /> },

                  {
                    path: "achievements",
                    element: <AdminAchievementsPage />,
                  },

                  { path: "rivalries", element: <AdminRivalriesPage /> },
                  { path: "challenges", element: <AdminChallengesPage /> },
                  { path: "hall-of-fame", element: <AdminHallOfFamePage /> },
                  { path: "seasons", element: <AdminSeasonsPage /> },

                  {
                    path: "matches",
                    element: <MatchesArchivePage basePath="/admin" />,
                  },

                  {
                    path: "archive",
                    element: <Navigate to="/admin/matches" replace />,
                  },

                  {
                    path: "verification",
                    element: <MatchesArchivePage basePath="/admin" />,
                  },

                  {
                    path: "matches/:matchId",
                    element: <MatchReviewPage archivePath="/admin/matches" />,
                  },

                  {
                    path: "uploads",
                    element: <MatchUploadPage basePath="/admin" />,
                  },

                  { path: "notifications", element: <NotificationsPage /> },

                  {
                    path: "notification-management",
                    element: <AdminNotificationsPage />,
                  },

                  { path: "account", element: <AccountPage /> },
                ],
              },
            ],
          },
        ],
      },
      { path: "account-inactive", element: <AccountInactivePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);