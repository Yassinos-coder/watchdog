import { Navigate, Route, Routes } from 'react-router-dom';
import { AlertRulesPage } from '@/features/alerts/pages/AlertRulesPage';
import { IntegrationsPage } from '@/features/alerts/pages/IntegrationsPage';
import { MfaChallengePage } from '@/features/auth/pages/MfaChallengePage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { MfaSetupPage } from '@/features/auth/pages/MfaSetupPage';
import { SecurityPage } from '@/features/auth/pages/SecurityPage';
import { SetupPage } from '@/features/auth/pages/SetupPage';
import { RequireAuth } from '@/features/auth/routes/RequireAuth';
import { IssueDetailPage } from '@/features/issues/pages/IssueDetailPage';
import { IssuesPage } from '@/features/issues/pages/IssuesPage';
import { ProjectOverviewPage } from '@/features/issues/pages/ProjectOverviewPage';
import { ProjectSettingsPage } from '@/features/projects/pages/ProjectSettingsPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import { HomeRedirect } from '@/features/projects/routes/HomeRedirect';
import { AppShell } from '@/layout/AppShell';

export function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/verify" element={<MfaChallengePage />} />
      <Route path="/security/setup" element={<MfaSetupPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectOverviewPage />} />
          <Route path="/projects/:projectId/issues" element={<IssuesPage />} />
          <Route path="/projects/:projectId/issues/:issueId" element={<IssueDetailPage />} />
          <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
          <Route path="/projects/:projectId/alerts" element={<AlertRulesPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/security" element={<SecurityPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
