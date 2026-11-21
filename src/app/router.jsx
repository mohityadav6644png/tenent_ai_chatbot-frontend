import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './routes.constants.js';
import { ProtectedRoute } from './guards/ProtectedRoute.jsx';
import { RoleRoute } from './guards/RoleRoute.jsx';
import { ForgotPasswordPage, LoginPage } from '../features/auth/index.js';
import { ChatPage } from '../features/chat/index.js';
import {
  AddFilePage,
  CompanyFilesPage,
  EditFilePage,
  InviteUserPage,
  UsersPage,
} from '../features/company-admin/index.js';
import { CompanyDataPage } from '../features/company-admin/pages/CompanyDataPage.jsx';
import { ImportDataPage } from '../features/company-admin/pages/ImportDataPage.jsx';
import {
  OnboardCompanyPage,
  PlatformPlaceholderPage,
  SystemHealthPage,
  TenantDetailPage,
  TenantsPage,
} from '../features/platform-admin/index.js';
import { ReportsPage } from '../features/reports/index.js';
import { AppLayout } from '../shared/layouts/AppLayout.jsx';
import { AuthLayout } from '../shared/layouts/AuthLayout.jsx';
import { PlatformLayout } from '../shared/layouts/PlatformLayout.jsx';
import { ROLES } from '../shared/constants/roles.js';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route element={<PlatformLayout />}>
              <Route path={ROUTES.PLATFORM_TENANTS} element={<TenantsPage />} />
              <Route path={ROUTES.PLATFORM_TENANT_NEW} element={<OnboardCompanyPage />} />
              <Route
                path={`${ROUTES.PLATFORM_TENANTS}/:tenantId`}
                element={<TenantDetailPage />}
              />
              <Route
                path={ROUTES.PLATFORM_SYSTEM_HEALTH}
                element={<SystemHealthPage />}
              />
              <Route
                path={ROUTES.PLATFORM_USAGE}
                element={<PlatformPlaceholderPage title="Usage and costs" />}
              />
              <Route
                path={ROUTES.PLATFORM_AUDIT}
                element={<PlatformPlaceholderPage title="Audit log" />}
              />
            </Route>
          </Route>
          <Route element={<RoleRoute allowedRoles={[ROLES.EMPLOYEE, ROLES.COMPANY_ADMIN]} />}>
            <Route path={ROUTES.CHAT} element={<ChatPage />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.CHAT} replace />} />
            <Route element={<RoleRoute allowedRoles={[ROLES.COMPANY_ADMIN]} />}>
              <Route path={ROUTES.ADMIN_USERS} element={<UsersPage />} />
              <Route
                path={`${ROUTES.ADMIN_USERS}/invite`}
                element={<InviteUserPage />}
              />
            </Route>
            <Route element={<RoleRoute allowedRoles={[ROLES.COMPANY_ADMIN]} />}>
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={[ROLES.COMPANY_ADMIN]} />}>
              <Route path={ROUTES.COMPANY_DATA} element={<CompanyFilesPage />} />
              <Route path={ROUTES.COMPANY_DATA_NEW} element={<AddFilePage />} />
              <Route path="/admin/company-data/:fileId/edit" element={<EditFilePage />} />
              <Route path={ROUTES.COMPANY_DATA_LEGACY_DATASETS} element={<ImportDataPage />} />
              <Route path={ROUTES.COMPANY_DATA_LEGACY_RECORDS} element={<CompanyDataPage />} />
              <Route path={ROUTES.COMPANY_DATA_ADD} element={<Navigate to={ROUTES.COMPANY_DATA} replace />} />
              <Route path={ROUTES.COMPANY_DATA_RECORDS} element={<Navigate to={ROUTES.COMPANY_DATA_LEGACY_RECORDS} replace />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
