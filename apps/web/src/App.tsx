import { Navigate, Route, Routes } from 'react-router-dom';
import { AlertRulesPage } from '@/features/alerts/pages/AlertRulesPage';
import { IntegrationsLayout } from '@/features/alerts/components/IntegrationsTabs';
import { IntegrationsPage } from '@/features/alerts/pages/IntegrationsPage';
import { MfaChallengePage } from '@/features/auth/pages/MfaChallengePage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { MfaSetupPage } from '@/features/auth/pages/MfaSetupPage';
import { SecurityPage } from '@/features/auth/pages/SecurityPage';
import { SetupPage } from '@/features/auth/pages/SetupPage';
import { McpPage } from '@/features/mcp/pages/McpPage';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { AccountProjectsPage } from '@/features/settings/pages/AccountProjectsPage';
import { DataPage } from '@/features/settings/pages/DataPage';
import { GeneralPage } from '@/features/settings/pages/GeneralPage';
import { ProfilePage } from '@/features/settings/pages/ProfilePage';
import { SessionsPage } from '@/features/settings/pages/SessionsPage';
import { WebhooksPage } from '@/features/webhooks/pages/WebhooksPage';
import { RequireAuth } from '@/features/auth/routes/RequireAuth';
import { DashboardsPage } from '@/features/performance/pages/DashboardsPage';
import { PerformancePage } from '@/features/performance/pages/PerformancePage';
import { IssueDetailPage } from '@/features/issues/pages/IssueDetailPage';
import { IssuesPage } from '@/features/issues/pages/IssuesPage';
import { ProjectOverviewPage } from '@/features/issues/pages/ProjectOverviewPage';
import { ReplaysPage } from '@/features/replays/pages/ReplaysPage';
import { ProjectSettingsPage } from '@/features/projects/pages/ProjectSettingsPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import { HomeRedirect } from '@/features/projects/routes/HomeRedirect';
import { AcceptInvitePage } from '@/features/team/pages/AcceptInvitePage';
import { TeamPage } from '@/features/team/pages/TeamPage';
import { AppShell } from '@/layout/AppShell';

export function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/verify" element={<MfaChallengePage />} />
      <Route path="/security/setup" element={<MfaSetupPage />} />
      <Route path="/invite/:token" element={<AcceptInvitePage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectOverviewPage />} />
          <Route path="/projects/:projectId/issues" element={<IssuesPage />} />
          <Route path="/projects/:projectId/issues/:issueId" element={<IssueDetailPage />} />
          <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
          <Route path="/projects/:projectId/performance" element={<PerformancePage />} />
          <Route path="/projects/:projectId/dashboards" element={<DashboardsPage />} />
          <Route path="/projects/:projectId/replays" element={<ReplaysPage />} />
          <Route path="/projects/:projectId/alerts" element={<AlertRulesPage />} />
          <Route path="/integrations" element={<IntegrationsLayout />}>
            <Route index element={<IntegrationsPage />} />
            <Route path="mcp" element={<McpPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
          </Route>
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/settings/profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="account" element={<GeneralPage />} />
            <Route path="account/projects" element={<AccountProjectsPage />} />
            <Route path="account/team" element={<TeamPage />} />
            <Route path="account/data" element={<DataPage />} />
          </Route>
          <Route path="/team" element={<Navigate to="/settings/account/team" replace />} />
          <Route path="/security" element={<Navigate to="/settings/security" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
